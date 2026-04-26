import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/firestore_service.dart';

class PairingScreen extends StatefulWidget {
  @override
  _PairingScreenState createState() => _PairingScreenState();
}

class _PairingScreenState extends State<PairingScreen> {
  final FirestoreService _db = FirestoreService();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  String? generatedCode;
  bool isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF141414),
      appBar: AppBar(title: Text("Link New Device"), backgroundColor: Colors.transparent),
      body: Padding(
        padding: EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.phonelink_setup, size: 80, color: Colors.orange),
            SizedBox(height: 24),
            Text(
              "Pair with Child Device",
              style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            Text(
              "Install KiteControl on your child's phone and enter the code below to start tracking.",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            SizedBox(height: 48),
            if (generatedCode != null) 
              _buildCodeDisplay(generatedCode!)
            else
              _buildGenerateButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildCodeDisplay(String code) {
    return Column(
      children: [
        Container(
          padding: EdgeInsets.symmetric(horizontal: 40, vertical: 20),
          decoration: BoxDecoration(
            color: Colors.black,
            border: Border.all(color: Colors.orange),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            code,
            style: TextStyle(color: Colors.orange, fontSize: 48, fontWeight: FontWeight.bold, letterSpacing: 8),
          ),
        ),
        SizedBox(height: 16),
        Text("Expires in 30 minutes", style: TextStyle(color: Colors.grey[600], fontSize: 12)),
      ],
    );
  }

  Widget _buildGenerateButton() {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.orange,
        minimumSize: Size(200, 50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      child: isLoading ? CircularProgressIndicator(color: Colors.white) : Text("Generate Pairing Code"),
      onPressed: () async {
        setState(() => isLoading = true);
        final user = _auth.currentUser;
        if (user != null) {
          // In this architecture, familyId defaults to the Parent's UID
          String? code = await _db.generatePairingCode(user.uid, user.uid);
          setState(() {
            generatedCode = code;
          });
        }
        setState(() => isLoading = false);
      },
    );
  }
}
