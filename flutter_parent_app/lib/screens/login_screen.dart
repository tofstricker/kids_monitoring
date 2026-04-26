import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final AuthService _auth = AuthService();
  final _formKey = GlobalKey<FormState>();

  String email = '';
  String password = '';
  bool isRegistering = false;
  String displayName = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF141414),
      body: Center(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(Icons.shield_rounded, size: 80, color: Colors.orange),
              SizedBox(height: 16),
              Text(
                "KiteControl Parent",
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 40),
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    if (isRegistering)
                      TextFormField(
                        style: TextStyle(color: Colors.white),
                        decoration: _inputDecoration("Full Name", Icons.person_outline),
                        onChanged: (val) => setState(() => displayName = val),
                      ),
                    SizedBox(height: 16),
                    TextFormField(
                      style: TextStyle(color: Colors.white),
                      decoration: _inputDecoration("Email", Icons.email_outlined),
                      onChanged: (val) => setState(() => email = val),
                    ),
                    SizedBox(height: 16),
                    TextFormField(
                      obscureText: true,
                      style: TextStyle(color: Colors.white),
                      decoration: _inputDecoration("Password", Icons.lock_outline),
                      onChanged: (val) => setState(() => password = val),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 32),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  padding: EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: Text(
                  isRegistering ? "Register Account" : "Login",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                onPressed: () async {
                  if (isRegistering) {
                    await _auth.register(email, password, displayName, "PARENT");
                  } else {
                    await _auth.login(email, password);
                  }
                },
              ),
              TextButton(
                child: Text(
                  isRegistering ? "Back to Login" : "Create New Account",
                  style: TextStyle(color: Colors.orange),
                ),
                onPressed: () => setState(() => isRegistering = !isRegistering),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: Colors.grey),
      prefixIcon: Icon(icon, color: Colors.orange),
      enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey[800]!), borderRadius: BorderRadius.circular(8)),
      focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.orange), borderRadius: BorderRadius.circular(8)),
      filled: true,
      fillColor: Colors.black,
    );
  }
}
