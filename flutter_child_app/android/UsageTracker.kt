package com.example.kitecontrol

import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import java.util.*

class UsageTracker(private val context: Context) {

    fun getUsageStats(): List<Map<String, Any>> {
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_MANAGER_SERVICE) as UsageStatsManager
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        
        val startTime = calendar.timeInMillis
        val endTime = System.currentTimeMillis()

        val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
        val pm = context.packageManager

        return stats?.mapNotNull { usageStats ->
            if (usageStats.totalTimeInForeground > 0) {
                val packageName = usageStats.packageName
                val appName = try {
                    pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString()
                } catch (e: Exception) {
                    packageName
                }

                mapOf(
                    "packageName" to packageName,
                    "appName" to appName,
                    "usageTimeMs" to usageStats.totalTimeInForeground,
                    "lastTimeUsed" to usageStats.lastTimeUsed
                )
            } else {
                null
            }
        } ?: emptyList()
    }
}
