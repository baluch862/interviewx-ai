package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

import androidx.compose.ui.graphics.Color

private val DarkColorScheme =
  darkColorScheme(
    primary = ElectricBlue,
    onPrimary = Color.White,
    secondary = NeonPurple,
    onSecondary = Color.White,
    tertiary = CyberCyan,
    background = ObsidianBg,
    onBackground = TextWhite,
    surface = SpaceGrayCard,
    onSurface = TextWhite,
    outline = BorderSlate
  )

private val LightColorScheme = DarkColorScheme // Enforce dark theme always for AI-cyber feel

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = true, // Force dark mode by default
  dynamicColor: Boolean = false, // Disable dynamic colors to preserve premium SaaS visuals
  content: @Composable () -> Unit,
) {
  val colorScheme =
    when {
      dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
        val context = LocalContext.current
        if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
      }

      else -> DarkColorScheme
    }

  MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
