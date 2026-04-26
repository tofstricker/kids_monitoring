import 'package:flutter/material.dart';
import '../services/permission_service.dart';
import 'guardian_status_screen.dart';

class PermissionScreen extends StatefulWidget {
  @override
  _PermissionScreenState createState() => _PermissionScreenState();
}

class _PermissionScreenState extends State<PermissionScreen> {
  final PermissionService _ps = PermissionService();

  void _checkAndProceed() async {
    bool ready = await _ps.hasAllPermissions();
    if (ready) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (c) => GuardianStatusScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Please grant all permissions to continue."),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF0A0A0A),
      body: Padding(
        padding: EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Icon(Icons.security, size: 64, color: Colors.blue),
            SizedBox(height: 24),
            Text(
              "Guardian Setup",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            Text(
              "To keep you safe, KiteControl requires specific Android system permissions.",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            SizedBox(height: 48),
            _buildPermissionTile(
              "Usage Access",
              "Allows monitoring which apps are used.",
              Icons.bar_chart,
              () => _ps.requestUsageAccess(),
            ),
            _buildPermissionTile(
              "Display Over Other Apps",
              "Allows blocking apps when time is up.",
              Icons.layers,
              () => _ps.requestOverlayPermission(),
            ),
            _buildPermissionTile(
              "Accessibility Service",
              "Ensures protection cannot be removed.",
              Icons.accessibility_new,
              () => _ps.requestAccessibilityService(),
            ),
            SizedBox(height: 40),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, padding: EdgeInsets.all(16)),
              child: Text("I've Granted All Permissions"),
              onPressed: _checkAndProceed,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPermissionTile(String title, String desc, IconData icon, VoidCallback onTap) {
    return Card(
      color: Color(0xFF141414),
      margin: EdgeInsets.only(bottom: 16),
      child: ListTile(
        leading: Icon(icon, color: Colors.blue),
        title: Text(title, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text(desc, style: TextStyle(color: Colors.grey, fontSize: 12)),
        trailing: Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
        onTap: onTap,
      ),
    );
  }
}
