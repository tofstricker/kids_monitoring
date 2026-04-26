import 'package:flutter/material.dart';

class PinLockScreen extends StatefulWidget {
  final VoidCallback onUnlocked;
  final String correctPin;

  PinLockScreen({required this.onUnlocked, this.correctPin = "1234"});

  @override
  _PinLockScreenState createState() => _PinLockScreenState();
}

class _PinLockScreenState extends State<PinLockScreen> {
  String _currentPin = "";

  void _onKeyPress(String key) {
    setState(() {
      if (_currentPin.length < 4) {
        _currentPin += key;
      }
      if (_currentPin.length == 4) {
        if (_currentPin == widget.correctPin) {
          widget.onUnlocked();
        } else {
          _currentPin = "";
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("Incorrect PIN"), backgroundColor: Colors.red),
          );
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF0A0A0A),
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.lock_outline, color: Colors.orange, size: 48),
          SizedBox(height: 24),
          Text("Admin Verification", style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
          SizedBox(height: 8),
          Text("Enter PIN to access settings", style: TextStyle(color: Colors.grey)),
          SizedBox(height: 48),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(4, (index) => _buildPinDot(index < _currentPin.length)),
          ),
          SizedBox(height: 48),
          GridView.count(
            shrinkWrap: true,
            crossAxisCount: 3,
            padding: EdgeInsets.symmetric(horizontal: 64),
            children: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key) {
              if (key.isEmpty) return SizedBox();
              return TextButton(
                onPressed: () => key == "⌫" ? setState(() => _currentPin = _currentPin.isNotEmpty ? _currentPin.substring(0, _currentPin.length - 1) : "") : _onKeyPress(key),
                child: Text(key, style: TextStyle(color: Colors.white, fontSize: 24)),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildPinDot(bool filled) {
    return Container(
      margin: EdgeInsets.all(8),
      width: 16,
      height: 16,
      decoration: BoxDecoration(
        color: filled ? Colors.orange : Colors.transparent,
        border: Border.all(color: Colors.orange),
        shape: BoxShape.circle,
      ),
    );
  }
}
