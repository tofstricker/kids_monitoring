import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import 'pairing_screen.dart';
import 'child_detail_screen.dart';
import 'geofence_map_screen.dart';
import 'notification_settings_screen.dart';
import 'smart_rules_screen.dart';

class DashboardScreen extends StatelessWidget {
  final AuthService _auth = AuthService();
  final FirestoreService _db = FirestoreService();
  final String currentUid = FirebaseAuth.instance.currentUser?.uid ?? '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF0A0A0A),
      appBar: AppBar(
        title: Text("Family Dashboard"),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.map_outlined, color: Colors.orange),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (c) => GeofenceMapScreen())),
          ),
          IconButton(
            icon: Icon(Icons.notifications_none_outlined, color: Colors.blue),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (c) => NotificationSettingsScreen())),
          ),
          IconButton(
            icon: Icon(Icons.auto_awesome_outlined, color: Colors.purpleAccent),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (c) => SmartRulesScreen())),
          ),
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () => _auth.signOut(),
          )
        ],
      ),
      body: currentUid.isEmpty 
          ? Center(child: Text("Auth Error", style: TextStyle(color: Colors.white)))
          : StreamBuilder<List<Map<String, dynamic>>>(
              stream: _db.getChildren(currentUid), 
              builder: (context, snapshot) {
                if (!snapshot.hasData) return Center(child: CircularProgressIndicator());
                
                final children = snapshot.data!;

                return Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(height: 10),
                      Text("Active Children", style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                      SizedBox(height: 20),
                      Expanded(
                        child: children.isEmpty 
                          ? _buildEmptyState(context)
                          : ListView.builder(
                              itemCount: children.length,
                              itemBuilder: (context, index) => _buildChildCard(context, children[index]),
                            ),
                      ),
                    ],
                  ),
                );
              }
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.orange,
        child: Icon(Icons.add, color: Colors.black),
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (c) => PairingScreen())),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.child_care_outlined, size: 64, color: Colors.grey[800]),
          SizedBox(height: 16),
          Text("No children linked yet", style: TextStyle(color: Colors.grey, fontSize: 16)),
          SizedBox(height: 24),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            ),
            child: Text("Link a Device", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (c) => PairingScreen())),
          )
        ],
      ),
    );
  }

  Widget _buildChildCard(BuildContext context, Map<String, dynamic> child) {
    return Container(
      margin: EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.03)),
      ),
      child: ListTile(
        contentPadding: EdgeInsets.all(16),
        leading: CircleAvatar(
          radius: 24,
          backgroundColor: Colors.orange.withOpacity(0.2), 
          child: Text(child['displayName'][0], style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 20))
        ),
        title: Text(child['displayName'], style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4.0),
          child: Row(
            children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(color: Colors.green, shape: BoxShape.circle)),
              SizedBox(width: 8),
              Text("Active Now", style: TextStyle(color: Colors.grey, fontSize: 13)),
            ],
          ),
        ),
        trailing: Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(10)),
          child: Icon(Icons.analytics_outlined, color: Colors.white, size: 20)
        ),
        onTap: () {
          Navigator.push(context, MaterialPageRoute(builder: (c) => ChildDetailScreen(child: child)));
        },
      ),
    );
  }
}
