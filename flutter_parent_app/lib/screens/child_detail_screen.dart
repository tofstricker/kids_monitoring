import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/firestore_service.dart';

class ChildDetailScreen extends StatefulWidget {
  final Map<String, dynamic> child;

  ChildDetailScreen({required this.child});

  @override
  State<ChildDetailScreen> createState() => _ChildDetailScreenState();
}

class _ChildDetailScreenState extends State<ChildDetailScreen> {
  final FirestoreService _db = FirestoreService();
  
  TimeOfDay _startTime = TimeOfDay(hour: 21, minute: 0);
  TimeOfDay _endTime = TimeOfDay(hour: 7, minute: 0);
  bool _isBedtimeEnabled = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF0A0A0A),
      appBar: AppBar(
        title: Text("${widget.child['displayName']}'s Activity"),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildStatsSummary(),
              SizedBox(height: 32),
              _buildCameraVerification(),
              SizedBox(height: 32),
              _buildBedtimeSlot(),
              SizedBox(height: 32),
              Text("Hourly Usage", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              SizedBox(height: 16),
              _buildChart(),
              SizedBox(height: 32),
              Text("Top Applications", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              SizedBox(height: 16),
              _buildAppList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBedtimeSlot() {
    return StreamBuilder<Map<String, dynamic>?>(
      stream: _db.getBedtimeLimit(widget.child['id']),
      builder: (context, snapshot) {
        if (snapshot.hasData && snapshot.data != null) {
          final data = snapshot.data!;
          final value = data['value'] as String;
          final times = value.split('-');
          _isBedtimeEnabled = data['isEnabled'] ?? false;
          
          if (times.length == 2) {
            final start = times[0].split(':');
            final end = times[1].split(':');
            _startTime = TimeOfDay(hour: int.parse(start[0]), minute: int.parse(start[1]));
            _endTime = TimeOfDay(hour: int.parse(end[0]), minute: int.parse(end[1]));
          }
        }

        return Container(
          padding: EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: _isBedtimeEnabled ? Colors.orange.withOpacity(0.3) : Colors.white.withOpacity(0.05)),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.bedtime_outlined, color: Colors.orange, size: 24),
                      SizedBox(width: 12),
                      Text("Bedtime Mode", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Switch(
                    value: _isBedtimeEnabled,
                    activeColor: Colors.orange,
                    onChanged: (val) {
                      _saveBedtime(val);
                    },
                  ),
                ],
              ),
              Divider(color: Colors.white10, height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildTimePickerColumn("Start Time", _startTime, (time) => _saveBedtime(_isBedtimeEnabled, start: time)),
                  Icon(Icons.arrow_forward, color: Colors.grey[700], size: 16),
                  _buildTimePickerColumn("End Time", _endTime, (time) => _saveBedtime(_isBedtimeEnabled, end: time)),
                ],
              ),
            ],
          ),
        );
      }
    );
  }

  Widget _buildTimePickerColumn(String label, TimeOfDay time, Function(TimeOfDay) onSelect) {
    return GestureDetector(
      onTap: () async {
        final selected = await showTimePicker(
          context: context,
          initialTime: time,
          builder: (context, child) => Theme(
            data: ThemeData.dark().copyWith(
              colorScheme: ColorScheme.dark(primary: Colors.orange, onPrimary: Colors.black, surface: Color(0xFF1A1A1A)),
            ),
            child: child!,
          ),
        );
        if (selected != null) onSelect(selected);
      },
      child: Column(
        children: [
          Text(label, style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
          SizedBox(height: 4),
          Text(
            "${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}",
            style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  void _saveBedtime(bool enabled, {TimeOfDay? start, TimeOfDay? end}) async {
    final s = start ?? _startTime;
    final e = end ?? _endTime;
    final value = "${s.hour}:${s.minute}-${e.hour}:${e.minute}";
    
    await _db.updateBedtimeLimit(widget.child['id'], enabled, value);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Bedtime Policy Updated"), backgroundColor: Colors.orange, duration: Duration(seconds: 1))
    );
  }

  Widget _buildStatsSummary() {
    return Container(
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildStatItem("Total Time", "4h 12m", Icons.timer_outlined, Colors.orange),
          Container(width: 1, height: 40, color: Colors.white10),
          _buildStatItem("Apps Used", "12", Icons.apps_outlined, Colors.blue),
          Container(width: 1, height: 40, color: Colors.white10),
          _buildStatItem("Pickups", "24", Icons.touch_app_outlined, Colors.green),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        SizedBox(height: 8),
        Text(value, style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
        Text(label, style: TextStyle(color: Colors.grey, fontSize: 12)),
      ],
    );
  }

  Widget _buildChart() {
    return Container(
      height: 200,
      padding: EdgeInsets.only(top: 20, right: 20),
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: 60,
          barTouchData: BarTouchData(enabled: false),
          titlesData: FlTitlesData(
            show: true,
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, meta) {
                  const style = TextStyle(color: Colors.grey, fontSize: 10);
                  switch (value.toInt()) {
                    case 0: return Text('8AM', style: style);
                    case 2: return Text('12PM', style: style);
                    case 4: return Text('4PM', style: style);
                    case 6: return Text('8PM', style: style);
                    default: return Text('');
                  }
                },
              ),
            ),
            leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          gridData: FlGridData(show: false),
          borderData: FlBorderData(show: false),
          barGroups: [
            _makeGroupData(0, 15, Colors.blue),
            _makeGroupData(1, 45, Colors.orange),
            _makeGroupData(2, 30, Colors.blue),
            _makeGroupData(3, 50, Colors.orange),
            _makeGroupData(4, 20, Colors.blue),
            _makeGroupData(5, 10, Colors.blue),
          ],
        ),
      ),
    );
  }

  BarChartGroupData _makeGroupData(int x, double y, Color color) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y,
          color: color,
          width: 16,
          borderRadius: BorderRadius.circular(4),
          backDrawRodData: BackgroundBarChartRodData(
            show: true,
            toY: 60,
            color: Colors.white.withOpacity(0.05),
          ),
        ),
      ],
    );
  }

  Widget _buildAppList() {
    // Mock data for demo - in production fetch from usage_logs stream
    final apps = [
      {'name': 'TikTok', 'time': '1h 45m', 'icon': Icons.music_note, 'color': Colors.pink},
      {'name': 'YouTube', 'time': '1h 12m', 'icon': Icons.play_arrow, 'color': Colors.red},
      {'name': 'Roblox', 'time': '45m', 'icon': Icons.videogame_asset, 'color': Colors.grey},
      {'name': 'WhatsApp', 'time': '30m', 'icon': Icons.chat, 'color': Colors.green},
    ];

    return ListView.separated(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      itemCount: apps.length,
      separatorBuilder: (c, i) => SizedBox(height: 12),
      itemBuilder: (context, index) {
        final app = apps[index];
        return Container(
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(12),
          ),
          child: ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Container(
              padding: EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: (app['color'] as Color).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(app['icon'] as IconData, color: app['color'] as Color),
            ),
            title: Text(app['name'] as String, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            trailing: Text(app['time'] as String, style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
          ),
        );
      },
    );
  }

  Widget _buildCameraVerification() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("Surroundings Verification", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            TextButton.icon(
              onPressed: () {
                _db.requestSnapshot(widget.child['id']);
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Snapshot Requested...")));
              },
              icon: Icon(Icons.camera_alt_outlined, size: 16, color: Colors.blue),
              label: Text("REQUEST SYNC", style: TextStyle(color: Colors.blue, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        SizedBox(height: 16),
        Container(
          height: 140,
          child: StreamBuilder<List<Map<String, dynamic>>>(
            stream: _db.getSnapshots(widget.child['id']),
            builder: (context, snapshot) {
              if (!snapshot.hasData || snapshot.data!.isEmpty) {
                return Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Color(0xFF1A1A1A),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withOpacity(0.05)),
                  ),
                  child: Center(
                    child: Text("No snapshots yet", style: TextStyle(color: Colors.grey, fontSize: 12)),
                  ),
                );
              }

              return ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: snapshot.data!.length,
                separatorBuilder: (c, i) => SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final snap = snapshot.data![index];
                  return Container(
                    width: 110,
                    decoration: BoxDecoration(
                      color: Color(0xFF1A1A1A),
                      borderRadius: BorderRadius.circular(16),
                      image: DecorationImage(
                        image: NetworkImage(snap['imageUrl']), 
                        fit: BoxFit.cover,
                      ),
                    ),
                    child: Align(
                      alignment: Alignment.bottomCenter,
                      child: Container(
                        padding: EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
                        ),
                        child: Text(
                          "${DateTime.now().difference((snap['timestamp'] as dynamic).toDate()).inMinutes}m ago",
                          style: TextStyle(color: Colors.white, fontSize: 9),
                        ),
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
