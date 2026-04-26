import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:location/location.dart';
import 'package:http/http.dart' as http;
import 'package:battery_plus/battery_plus.dart';
import 'dart:convert';

class LocationService {
  final Location _location = Location();
  final Battery _battery = Battery();
  final FirebaseAuth _auth = FirebaseAuth.instance;

  void startTracking() async {
    // ... permission checks ...
    _location.enableBackgroundMode(enable: true);
    _location.changeSettings(accuracy: LocationAccuracy.high, interval: 30000); 

    _location.onLocationChanged.listen((LocationData currentLocation) async {
      final batteryLevel = await _battery.batteryLevel;
      final batteryStatus = await _battery.onBatteryStateChanged.first;
      
      String activity = "STILL";
      if (currentLocation.speed != null) {
        if (currentLocation.speed! > 10.0) activity = "VEHICLE"; // ~36km/h
        else if (currentLocation.speed! > 0.5) activity = "WALKING";
      }

      await _syncLocationToBackend(currentLocation, batteryLevel, batteryStatus == BatteryState.charging, activity);
    });
  }

  Future<void> _syncLocationToBackend(LocationData location, int battery, bool charging, String activity) async {
    final user = _auth.currentUser;
    if (user == null) return;

    try {
      await http.post(
        Uri.parse('/api/update-location'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': user.uid,
          'latitude': location.latitude,
          'longitude': location.longitude,
          'timestamp': DateTime.now().toIso8601String(),
          'batteryLevel': battery,
          'isCharging': charging,
          'activity': activity,
        }),
      );
    } catch (e) {
      print("Failed to sync context to engine: $e");
    }
  }
}
