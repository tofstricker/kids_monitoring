package com.example.kitecontrol

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.util.Log

class GuardianAccessibilityService : AccessibilityService() {

    companion object {
        var blockedApps: Set<String> = emptySet()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return
            val className = event.className?.toString() ?: ""

            // 0. Check for Global Lockdown (Bedtime)
            val isGlobalLock = blockedApps.contains("*")
            if (isGlobalLock && packageName != "com.example.kitecontrol" && packageName != "com.android.systemui") {
                 Log.d("Guardian", "Bedtime Lockdown Active. Blocking: $packageName")
                 
                 performGlobalAction(GLOBAL_ACTION_HOME)
                 val intent = Intent(this, BlockedOverlayActivity::class.java).apply {
                     addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                     addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                     putExtra("block_type", "BEDTIME")
                 }
                 startActivity(intent)
                 return
            }
            
            // 1. Check if the app is explicitly blocked by parent
            if (blockedApps.contains(packageName)) {
                Log.d("Guardian", "Blocking restricted app: $packageName")
                blockApp(packageName)
                return
            }

            // 2. Anti-Uninstall / Settings Protection
            // Detect if user is trying to access settings areas that allow disabling the app
            val isSettings = packageName == "com.android.settings"
            val isRestrictedSetting = className.contains("DeviceAdmin") || 
                                     className.contains("Uninstall") || 
                                     className.contains("ManageApplications")

            if (isSettings && isRestrictedSetting) {
                Log.d("Guardian", "Blocking access to restricted system settings: $className")
                performGlobalAction(GLOBAL_ACTION_HOME)
                
                // Show specific block overlay for settings
                val intent = Intent(this, BlockedOverlayActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    putExtra("block_type", "SETTINGS_PROTECTION")
                }
                startActivity(intent)
            }
        }
    }

    private fun blockApp(packageName: String) {
        // Option 1: Force Go to Home (Fast & Effective)
        performGlobalAction(GLOBAL_ACTION_HOME)

        // Option 2: Show Overlay (Requires context and proper implementation)
        // In a full implementation, we would launch a 'BlockedActivity'
        // with Intent.FLAG_ACTIVITY_NEW_TASK
        
        val intent = Intent(this, BlockedOverlayActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("blocked_package", packageName)
        }
        startActivity(intent)
    }

    override fun onInterrupt() {}
}
