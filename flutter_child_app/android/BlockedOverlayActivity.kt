package com.example.kitecontrol

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class BlockedOverlayActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Simple dynamic UI for the block screen
        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setBackgroundColor(android.graphics.Color.parseColor("#141414"))
            setPadding(64, 64, 64, 64)
        }

        val icon = android.widget.ImageView(this).apply {
            setImageResource(android.R.drawable.ic_lock_lock)
            setColorFilter(android.graphics.Color.parseColor("#FF9800"))
        }

        val blockType = intent.getStringExtra("block_type")
        
        val title = TextView(this).apply {
            text = if (blockType == "BEDTIME") "Time for Sleep" else "App Blocked"
            setTextColor(android.graphics.Color.WHITE)
            textSize = 24f
            setPadding(0, 32, 0, 16)
        }

        val desc = TextView(this).apply {
            text = if (blockType == "BEDTIME") 
                "Bedtime mode is active. This device is locked until the morning." 
                else "Your parent has restricted access to this application for today."
            setTextColor(android.graphics.Color.GRAY)
            gravity = android.view.Gravity.CENTER
        }

        val button = Button(this).apply {
            text = "Go to Home"
            setBackgroundColor(android.graphics.Color.parseColor("#FF9800"))
            setOnClickListener { finish() }
        }

        layout.addView(icon)
        layout.addView(title)
        layout.addView(desc)
        layout.addView(button)

        setContentView(layout)
    }
}
