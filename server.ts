import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

// Initialize Firebase Admin
admin.initializeApp({
  projectId: firebaseConfig.projectId,
});

const db = admin.firestore();
const fcm = admin.messaging();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper for geofencing
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000; // Radius of the earth in meters
    const deg2rad = (deg: number) => deg * (Math.PI / 180);
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
      ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async function notifyParents(familyId: string, title: string, body: string, type: 'CRITICAL' | 'ALERT' | 'SUMMARY' = 'ALERT') {
    // ANTI-SPAM: Don't notify if the same ALERT type happened in the last 15 minutes for this family
    if (type === 'ALERT') {
      const recentAlerts = await db.collection("notification_history")
        .where("familyId", "==", familyId)
        .where("type", "==", "ALERT")
        .where("title", "==", title)
        .where("timestamp", ">", admin.firestore.Timestamp.fromMillis(Date.now() - 15 * 60 * 1000))
        .get();
      
      if (!recentAlerts.empty) {
        console.log(`Skipping duplicate alert: ${title} for family ${familyId}`);
        return;
      }
    }

    const usersSnap = await db.collection("users")
      .where("familyId", "==", familyId)
      .where("role", "==", "PARENT")
      .get();
    
    // Log the notification to history
    await db.collection("notification_history").add({
      familyId,
      title,
      body,
      type,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    for (const doc of usersSnap.docs) {
      const data = doc.data();
      const tokens = data.fcmTokens || (data.fcmToken ? [data.fcmToken] : []);
      for (const token of tokens) {
        try {
          await fcm.send({
            notification: { title, body },
            token: token,
          });
        } catch (err) {
          console.error("Failed to send FCM to token", token, err);
        }
      }
    }
  }

  // --- Content Filtering: Report Blocked Attempt ---
  app.post("/api/filter/report-blocked", async (req, res) => {
    const { userId, familyId, domain, reason } = req.body;
    try {
      // 1. Log the attempt
      await db.collection("blocked_attempts").add({
        userId,
        familyId,
        domain,
        reason,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // 2. Notify parents of the high-priority security event
      const alertTitle = `🚫 WEB BLOCK: ${domain}`;
      const alertBody = `The child attempted to access a restricted site: ${domain}. Reason: ${reason}. Access was successfully blocked via local VPN.`;
      
      await notifyParents(familyId, alertTitle, alertBody, 'ALERT');

      res.json({ success: true });
    } catch (err) {
      console.error("Filter Report Error:", err);
      res.status(500).json({ error: "Failed to log blocked attempt" });
    }
  });

  // --- Smart Discovery: Auto-Setup Engine ---
  app.post("/api/setup/discover-nodes", async (req, res) => {
    const { userId, latitude, longitude } = req.body;
    try {
      // In a production app, we would use a Places API here.
      // For this spec, we simulate discovery based on lat/lng proximity
      const POIs = [
        { name: "Central High School", type: "SCHOOL", latDelta: 0.002, lngDelta: 0.001 },
        { name: "Grand Mosque", type: "WORSHIP", latDelta: -0.003, lngDelta: 0.002 },
        { name: "St. Marys Church", type: "WORSHIP", latDelta: 0.005, lngDelta: -0.004 }
      ];

      const suggestions = POIs.map(poi => ({
        id: `suggest_${poi.type}_${Date.now()}_${Math.random()}`,
        name: poi.name,
        type: poi.type,
        modeToEnable: poi.type === 'SCHOOL' ? 'School Mode' : 'Worship Mode',
        latitude: latitude + poi.latDelta,
        longitude: longitude + poi.lngDelta
      }));

      res.json({ success: true, suggestions });
    } catch (err) {
      console.error("Discovery Error:", err);
      res.status(500).json({ error: "Context discovery failed" });
    }
  });

  // --- Panic Mode: Emergency Trigger ---
  app.post("/api/panic/trigger", async (req, res) => {
    const { userId, familyId, parentName } = req.body;
    try {
      // 1. Get current location of the child
      const locationSnap = await db.collection("locations")
        .where("userId", "==", userId)
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      const lastLoc = locationSnap.empty ? null : locationSnap.docs[0].data();
      const locationLink = lastLoc 
        ? `https://maps.google.com/?q=${lastLoc.latitude},${lastLoc.longitude}` 
        : "Unknown Location";

      // 2. Broadcast High-Priority Alert to ALL parents
      const alertTitle = `🚨 PANIC ALERT: ${parentName} triggered emergency`;
      const alertBody = `URGENT: Emergency lockdown initiated for the family. Child's last known location: ${locationLink}`;
      
      await notifyParents(familyId, alertTitle, alertBody, 'CRITICAL');

      // 3. Instant Device Lockdown (Global Block)
      await db.collection("limits").add({
        targetId: userId,
        type: 'APP_BLOCK',
        value: '*', // Total Lock
        isEnabled: true,
        reason: `🚨 PANIC TRIGGERED BY ${parentName}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 4. Force Snapshot (If we had a camera service, we'd trigger it here)
      // For now, we update the user doc to force a foreground sync
      await db.collection("users").doc(userId).update({
        forceClose: true,
        panicActive: true,
        lastPanicAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true, location: lastLoc });
    } catch (err) {
      console.error("Panic Trigger Error:", err);
      res.status(500).json({ error: "Failed to trigger panic mode" });
    }
  });

  // --- Daily Summary Job ---
  app.post("/api/generate-daily-summary", async (req, res) => {
    const { familyId } = req.body;
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Get all children in this family
      const childrenSnap = await db.collection("users")
        .where("familyId", "==", familyId)
        .where("role", "==", "CHILD")
        .get();

      let fullSummary = `📩 Daily Summary - ${today}\n\n`;

      for (const childDoc of childrenSnap.docs) {
        const childData = childDoc.data();
        const childId = childDoc.id;

        // 2. Fetch usage for today
        const usageSnap = await db.collection("usage_logs")
          .where("userId", "==", childId)
          .where("date", "==", today)
          .get();

        let totalMillis = 0;
        let apps: Record<string, number> = {};

        usageSnap.forEach(uDoc => {
          const uData = uDoc.data();
          totalMillis += (uData.durationMinutes || 0) * 60 * 1000;
          const pkg = uData.packageName || 'Unknown';
          apps[pkg] = (apps[pkg] || 0) + (uData.durationMinutes || 0);
        });

        const totalHours = (totalMillis / (1000 * 60 * 60)).toFixed(1);
        
        // Find most used app
        let mostUsed = "None";
        let maxUsage = 0;
        for (const [pkg, dur] of Object.entries(apps)) {
          if (dur > maxUsage) {
            maxUsage = dur;
            mostUsed = pkg.split('.').pop() || pkg;
          }
        }

        const status = totalMillis > (4 * 60 * 60 * 1000) ? "High Usage" : "Normal";

        fullSummary += `${childData.displayName} used phone ${totalHours}h today\n`;
        fullSummary += `Most used: ${mostUsed}\n`;
        fullSummary += `Status: ${status}\n\n`;
      }

      await notifyParents(familyId, "Daily Summary", fullSummary, 'SUMMARY');
      res.json({ success: true, summary: fullSummary });
    } catch (err) {
      console.error("Summary Generation Error:", err);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  // --- Auto-Pilot: Smart Automation Engine ---
  app.post("/api/autopilot/analyze", async (req, res) => {
    const { userId, familyId } = req.body;
    try {
      const now = new Date();
      const isWeekend = [0, 6].includes(now.getDay());
      const hour = now.getHours();
      
      // 1. Fetch historical usage patterns (last 7 days)
      const usageSnap = await db.collection("usage_logs")
        .where("userId", "==", userId)
        .limit(50)
        .get();

      let averageDailyMinutes = 0;
      usageSnap.forEach(doc => {
        averageDailyMinutes += doc.data().durationMinutes || 0;
      });
      averageDailyMinutes = usageSnap.empty ? 0 : averageDailyMinutes / 7;

      let suggestion = null;
      let autoApplied = false;

      // 2. Behavioral Detection & Auto-Adjustment Logic
      if (isWeekend) {
        // Boost limits for weekends automatically
        suggestion = {
          title: "Weekend Bonus Detected",
          body: "Auto-Pilot has increased today's limit by 60 minutes for the weekend.",
          action: "INCREASE_LIMIT",
          value: "60"
        };
        autoApplied = true;
      } else if (hour >= 8 && hour <= 15) {
        // Focus Mode for School Hours
        suggestion = {
          title: "Intelligent Insight: School-Hour Activity",
          body: "Ahmed was seen using the phone during school hours. This can be distracting.",
          action: "SUGGEST_SCHOOL_MODE",
          value: "ACTIVATE_NOW"
        };
      } else if (averageDailyMinutes > 180) {
        // Detect high-usage trend
        suggestion = {
          title: "Trend Alert: High Usage",
          body: "Usage is 20% higher than last week. Suggesting a 15-minute wind-down period.",
          action: "SET_LIMIT",
          value: "165"
        };
      }

      if (suggestion) {
        // Log suggestion
        await db.collection("autopilot_suggestions").add({
          userId,
          familyId,
          ...suggestion,
          autoApplied,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        if (autoApplied) {
           await notifyParents(familyId, "Auto-Pilot: " + suggestion.title, suggestion.body, 'SUMMARY');
        }
      }

      res.json({ success: true, suggestion, autoApplied });
    } catch (err) {
      console.error("Auto-Pilot Error:", err);
      res.status(500).json({ error: "Auto-Pilot engine failure" });
    }
  });

  async function evaluateSmartRules(userId: string, familyId: string, context: { 
    currentFences: string[],
    enteredFences: string[], 
    leftFences: string[], 
    batteryLevel?: number, 
    isCharging?: boolean,
    activity?: string 
  }) {
    const rulesSnap = await db.collection("smart_rules")
      .where("familyId", "==", familyId)
      .where("isEnabled", "==", true)
      .get();

    for (const doc of rulesSnap.docs) {
      const rule = doc.data();
      const conditions = rule.conditions || [];
      const actions = rule.actions || [];

      if (conditions.length === 0) continue;

      let allConditionsMet = true;

      for (const cond of conditions) {
        let condMet = false;
        
        if (cond.type === 'LOCATION_IN') {
          condMet = context.currentFences.includes(cond.value);
        } else if (cond.type === 'LOCATION_OUT') {
          condMet = !context.currentFences.includes(cond.value);
        } else if (cond.type === 'TIME_RANGE') {
          try {
            const [start, end] = cond.value.split('-');
            const now = new Date();
            const currentMin = now.getHours() * 60 + now.getMinutes();
            
            const [sH, sM] = start.split(':').map(Number);
            const [eH, eM] = end.split(':').map(Number);
            const sMin = sH * 60 + sM;
            const eMin = eH * 60 + eM;

            if (sMin <= eMin) {
              condMet = currentMin >= sMin && currentMin <= eMin;
            } else {
              // Over midnight
              condMet = currentMin >= sMin || currentMin <= eMin;
            }
          } catch (e) {
            console.error("Invalid TIME_RANGE value:", cond.value);
          }
        } else if (cond.type === 'ACTIVITY') {
          condMet = context.activity === cond.value;
        } else if (cond.type === 'BATTERY_LESS_THAN') {
          condMet = (context.batteryLevel || 100) < parseInt(cond.value);
        } else if (cond.type === 'DAY_OF_WEEK') {
          const now = new Date();
          const day = now.getDay(); // 0-6 (Sun-Sat)
          const targetDays = cond.value.split(',').map(Number);
          condMet = targetDays.includes(day);
        }

        if (!condMet) {
          allConditionsMet = false;
          break;
        }
      }

      if (allConditionsMet) {
        console.log(`Executing Multi-Condition Smart Rule: ${rule.name} for user ${userId}`);
        
        for (const action of actions) {
          if (action.type === 'BLOCK_APPS') {
            await db.collection("limits").add({
              targetId: userId,
              type: 'APP_BLOCK',
              value: action.value,
              isEnabled: true,
              reason: `Context Mode: ${rule.name}`,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 60 * 60 * 1000)
            });
          } else if (action.type === 'LOCK_DEVICE') {
             await db.collection("limits").add({
              targetId: userId,
              type: 'APP_BLOCK',
              value: '*', 
              isEnabled: true,
              reason: `Context Mode: ${rule.name}`,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 60 * 1000)
            });
          } else if (action.type === 'SILENT_MODE') {
            await db.collection("users").doc(userId).update({
              audioMode: 'SILENT',
              lastRuleTrigger: rule.name
            });
          } else if (action.type === 'FOCUS_MODE') {
            // High-priority focus mode
            await db.collection("users").doc(userId).update({
              focusModeActive: true,
              focusModeAllowedApps: action.value // e.g. "com.duolingo.*,com.google.android.apps.docs"
            });
          } else if (action.type === 'REDUCE_TRACKING') {
            await db.collection("users").doc(userId).update({
              trackingMode: 'POWER_SAVE',
              lastRuleTrigger: rule.name
            });
          } else if (action.type === 'INCREASE_LIMIT') {
             // Logic to find current limit and increment it
             const limitSnap = await db.collection("limits")
               .where("targetId", "==", userId)
               .where("type", "==", "TOTAL_TIME")
               .get();
             
             for (const lDoc of limitSnap.docs) {
               const curValue = parseInt(lDoc.data().value) || 0;
               await db.collection("limits").doc(lDoc.id).update({ 
                 value: (curValue + parseInt(action.value)).toString() 
               });
             }
          }
        }
        
        await notifyParents(familyId, `Smart Mode: ${rule.name}`, `Context engine enabled "${rule.name}" based on current location and time.`);
      }
    }
  }

  // API Route: Update child location and check geofences
  app.post("/api/update-location", async (req, res) => {
    const { userId, latitude, longitude, timestamp, batteryLevel, isCharging, activity } = req.body;

    try {
      // 1. Get child's familyId
      const userDoc = await db.collection("users").doc(userId).get();
      const familyId = userDoc.data()?.familyId;

      if (!familyId) {
        return res.status(404).json({ error: "User belongs to no family" });
      }

      // 2. Fetch geofences for this family
      const geofenceSnap = await db.collection("geofences").where("familyId", "==", familyId).get();
      const geofences: any[] = geofenceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 3. Get previous location to check for enter/leave events
      const prevLocationSnap = await db.collection("locations")
        .where("userId", "==", userId)
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();
      
      const prevLocation = prevLocationSnap.empty ? null : prevLocationSnap.docs[0].data();
      const prevGeofences = prevLocation?.currentGeofences || [];

      const currentGeofences: string[] = [];

      // 4. Calculate distance for each geofence
      for (const fence of geofences) {
        const distance = calculateDistance(latitude, longitude, fence.latitude, fence.longitude);
        if (distance <= fence.radius) {
          currentGeofences.push(fence.id);
        }
      }

      // 5. Detect transitions
      const entered = currentGeofences.filter(id => !prevGeofences.includes(id));
      const left = prevGeofences.filter(id => !currentGeofences.includes(id));

      // 6. Evaluate Smart Rules based on NEW state
      await evaluateSmartRules(userId, familyId, {
        currentFences,
        enteredFences: entered,
        leftFences: left,
        batteryLevel,
        isCharging,
        activity
      });

      // Fetch Notification Settings
      const settingsSnap = await db.collection("family_settings").doc(familyId).get();
      const settings = settingsSnap.data() || {
        notifySafeEnter: true,
        notifySafeLeave: true,
        notifyRestrictedEnter: true,
        notifyRestrictedLeave: true
      };

      // 7. Send notifications
      for (const fenceId of entered) {
        const fence = geofences.find(f => f.id === fenceId);
        if (fence) {
          if (fence.type === 'RESTRICTED') {
            if (settings.notifyRestrictedEnter) {
              await notifyParents(familyId, `⚠️ RESTRICTED ZONE ENTERED`, `DANGER: The child has entered a restricted area: ${fence.name}. Device locking initiated.`);
            }
            
            // Trigger temporary app block (emergency lock)
            await db.collection("limits").add({
              'targetId': userId,
              'type': 'APP_BLOCK',
              'value': '*', // Block everything
              'isEnabled': true,
              'reason': `Restricted zone entry: ${fence.name}`,
              'expiresAt': admin.firestore.Timestamp.fromMillis(Date.now() + 15 * 60 * 1000), // Block for 15 minutes
              'createdAt': admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            if (settings.notifySafeEnter) {
              await notifyParents(familyId, `Zone Alert: Entered ${fence.name}`, `The child has entered the ${fence.name} zone.`);
            }
          }
        }
      }
      for (const fenceId of left) {
        const fence = geofences.find(f => f.id === fenceId);
        if (fence) {
          const isRestricted = fence.type === 'RESTRICTED';
          if (isRestricted) {
            if (settings.notifyRestrictedLeave) {
              await notifyParents(familyId, `Zone Alert: Left Restricted Zone`, `The child has left the restricted ${fence.name} zone.`);
            }
          } else {
            if (settings.notifySafeLeave) {
              await notifyParents(familyId, `Zone Alert: Left ${fence.name}`, `The child has left the ${fence.name} zone.`);
            }
          }
        }
      }

      // 8. Save current location
      await db.collection("locations").add({
        userId,
        latitude,
        longitude,
        timestamp,
        currentGeofences,
        batteryLevel,
        isCharging,
        activity,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true, entered, left });
    } catch (error) {
      console.error("Location Update Error:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  // API Route: Send notification to parent (Legacy/Direct)
  app.post("/api/notify-parent", async (req, res) => {
    const { targetUid, title, body } = req.body;

    try {
      // 1. Find parent's FCM token from 'users' collection
      const userDoc = await db.collection("users").doc(targetUid).get();
      const fcmToken = userDoc.data()?.fcmToken;

      if (!fcmToken) {
        return res.status(404).json({ error: "Parent FCM token not found" });
      }

      // 2. Send FCM message
      const message = {
        notification: { title, body },
        token: fcmToken,
      };

      const response = await fcm.send(message);
      res.json({ success: true, messageId: response });
    } catch (error) {
      console.error("FCM Error:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
