package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModelProvider
import com.example.ui.MainApp
import com.example.ui.theme.MyApplicationTheme
import com.example.viewmodel.InterviewXViewModel

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    
    // Instantiate our unified enterprise Interview ViewModel
    val viewModel = ViewModelProvider(this)[InterviewXViewModel::class.java]
    
    setContent {
      MyApplicationTheme {
        Surface(
          modifier = Modifier.fillMaxSize(),
          color = com.example.ui.theme.ObsidianBg
        ) {
          MainApp(viewModel = viewModel)
        }
      }
    }
  }
}
