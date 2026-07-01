package com.example.utils

import android.content.Context
import android.speech.tts.TextToSpeech
import android.util.Log
import java.util.Locale

class TextToSpeechHelper(context: Context) {
    private var tts: TextToSpeech? = null
    private var isInitialized = false

    init {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val result = tts?.setLanguage(Locale.US)
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    Log.e("TTS", "Language is not supported or missing data")
                } else {
                    isInitialized = true
                }
            } else {
                Log.e("TTS", "Initialization failed")
            }
        }
    }

    fun speak(text: String) {
        if (isInitialized) {
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "InterviewXTTS")
        }
    }

    fun stop() {
        tts?.stop()
    }

    fun shutdown() {
        try {
            tts?.stop()
            tts?.shutdown()
        } catch (e: Exception) {
            Log.e("TTS", "Error during shutdown: ${e.message}")
        }
    }
}
