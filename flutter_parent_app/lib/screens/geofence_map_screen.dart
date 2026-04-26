import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../services/firestore_service.dart';
import 'package:firebase_auth/firebase_auth.dart';

class GeofenceMapScreen extends StatefulWidget {
  @override
  _GeofenceMapScreenState createState() => _GeofenceMapScreenState();
}

class _GeofenceMapScreenState extends State<GeofenceMapScreen> {
  final FirestoreService _db = FirestoreService();
  final String currentUid = FirebaseAuth.instance.currentUser?.uid ?? '';
  
  GoogleMapController? _controller;
  Set<Circle> _circles = {};
  Set<Marker> _markers = {};
  Map<String, Marker> _childMarkers = {};
  
  LatLng? _selectedPoint;
  double _radius = 100; // default 100m
  String _selectedType = 'SAFE';

  @override
  void initState() {
    super.initState();
    _initDataStreams();
  }

  void _initDataStreams() async {
    final userDoc = await _db.getUserDoc(currentUid);
    final familyId = userDoc['familyId'] ?? '';

    // 1. Listen for Geofences
    _db.getGeofences(familyId).listen((fences) {
      setState(() {
        _circles = fences.map((f) {
          final isRestricted = f['type'] == 'RESTRICTED';
          return Circle(
            circleId: CircleId(f['id']),
            center: LatLng(f['latitude'], f['longitude']),
            radius: (f['radius'] as num).toDouble(),
            fillColor: (isRestricted ? Colors.red : Colors.orange).withOpacity(0.2),
            strokeColor: isRestricted ? Colors.red : Colors.orange,
            strokeWidth: 2,
          );
        }).toSet();
      });
    });

    // 2. Listen for Child Locations
    _db.getChildLocations(familyId).listen((locations) {
      // Group by userId and pick latest (already ordered by timestamp in Firestore query)
      final Map<String, Map<String, dynamic>> latest = {};
      for (var loc in locations) {
        final uid = loc['userId'];
        if (!latest.containsKey(uid)) {
          latest[uid] = loc;
        }
      }

      setState(() {
        _childMarkers = latest.map((uid, loc) => MapEntry(
          uid,
          Marker(
            markerId: MarkerId('child_$uid'),
            position: LatLng(loc['latitude'], loc['longitude']),
            infoWindow: InfoWindow(title: "Child Device", snippet: "Last updated: ${loc['timestamp']}"),
            icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueCyan),
          )
        ));
        _updateMarkers();
      });
    });
  }

  void _updateMarkers() {
    final Set<Marker> allMarkers = Set.from(_childMarkers.values);
    if (_selectedPoint != null) {
      allMarkers.add(Marker(
        markerId: MarkerId('new_fence'),
        position: _selectedPoint!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
      ));
    }
    _markers = allMarkers;
  }

  void _onTap(LatLng point) {
    setState(() {
      _selectedPoint = point;
      _updateMarkers();
    });
  }

  void _saveGeofence() async {
    if (_selectedPoint == null) return;
    
    final userDoc = await _db.getUserDoc(currentUid);
    final familyId = userDoc['familyId'] ?? '';

    await _db.addGeofence({
      'name': '${_selectedType == 'SAFE' ? 'Safe' : 'Restricted'} Zone ${DateTime.now().second}',
      'latitude': _selectedPoint!.latitude,
      'longitude': _selectedPoint!.longitude,
      'radius': _radius,
      'familyId': familyId,
      'type': _selectedType,
      'createdBy': currentUid,
    });

    setState(() {
      _selectedPoint = null;
      _markers = {};
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Geofence Zone Created"), backgroundColor: Colors.orange)
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF0A0A0A),
      appBar: AppBar(
        title: Text("Safe Zone Mapping", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(target: LatLng(37.427961, -122.085749), zoom: 15),
            onMapCreated: (c) => _controller = c,
            onTap: _onTap,
            circles: _circles,
            markers: _markers,
            myLocationEnabled: true,
            mapToolbarEnabled: false,
            style: _darkMapStyle,
          ),
          if (_selectedPoint != null)
            Positioned(
              bottom: 30,
              left: 20,
              right: 20,
              child: Container(
                padding: EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Color(0xFF1A1A1A),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                  boxShadow: [BoxShadow(color: Colors.black54, blurRadius: 20, spreadRadius: 5)],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("Define Zone", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                          decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(12)),
                          child: Row(
                            children: [
                              _buildTypeButton("SAFE", Colors.orange),
                              _buildTypeButton("RESTRICTED", Colors.red),
                            ],
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 20),
                    Text("Radius: ${_radius.round()}m", style: TextStyle(color: Colors.zinc[500], fontSize: 12)),
                    Slider(
                      value: _radius,
                      min: 50,
                      max: 2000,
                      divisions: 39,
                      label: "${_radius.round()}m",
                      activeColor: Colors.orange,
                      inactiveColor: Colors.zinc[800],
                      onChanged: (v) => setState(() => _radius = v),
                    ),
                    SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextButton(
                            style: TextButton.styleFrom(padding: EdgeInsets.symmetric(vertical: 12)),
                            child: Text("CANCEL", style: TextStyle(color: Colors.zinc[500], fontSize: 12, fontWeight: FontWeight.bold)),
                            onPressed: () => setState(() => _selectedPoint = null),
                          ),
                        ),
                        SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange,
                              padding: EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text("SAVE SAFE ZONE", style: TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.bold)),
                            onPressed: _saveGeofence,
                          ),
                        ),
                      ],
                    )
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTypeButton(String type, Color color) {
    bool isSelected = _selectedType == type;
    return GestureDetector(
      onTap: () => setState(() => _selectedType = type),
      child: AnimatedContainer(
        duration: Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSelected ? color : Colors.transparent),
        ),
        child: Text(
          type,
          style: TextStyle(
            color: isSelected ? color : Colors.zinc[600],
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  static const String _darkMapStyle = '''
  [
    {
      "elementType": "geometry",
      "stylers": [ { "color": "#212121" } ]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [ { "color": "#212121" } ]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [ { "color": "#757575" } ]
    },
    {
      "featureType": "administrative.country",
      "elementType": "geometry.stroke",
      "stylers": [ { "color": "#444444" } ]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [ { "color": "#383838" } ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [ { "color": "#000000" } ]
    }
  ]
  ''';
}
