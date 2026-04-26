import 'package:flutter/material.dart';

class BlockedOverlayScreen extends StatelessWidget {
  final String appName;

  BlockedOverlayScreen({this.appName = "this app"});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF0F172A), // Deep Night Blue
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
          ),
        ),
        child: Column(
          children: [
            Spacer(),
            // Friendly Icon
            Container(
              padding: EdgeInsets.all(40),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.wb_sunny, size: 100, color: Colors.amber),
            ),
            SizedBox(height: 48),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40.0),
              child: Column(
                children: [
                  Text(
                    "Time for an Adventure!",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.black,
                      letterSpacing: -1,
                    ),
                  ),
                  SizedBox(height: 16),
                  Text(
                    "You've had a great session on $appName. Now it's time to stretch, look outside, or fly a real kite! 🪁",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.slate[400],
                      fontSize: 16,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
            Spacer(),
            // Motivation Stats
            Container(
              margin: EdgeInsets.symmetric(horizontal: 40),
              padding: EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(32),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildMiniStat("Done", "3h 45m", Icons.check_circle, Colors.green),
                  _buildMiniStat("Break", "15m", Icons.timer, Colors.blue),
                ],
              ),
            ),
            SizedBox(height: 48),
            // "Not Strict" - Optional Request Button
            TextButton(
              onPressed: () {
                // Request more time logic
              },
              child: Text(
                "Request 15 more minutes?",
                style: TextStyle(color: Colors.amber[200], fontWeight: FontWeight.bold),
              ),
            ),
            SizedBox(height: 60),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        SizedBox(height: 8),
        Text(value, style: TextStyle(color: Colors.white, fontWeight: FontWeight.black, fontSize: 18)),
        Text(label, style: TextStyle(color: Colors.slate[500], fontSize: 11, fontWeight: FontWeight.bold, uppercase: true)),
      ],
    );
  }
}
