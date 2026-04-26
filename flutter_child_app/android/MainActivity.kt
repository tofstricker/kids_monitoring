package com.example.kitecontrol

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity() {
    private val USAGE_CHANNEL = "com.example.kitecontrol/usage"
    private val BLOCKING_CHANNEL = "com.example.kitecontrol/blocking"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        
        // Usage Stats Channel
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, USAGE_CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "getUsageStats") {
                val tracker = UsageTracker(this)
                val stats = tracker.getUsageStats()
                result.success(stats)
            } else {
                result.notImplemented()
            }
        }

        // Blocking Channel
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, BLOCKING_CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "setBlockedApps") {
                val packages = call.argument<List<String>>("packages")?.toSet() ?: emptySet()
                GuardianAccessibilityService.blockedApps = packages
                result.success(null)
            } else {
                result.notImplemented()
            }
        }
    }
}
