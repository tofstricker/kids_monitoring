import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'services/blocking_service.dart';
import 'services/usage_sync_service.dart';
import 'services/camera_service.dart';
import 'screens/permission_screen.dart';
import 'dart:async';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // Configure Offline Persistence for Reliable Rule Enforcement
  FirebaseFirestore.instance.settings = const Settings(
    persistenceEnabled: true,
    cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
  );
  
  // Initialize Enforcement Engines
  final blocking = BlockingService();
  final usage = UsageSyncService();
  final camera = CameraService();
  
  blocking.startEnforcementEngine();
  camera.startSnapshotListener();
  
  // Setup periodic usage syncing (every 5 minutes)
  Timer.periodic(Duration(minutes: 5), (_) => usage.syncUsageStats());

  runApp(KiteChildGuardianApp());
}

class KiteChildGuardianApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KiteControl Guardian',
      theme: ThemeData.dark(),
      home: PermissionScreen(), // Start with permissions check
    );
  }
}
