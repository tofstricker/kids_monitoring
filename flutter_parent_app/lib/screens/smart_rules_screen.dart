import 'package:flutter/material.dart';
import '../services/firestore_service.dart';
import 'package:firebase_auth/firebase_auth.dart';

class SmartRulesScreen extends StatefulWidget {
  @override
  _SmartRulesScreenState createState() => _SmartRulesScreenState();
}

class _SmartRulesScreenState extends State<SmartRulesScreen> {
  final FirestoreService _db = FirestoreService();
  final String currentUid = FirebaseAuth.instance.currentUser?.uid ?? '';
  String? _familyId;

  @override
  void initState() {
    super.initState();
    _loadFamily();
  }

  void _loadFamily() async {
    final userDoc = await _db.getUserDoc(currentUid);
    setState(() => _familyId = userDoc['familyId']);
  }

  @override
  Widget build(BuildContext context) {
    if (_familyId == null) return Scaffold(backgroundColor: Color(0xFF0A0A0A), body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      backgroundColor: Color(0xFF0A0A0A),
      appBar: AppBar(
        title: Text("Smart Automations", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.orange,
        child: Icon(Icons.add, color: Colors.black),
        onPressed: _showAddRuleDialog,
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: _db.getSmartRules(_familyId!),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return Center(child: CircularProgressIndicator());
          final rules = snapshot.data!;

          if (rules.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.auto_awesome, size: 64, color: Colors.zinc[800]),
                  SizedBox(height: 16),
                  Text("No Smart Rules defined", style: TextStyle(color: Colors.zinc[600])),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: EdgeInsets.all(20),
            itemCount: rules.length,
            separatorBuilder: (c, i) => SizedBox(height: 16),
            itemBuilder: (context, index) {
              final rule = rules[index];
              return _buildRuleCard(rule);
            },
          );
        },
      ),
    );
  }

  Widget _buildRuleCard(Map<String, dynamic> rule) {
    bool isEnabled = rule['isEnabled'] ?? false;
    return Container(
      decoration: BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isEnabled ? Colors.orange.withOpacity(0.3) : Colors.white.withOpacity(0.05)),
      ),
      child: ListTile(
        contentPadding: EdgeInsets.all(20),
        title: Text(rule['name'], style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: 8),
            _buildBadge(rule['conditionType'], Colors.blue),
            SizedBox(height: 4),
            _buildBadge(rule['actionType'], Colors.green),
          ],
        ),
        trailing: Switch(
          value: isEnabled,
          activeColor: Colors.orange,
          onChanged: (val) => _db.toggleSmartRule(rule['id'], val),
        ),
        onLongPress: () => _db.deleteSmartRule(rule['id']),
      ),
    );
  }

  Widget _buildBadge(String text, Color color) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
      child: Text(text, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }

  void _showAddRuleDialog() {
    String name = "";
    String conditionType = "LOCATION_ENTER";
    String actionType = "BLOCK_APPS";
    String conditionValue = "";
    String actionValue = "";

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Color(0xFF1A1A1A),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("Create Smart Rule", style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              SizedBox(height: 24),
              TextField(
                onChanged: (v) => name = v,
                style: TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: "Rule Name (e.g. School Focus)",
                  labelStyle: TextStyle(color: Colors.zinc[600]),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.zinc[800])),
                ),
              ),
              SizedBox(height: 24),
              Text("WHEN...", style: TextStyle(color: Colors.zinc[500], fontSize: 12, fontWeight: FontWeight.bold)),
              DropdownButton<String>(
                value: conditionType,
                isExpanded: true,
                dropdownColor: Color(0xFF1A1A1A),
                items: ["LOCATION_ENTER", "LOCATION_LEAVE", "BATTERY_STATE", "CHARGING_STATE", "ACTIVITY_STATE"]
                  .map((e) => DropdownMenuItem(child: Text(e, style: TextStyle(color: Colors.white)), value: e)).toList(),
                onChanged: (v) => setModalState(() => conditionType = v!),
              ),
              TextField(
                onChanged: (v) => conditionValue = v,
                style: TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: "Condition Value (Fence ID, % or State)",
                  labelStyle: TextStyle(color: Colors.zinc[600]),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.zinc[800])),
                ),
              ),
              SizedBox(height: 24),
              Text("THEN...", style: TextStyle(color: Colors.zinc[500], fontSize: 12, fontWeight: FontWeight.bold)),
              DropdownButton<String>(
                value: actionType,
                isExpanded: true,
                dropdownColor: Color(0xFF1A1A1A),
                items: ["BLOCK_APPS", "ALLOW_APPS", "LOCK_DEVICE"]
                  .map((e) => DropdownMenuItem(child: Text(e, style: TextStyle(color: Colors.white)), value: e)).toList(),
                onChanged: (v) => setModalState(() => actionType = v!),
              ),
               TextField(
                onChanged: (v) => actionValue = v,
                style: TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: "Action Value (App Package or *)",
                  labelStyle: TextStyle(color: Colors.zinc[600]),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.zinc[800])),
                ),
              ),
              SizedBox(height: 32),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  minimumSize: Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text("SAVE AUTOMATION", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                onPressed: () {
                  _db.addSmartRule({
                   'name': name,
                   'familyId': _familyId,
                   'conditionType': conditionType,
                   'conditionValue': conditionValue,
                   'actionType': actionType,
                   'actionValue': actionValue,
                   'isEnabled': true,
                   'createdAt': DateTime.now().toIso8601String(),
                  });
                  Navigator.pop(context);
                },
              ),
              SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
