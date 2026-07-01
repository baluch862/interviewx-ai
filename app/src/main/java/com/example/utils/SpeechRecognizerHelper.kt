package com.example.utils

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log

class SpeechRecognizerHelper(
    private val context: Context,
    private val onResult: (String) -> Unit,
    private val onPartialResult: (String) -> Unit = {},
    private val onError: (String) -> Unit = {},
    private val onListeningStateChanged: (Boolean) -> Unit = {}
) {
    private var speechRecognizer: SpeechRecognizer? = null
    private val recognizerIntent: Intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US")
        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
    }

    init {
        try {
            if (SpeechRecognizer.isRecognitionAvailable(context)) {
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                    setRecognitionListener(object : RecognitionListener {
                        override fun onReadyForSpeech(params: Bundle?) {
                            onListeningStateChanged(true)
                        }

                        override fun onBeginningOfSpeech() {}

                        override fun onRmsChanged(rmsdB: Float) {}

                        override fun onBufferReceived(buffer: ByteArray?) {}

                        override fun onEndOfSpeech() {
                            onListeningStateChanged(false)
                        }

                        override fun onError(error: Int) {
                            onListeningStateChanged(false)
                            val errorMessage = when (error) {
                                SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                                SpeechRecognizer.ERROR_CLIENT -> "Client-side error"
                                SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Audio permission denied"
                                SpeechRecognizer.ERROR_NETWORK -> "Network connection error"
                                SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                                SpeechRecognizer.ERROR_NO_MATCH -> "No speech recognized. Please try again."
                                SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Speech service is busy"
                                SpeechRecognizer.ERROR_SERVER -> "Server-side error"
                                SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input. Please speak clearly."
                                else -> "Speech input timeout or error"
                            }
                            onError(errorMessage)
                        }

                        override fun onResults(results: Bundle?) {
                            val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                            if (!matches.isNullOrEmpty()) {
                                onResult(matches[0])
                            }
                        }

                        override fun onPartialResults(partialResults: Bundle?) {
                            val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                            if (!matches.isNullOrEmpty()) {
                                onPartialResult(matches[0])
                            }
                        }

                        override fun onEvent(eventType: Int, params: Bundle?) {}
                    })
                }
            } else {
                Log.e("SpeechRecognizer", "Speech recognition is not available")
            }
        } catch (e: Exception) {
            Log.e("SpeechRecognizer", "Error creating speech recognizer: ${e.message}")
        }
    }

    fun startListening() {
        speechRecognizer?.startListening(recognizerIntent)
    }

    fun stopListening() {
        speechRecognizer?.stopListening()
    }

    fun destroy() {
        try {
            speechRecognizer?.stopListening()
            speechRecognizer?.destroy()
        } catch (e: Exception) {
            Log.e("SpeechRecognizer", "Error during destroy: ${e.message}")
        }
    }
}
