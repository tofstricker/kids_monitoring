import 'package:flutter/material.dart';
import '../services/firestore_service.dart';
import 'package:firebase_auth/firebase_auth.dart';

class NotificationSettingsScreen extends StatefulWidget {
  @override
  _NotificationSettingsScreenState createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  final FirestoreService _db = FirestoreService();
  final String currentUid = FirebaseAuth.instance.currentUser?.uid ?? '';
  String? _familyId;

  @override
  void initState() {
    super.initState();
    _loadFamilyId();
  }

  void _loadFamilyId() async {
    final userDoc = await _db.getUserDoc(currentUid);
    setState(() {
      _familyId = userDoc['familyId'];
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_familyId == null) {
      return Scaffold(
        backgroundColor: Color(0xFF0A0A0A),
        body: Center(child: CircularProgressIndicator(color: Colors.orange)),
      );
    }

    return Scaffold(
      backgroundColor: Color(0xFF0A0A0A),
      appBar: AppBar(
        title: Text("Alert Preferences", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: StreamBuilder<Map<String, dynamic>>(
        stream: _db.getNotificationSettings(_familyId!),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return Center(child: CircularProgressIndicator(color: Colors.orange));
          
          final settings = snapshot.data!;
          
          return ListView(
            padding: EdgeInsets.all(20),
            children: [
              _buildSectionHeader("SAFE ZONES"),
              _buildToggleItem(
                "Enter Entry Alerts",
                "Receive alerts when child enters a safe zone.",
                settings['notifySafeEnter'] ?? true,
                (val) => _updateSetting('notifySafeEnter', val),
              ),
              _buildToggleItem(
                "Exit Leave Alerts",
                "Receive alerts when child leaves a safe zone.",
                settings['notifySafeLeave'] ?? true,
                (val) => _updateSetting('notifySafeLeave', val),
              ),
              SizedBox(height: 32),
              _buildSectionHeader("RESTRICTED ZONES"),
              _buildToggleItem(
                "Entry Warning",
                "Critical alerts when child enters a restricted zone.",
                settings['notifyRestrictedEnter'] ?? true,
                (val) => _updateSetting('notifyRestrictedEnter', val),
                isCritical: true,
              ),
              _buildToggleItem(
                "Exit Notification",
                "Alerts when child leaves a restricted zone.",
                settings['notifyRestrictedLeave'] ?? true,
                (val) => _updateSetting('notifyRestrictedLeave', val),
              ),
              SizedBox(height: 48),
              Text(
                "Note: Restricted zone entry always triggers automatic device lockdown regardless of notification settings.",
                style: TextStyle(color: Colors.zinc[600], fontSize: 11, fontStyle: FontStyle.italic),
                textAlign: TextAlign.center,
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: EdgeInsets.only(bottom: 16, left: 4),
      child: Text(
        title,
        style: TextStyle(color: Colors.zinc[500], fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2),
      ),
    );
  }

  Widget _buildToggleItem(String title, String subtitle, bool value, Function(bool) onChanged, {bool isCritical = false}) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isCritical && value ? Colors.red.withOpacity(0.3) : Colors.white.withOpacity(0.05)),
      ),
      child: ListTile(
        contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        title: Text(title, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle, style: TextStyle(color: Colors.zinc[500], fontSize: 12)),
        trailing: Switch(
          value: value,
          activeColor: isCritical ? Colors.red : Colors.orange,
          onChanged: onChanged,
        ),
      ),
    );
  }

  void _updateSetting(String key, bool value) async {
    if (_familyId == null) return;
    await _db.updateNotificationSettings(_familyId!, {key: value});
  }
}
