import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/firestore_service.dart';

class ChildLinkScreen extends StatefulWidget {
  @override
  _ChildLinkScreenState createState() => _ChildLinkScreenState();
}

class _ChildLinkScreenState extends State<ChildLinkScreen> {
  final FirestoreService _db = FirestoreService();
  final TextEditingController _codeController = TextEditingController();
  bool isLoading = false;
  String? errorMessage;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF141414),
      appBar: AppBar(title: Text("Link to Parent"), backgroundColor: Colors.transparent),
      body: Padding(
        padding: EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.link, size: 80, color: Colors.blue),
            SizedBox(height: 24),
            Text(
              "Configuration Required",
              style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            Text(
              "Enter the 6-digit code shown on your parent's device to link this account.",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            SizedBox(height: 48),
            TextField(
              controller: _codeController,
              textAlign: TextAlign.center,
              keyboardType: TextInputType.number,
              maxLength: 6,
              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 12),
              decoration: InputDecoration(
                counterText: "",
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey[800]!)),
                focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.blue)),
              ),
            ),
            if (errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(top: 16.0),
                child: Text(errorMessage!, style: TextStyle(color: Colors.red)),
              ),
            SizedBox(height: 48),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                minimumSize: Size(double.infinity, 56),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: isLoading 
                ? CircularProgressIndicator(color: Colors.white) 
                : Text("Link Device", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              onPressed: _handleLinking,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleLinking() async {
    final code = _codeController.text;
    if (code.length != 6) {
      setState(() => errorMessage = "Please enter a 6-digit code");
      return;
    }

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    final String childUid = FirebaseAuth.instance.currentUser!.uid;
    final bool success = await _db.linkChildWithCode(code, childUid);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Account successfully linked!"), backgroundColor: Colors.green),
      );
      Navigator.pop(context); // Go back to wrapper to trigger UI rebuild
    } else {
      setState(() {
        isLoading = false;
        errorMessage = "Linking failed. Check the code and try again.";
      });
    }
  }
}
