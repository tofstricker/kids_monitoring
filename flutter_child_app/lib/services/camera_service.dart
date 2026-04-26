import 'package:camera/camera.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:convert';
import 'dart:io';

class CameraService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  void startSnapshotListener() {
    final user = _auth.currentUser;
    if (user == null) return;

    _db.collection('snapshot_requests')
      .where('childId', isEqualTo: user.uid)
      .where('status', isEqualTo: 'PENDING')
      .snapshots()
      .listen((snapshot) async {
        for (var doc in snapshot.docs) {
          // Process request
          await _takeAndUploadSnapshot(doc.id);
        }
      });
  }

  Future<void> _takeAndUploadSnapshot(String requestId) async {
    try {
      // 1. Initialize Camera
      final cameras = await availableCameras();
      if (cameras.isEmpty) return;

      final controller = CameraController(cameras.first, ResolutionPreset.medium, enableAudio: false);
      await controller.initialize();

      // 2. Take Picture
      final XFile image = await controller.takePicture();
      
      // 3. Convert to Base64 (Demo constraint - no storage)
      final bytes = await File(image.path).readAsBytes();
      final base64Image = "data:image/jpeg;base64,${base64Encode(bytes)}";

      // 4. Upload to Firestore
      final user = _auth.currentUser;
      if (user != null) {
        await _db.collection('snapshots').add({
          'childId': user.uid,
          'imageUrl': base64Image,
          'timestamp': FieldValue.serverTimestamp(),
        });
      }

      // 5. Mark request as COMPLETED
      await _db.collection('snapshot_requests').doc(requestId).update({'status': 'COMPLETED'});
      
      // 6. Cleanup
      await controller.dispose();
      await File(image.path).delete();
    } catch (e) {
      print("Camera Sync Error: $e");
      await _db.collection('snapshot_requests').doc(requestId).update({'status': 'FAILED'});
    }
  }
}
