import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:math';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Generate a Pairing Code (Parent Side)
  Future<String?> generatePairingCode(String familyId, String parentId) async {
    final String code = (Random().nextInt(900000) + 100000).toString();
    
    try {
      await _db.collection('pairing_codes').add({
        'code': code,
        'familyId': familyId,
        'createdBy': parentId,
        'expiresAt': Timestamp.fromDate(DateTime.now().add(Duration(minutes: 30))),
        'isUsed': false,
      });
      return code;
    } catch (e) {
      print("Firestore Service Error (Generate Code): $e");
    }
    return null;
  }

  // Consume a Pairing Code (Child Side)
  Future<bool> linkChildWithCode(String code, String childUid) async {
    try {
      // 1. Find a valid, unused code
      final query = await _db.collection('pairing_codes')
          .where('code', isEqualTo: code)
          .where('isUsed', isEqualTo: false)
          .where('expiresAt', isGreaterThan: Timestamp.now())
          .limit(1)
          .get();

      if (query.docs.isEmpty) {
        throw Exception("Invalid or expired code");
      }

      final doc = query.docs.first;
      final familyId = doc.data()['familyId'];

      // 2. Perform atomic update using a Batch
      WriteBatch batch = _db.batch();
      
      // Update the code to mark as used
      batch.update(doc.reference, {'isUsed': true});
      
      // Update the child's familyId
      batch.update(_db.collection('users').doc(childUid), {
        'familyId': familyId,
      });

      await batch.commit();
      return true;
    } catch (e) {
      print("Firestore Service Error (Link Child): $e");
      return false;
    }
  }

  // Get Children for a Family
  Stream<List<Map<String, dynamic>>> getChildren(String familyId) {
    return _db.collection('users')
      .where('familyId', isEqualTo: familyId)
      .where('role', isEqualTo: 'CHILD')
      .snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => doc.data()..addAll({'id': doc.id})).toList());
  }

  // Get Usage Logs for a Child
  Stream<List<Map<String, dynamic>>> getUsageLogs(String childId) {
    return _db.collection('usage_logs')
      .where('userId', isEqualTo: childId)
      .orderBy('date', descending: true)
      .limit(20)
      .snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
  }

  // Geofencing Methods
  Future<void> addGeofence(Map<String, dynamic> data) async {
    await _db.collection('geofences').add(data);
  }

  Stream<List<Map<String, dynamic>>> getGeofences(String familyId) {
    return _db.collection('geofences')
      .where('familyId', isEqualTo: familyId)
      .snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => doc.data()..addAll({'id': doc.id})).toList());
  }

  Stream<List<Map<String, dynamic>>> getChildLocations(String familyId) {
    // In our simplified logic, locations are in a flat collection with userId
    return _db.collection('locations')
      .orderBy('timestamp', descending: true)
      .limit(50) // Adjust as needed
      .snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
  }

  Future<Map<String, dynamic>> getUserDoc(String uid) async {
    final doc = await _db.collection('users').doc(uid).get();
    return doc.data() ?? {};
  }

  // Bedtime Management
  Stream<Map<String, dynamic>?> getBedtimeLimit(String childId) {
    return _db.collection('limits')
      .where('targetId', isEqualTo: childId)
      .where('type', isEqualTo: 'BEDTIME')
      .snapshots()
      .map((snapshot) => snapshot.docs.isNotEmpty ? snapshot.docs.first.data() : null);
  }

  Future<void> updateBedtimeLimit(String childId, bool isEnabled, String value) async {
    final query = await _db.collection('limits')
      .where('targetId', isEqualTo: childId)
      .where('type', isEqualTo: 'BEDTIME')
      .limit(1)
      .get();

    if (query.docs.isEmpty) {
      await _db.collection('limits').add({
        'targetId': childId,
        'type': 'BEDTIME',
        'value': value,
        'isEnabled': isEnabled,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } else {
      await query.docs.first.reference.update({
        'value': value,
        'isEnabled': isEnabled,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }
  }

  // Notification Settings
  Stream<Map<String, dynamic>> getNotificationSettings(String familyId) {
    return _db.collection('family_settings')
      .doc(familyId)
      .snapshots()
      .map((snapshot) => snapshot.data() ?? {
        'notifySafeEnter': true,
        'notifySafeLeave': true,
        'notifyRestrictedEnter': true,
        'notifyRestrictedLeave': true,
      });
  }

  Future<void> updateNotificationSettings(String familyId, Map<String, bool> settings) async {
    await _db.collection('family_settings').doc(familyId).set(settings, SetOptions(merge: true));
  }

  // Camera snapshots
  Future<void> requestSnapshot(String childId) async {
    await _db.collection('snapshot_requests').add({
      'childId': childId,
      'requestedAt': FieldValue.serverTimestamp(),
      'status': 'PENDING',
    });
  }

  Stream<List<Map<String, dynamic>>> getSnapshots(String childId) {
    return _db.collection('snapshots')
      .where('childId', isEqualTo: childId)
      .orderBy('timestamp', descending: true)
      .limit(5)
      .snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
  }

  // Smart Rules
  Stream<List<Map<String, dynamic>>> getSmartRules(String familyId) {
    return _db.collection('smart_rules')
      .where('familyId', isEqualTo: familyId)
      .snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => doc.data()..addAll({'id': doc.id})).toList());
  }

  Future<void> addSmartRule(Map<String, dynamic> data) async {
    await _db.collection('smart_rules').add(data);
  }

  Future<void> deleteSmartRule(String ruleId) async {
    await _db.collection('smart_rules').doc(ruleId).delete();
  }

  Future<void> toggleSmartRule(String ruleId, bool isEnabled) async {
    await _db.collection('smart_rules').doc(ruleId).update({'isEnabled': isEnabled});
  }
}
