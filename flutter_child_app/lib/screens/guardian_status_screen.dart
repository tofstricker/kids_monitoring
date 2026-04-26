import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';

class GuardianStatusScreen extends StatelessWidget {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  @override
  Widget build(BuildContext context) {
    final user = _auth.currentUser;

    return Scaffold(
      backgroundColor: Color(0xFFF0F9FF), // Sky Light Blue
      appBar: AppBar(
        title: Text("My Kite", style: TextStyle(color: Color(0xFF075985), fontWeight: FontWeight.black)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.settings_outlined, color: Color(0xFF0284C7)),
            onPressed: () {
              // PIN protection would go here
            },
          ),
        ],
      ),
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF0F9FF), Color(0xFFE0F2FE)],
          ),
        ),
        child: Column(
          children: [
            Spacer(),
            // Animated Kite Area
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: 1),
              duration: Duration(seconds: 2),
              builder: (context, value, child) {
                return Transform.translate(
                  offset: Offset(0, -20 * (1 - value)),
                  child: Opacity(
                    opacity: value,
                    child: child,
                  ),
                );
              },
              child: Column(
                children: [
                   Container(
                    width: 160,
                    height: 160,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Color(0xFF0EA5E9).withOpacity(0.1),
                          blurRadius: 40,
                          spreadRadius: 10,
                        )
                      ],
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Icon(Icons.air, size: 80, color: Color(0xFFBAE6FD)),
                          Icon(Icons.navigation, size: 60, color: Color(0xFF0EA5E9)), // Looks like a kite
                        ],
                      ),
                    ),
                  ),
                  SizedBox(height: 32),
                  Text(
                    "You're Flying High!",
                    style: TextStyle(
                      color: Color(0xFF0C4A6E),
                      fontSize: 28,
                      fontWeight: FontWeight.black,
                      letterSpacing: -0.5,
                    ),
                  ),
                  SizedBox(height: 12),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Color(0xFF0EA5E9).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      "Kite Guard is keeping you safe ☀️",
                      style: TextStyle(color: Color(0xFF0369A1), fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
            Spacer(),
            // Mission Cards
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                children: [
                  _buildMissionTile(Icons.celebration, "Healthy Explorer", "Mastered", Colors.purple),
                  _buildMissionTile(Icons.explore, "Adventure Safety", "Active", Colors.orange),
                  _buildMissionTile(Icons.auto_awesome, "Daily Streak", "5 Days!", Colors.green),
                ],
              ),
            ),
            SizedBox(height: 48),
            Text(
              "Guardian ID: ${user?.uid.substring(0, 8) ?? '...'}",
              style: TextStyle(color: Color(0xFF0C4A6E).withOpacity(0.3), fontWeight: FontWeight.bold, fontSize: 10),
            ),
            SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildMissionTile(IconData icon, String title, String status, Color color) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.8),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white, width: 2),
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          SizedBox(width: 16),
          Expanded(
            child: Text(
              title,
              style: TextStyle(color: Color(0xFF0C4A6E), fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              status,
              style: TextStyle(color: color, fontWeight: FontWeight.black, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}
