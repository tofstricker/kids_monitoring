import 'package:flutter/material.dart';

class SettingsPinGuard extends StatefulWidget {
  final Widget child;
  final String correctPin;

  SettingsPinGuard({required this.child, required this.correctPin});

  @override
  _SettingsPinGuardState createState() => _SettingsPinGuardState();
}

class _SettingsPinGuardState extends State<SettingsPinGuard> {
  bool _isUnlocked = false;
  String _input = "";

  void _onKeyTap(String key) {
    setState(() {
      if (key == "C") {
        if (_input.isNotEmpty) _input = _input.substring(0, _input.length - 1);
      } else if (_input.length < 4) {
        _input += key;
        if (_input == widget.correctPin) {
          _isUnlocked = true;
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isUnlocked) return widget.child;

    return Scaffold(
      backgroundColor: Color(0xFF0A0A0A),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.lock_person, size: 64, color: Colors.orange),
            SizedBox(height: 24),
            Text("Parental PIN Required", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text("Enter PIN to modify guardian settings", style: TextStyle(color: Colors.grey, fontSize: 13)),
            SizedBox(height: 40),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(4, (index) => Container(
                margin: EdgeInsets.symmetric(horizontal: 8),
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: index < _input.length ? Colors.orange : Colors.white10,
                ),
              )),
            ),
            SizedBox(height: 60),
            _buildNumpad(),
          ],
        ),
      ),
    );
  }

  Widget _buildNumpad() {
    return Container(
      width: 250,
      child: GridView.count(
        shrinkWrap: true,
        crossAxisCount: 3,
        mainAxisSpacing: 20,
        crossAxisSpacing: 20,
        children: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "C"].map((key) {
          if (key.isEmpty) return SizedBox.shrink();
          return InkWell(
            onTap: () => _onKeyTap(key),
            borderRadius: BorderRadius.circular(40),
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Center(
                child: Text(key, style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
