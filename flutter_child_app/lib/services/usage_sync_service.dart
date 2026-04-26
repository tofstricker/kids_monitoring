import 'package:flutter/services.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class UsageSyncService {
  static const platform = MethodChannel('com.example.kitecontrol/usage');
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Fetch native stats and sync to Firestore
  Future<void> syncUsageStats() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return;

      // 1. Get stats from Native Android
      final List<dynamic> stats = await platform.invokeMethod('getUsageStats');
      
      // 2. Prepare batch update
      final batch = _db.batch();
      final todayStr = DateTime.now().toIso8601String().split('T')[0];

      for (var stat in stats) {
        final Map<String, dynamic> data = Map<String, dynamic>.from(stat);
        final String packageName = data['packageName'];
        
        // Use a deterministic document ID to prevent duplicate logs for the same day
        final logId = "${user.uid}_${packageName}_$todayStr";
        final docRef = _db.collection('usage_logs').doc(logId);

        batch.set(docRef, {
          'userId': user.uid,
          'packageName': packageName,
          'appName': data['appName'],
          'durationMinutes': (data['usageTimeMs'] / 60000).round(),
          'lastUsed': Timestamp.fromMillisecondsSinceEpoch(data['lastTimeUsed']),
          'date': todayStr,
          'syncedAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      }

      // 3. Commit to Firebase
      await batch.commit();
      print("Usage stats synced successfully for ${stats.length} apps.");
    } on PlatformException catch (e) {
      print("Failed to get usage stats: '${e.message}'.");
    } catch (e) {
      print("Usage sync error: $e");
    }
  }
}
