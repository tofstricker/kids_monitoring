import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class NotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Future<void> initialize() async {
    // 1. Request Permissions (Specifically for iOS/Android 13+)
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // 2. Get FCM Token
      String? token = await _fcm.getToken();
      if (token != null) {
        _saveTokenToFirestore(token);
      }
    }

    // 3. Listen for token refreshes
    _fcm.onTokenRefresh.listen(_saveTokenToFirestore);

    // 4. Handle Foreground Messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print("Notification Received: ${message.notification?.title}");
      // Show local notification if needed
    });
  }

  Future<void> _saveTokenToFirestore(String token) async {
    final user = _auth.currentUser;
    if (user != null) {
      await _db.collection('users').doc(user.uid).update({
        'fcmToken': token,
        'lastTokenUpdate': FieldValue.serverTimestamp(),
      });
    }
  }
}
