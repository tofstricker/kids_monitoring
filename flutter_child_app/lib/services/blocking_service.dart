import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/services.dart';

import 'package:http/http.dart' as http;
import 'dart:convert';

class BlockingService {
  static const platform = MethodChannel('com.example.kitecontrol/blocking');
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Set<String> _explicitlyBlocked = {};
  Map<String, int> _timeLimits = {}; // packageName -> minutes
  Map<String, int> _todayUsage = {}; // packageName -> minutes
  Set<String> _notifiedApps = {}; // To prevent spamming notifications
  bool _isBedtimeNow = false;
  String? _lastBedtimeValue;

  void startEnforcementEngine() {
    final user = _auth.currentUser;
    if (user == null) return;

    final todayStr = DateTime.now().toIso8601String().split('T')[0];

    // --- SELF PROTECTION LOGIC ---
    // Monitor window events from native accessibility service
    // If child opens Settings -> App Info -> KiteControl, we immediately block/redirect.
    _db.collection('users').doc(user.uid).snapshots().listen((snap) {
      if (snap.exists) {
        final data = snap.data()!;
        if (data['forceClose'] == true) {
           _updateNativeBlockList(["*"]); // Global Lockdown
        }
      }
    });

    // 1. Watch Limits (App Blocks, Time Limits, and Bedtime)
    _db.collection('limits')
      .where('targetId', isEqualTo: user.uid)
      .where('isEnabled', isEqualTo: true)
      .snapshots()
      .listen((snapshot) {
        _explicitlyBlocked.clear();
        _timeLimits.clear();
        _isBedtimeNow = false;
        _lastBedtimeValue = null;

        for (var doc in snapshot.docs) {
          final data = doc.data();
          final String type = data['type'];
          final String? packageName = data['packageName'];
          final dynamic value = data['value'];

          if (type == 'APP_BLOCK' && value is String) {
            _explicitlyBlocked.add(value);
          } else if (type == 'SCREEN_TIME' && packageName != null) {
            _timeLimits[packageName] = int.tryParse(value.toString()) ?? 0;
          } else if (type == 'BEDTIME' && value is String) {
            _lastBedtimeValue = value;
            _isBedtimeNow = _checkIfBedtime(value);
          }
        }
        _reevaluateBlocking();
      });

    // Periodically re-check bedtime (every minute)
    Stream.periodic(Duration(minutes: 1)).listen((_) {
      if (_lastBedtimeValue != null) {
        final nowIsBedtime = _checkIfBedtime(_lastBedtimeValue!);
        if (nowIsBedtime != _isBedtimeNow) {
          _isBedtimeNow = nowIsBedtime;
          _reevaluateBlocking();
        }
      }
    });

    // 2. Watch Today's Usage
    _db.collection('usage_logs')
      .where('userId', isEqualTo: user.uid)
      .where('date', isEqualTo: todayStr)
      .snapshots()
      .listen((snapshot) {
        _todayUsage.clear();
        for (var doc in snapshot.docs) {
          final data = doc.data();
          _todayUsage[data['packageName']] = data['durationMinutes'] ?? 0;
        }
        _reevaluateBlocking();
      });
  }

  void _reevaluateBlocking() {
    if (_isBedtimeNow) {
      // During bedtime, we block everything.
      // On Android, we can signal the accessibility service to enter "Lockdown Mode".
      _updateNativeBlockList(["*"]); // "*" is my sentinel for global lock
      return;
    }

    Set<String> finalBlockList = Set.from(_explicitlyBlocked);
    final user = _auth.currentUser;

    // Add apps that exceeded their screen time limit
    _timeLimits.forEach((packageName, limitMinutes) {
      final currentUsage = _todayUsage[packageName] ?? 0;
      if (currentUsage >= limitMinutes) {
        finalBlockList.add(packageName);
        
        // Notify Parent if not already notified for this block
        if (!_notifiedApps.contains(packageName) && user != null) {
          _sendParentNotification(
            "Limit Reached", 
            "Child has used up their time for ${packageName} for today."
          );
          _notifiedApps.add(packageName);
        }
      }
    });

    _updateNativeBlockList(finalBlockList.toList());
  }

  Future<void> _sendParentNotification(String title, String body) async {
    try {
      final user = _auth.currentUser;
      if (user == null) return;

      // 1. Fetch the Child's user doc to get the familyId (Parent UID)
      final userDoc = await _db.collection('users').doc(user.uid).get();
      final parentId = userDoc.data()?['familyId'];

      if (parentId != null) {
        // 2. Call our secure backend endpoint
        await http.post(
          Uri.parse('/api/notify-parent'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'targetUid': parentId,
            'title': title,
            'body': body,
          }),
        );
      }
    } catch (e) {
      print("Failed to notify parent: $e");
    }
  }

  Future<void> _updateNativeBlockList(List<String> packages) async {
    try {
      await platform.invokeMethod('setBlockedApps', {'packages': packages});
      print("Native enforcement updated: ${packages.length} apps restricted.");
    } on PlatformException catch (e) {
      print("Native sync failed: ${e.message}");
    }
  }

  bool _checkIfBedtime(String range) {
    try {
      final times = range.split('-');
      if (times.length != 2) return false;

      final now = DateTime.now();
      final currentMinutes = now.hour * 60 + now.minute;

      final startParts = times[0].split(':');
      final endParts = times[1].split(':');

      final startMinutes = int.parse(startParts[0]) * 60 + int.parse(startParts[1]);
      final endMinutes = int.parse(endParts[0]) * 60 + int.parse(endParts[1]);

      if (startMinutes < endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
      } else {
        // Range spans midnight (e.g., 21:00 to 07:00)
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }
    } catch (e) {
      print("Bedtime Check Error: $e");
      return false;
    }
  }
}
