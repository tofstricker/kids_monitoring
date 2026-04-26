import 'package:permission_handler/permission_handler.dart';
import 'package:android_intent_plus/android_intent_plus.dart';
import 'package:android_intent_plus/flag.dart';

class PermissionService {
  // Check if all critical permissions are granted
  Future<bool> hasAllPermissions() async {
    bool usageStats = await isUsageStatsEnabled();
    bool overlay = await Permission.systemAlertWindow.isGranted;
    // Accessibility is harder to check via standard Flutter plugins, 
    // usually requires a MethodChannel to native Kotlin.
    return usageStats && overlay;
  }

  // Usage Stats (Needed to monitor app usage)
  Future<bool> isUsageStatsEnabled() async {
    // This usually requires a native check, but we can attempt to open the settings
    return await Permission.appTrackingTransparency.isGranted; // Placeholder for logic
  }

  void requestUsageAccess() {
    final intent = AndroidIntent(
      action: 'android.settings.USAGE_ACCESS_SETTINGS',
      flags: [Flag.FLAG_ACTIVITY_NEW_TASK],
    );
    intent.launch();
  }

  void requestOverlayPermission() {
    final intent = AndroidIntent(
      action: 'android.settings.action.MANAGE_OVERLAY_PERMISSION',
      flags: [Flag.FLAG_ACTIVITY_NEW_TASK],
    );
    intent.launch();
  }

  void requestAccessibilityService() {
    final intent = AndroidIntent(
      action: 'android.settings.ACCESSIBILITY_SETTINGS',
      flags: [Flag.FLAG_ACTIVITY_NEW_TASK],
    );
    intent.launch();
  }
}
