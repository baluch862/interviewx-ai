package com.example.ui

import android.Manifest
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import com.example.utils.SpeechRecognizerHelper
import com.example.utils.TextToSpeechHelper
import com.example.viewmodel.InterviewXViewModel
import com.example.viewmodel.UiState
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun InterviewActiveScreen(
    viewModel: InterviewXViewModel,
    onNavigateToReport: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    val activeSession by viewModel.activeSession.collectAsState()
    val questions by viewModel.activeQuestions.collectAsState()
    val currentIndex by viewModel.currentQuestionIndex.collectAsState()
    val gradingState by viewModel.questionGradingState.collectAsState()

    var userTextResponse by remember { mutableStateOf("") }
    var isListeningState by remember { mutableStateOf(false) }
    var recognitionError by remember { mutableStateOf("") }
    
    // Hands-Free Mode active by default
    var isHandsFreeEnabled by remember { mutableStateOf(true) }

    // TTS & Speech Recognizer references
    val ttsHelper = remember { TextToSpeechHelper(context) }
    var speechHelper by remember { mutableStateOf<SpeechRecognizerHelper?>(null) }

    val recordAudioPermission = rememberPermissionState(Manifest.permission.RECORD_AUDIO)

    val currentQuestion = remember(questions, currentIndex) {
        questions.getOrNull(currentIndex)
    }

    // Dynamic word disclosure for synchronized subtitles
    val words = remember(currentQuestion) {
        currentQuestion?.questionText?.split("\\s+".toRegex()) ?: emptyList()
    }
    var visibleWordCount by remember { mutableStateOf(0) }
    var isTtsSpeaking by remember { mutableStateOf(false) }

    // Auto-read question on load + progressive subtitle disclosure
    LaunchedEffect(currentQuestion) {
        currentQuestion?.let { q ->
            userTextResponse = "" // Clear previous answer
            isTtsSpeaking = true
            visibleWordCount = 0
            
            // Speak the question text
            ttsHelper.speak(q.questionText)
            
            // Progressively reveal words to simulate synchronized subtitles (approx 180 words per minute)
            for (i in 1..words.size) {
                kotlinx.coroutines.delay(260) // natural reading delay per word
                visibleWordCount = i
            }
            
            isTtsSpeaking = false
            
            // Automatically launch hands-free voice capture after AI finishes speaking
            if (isHandsFreeEnabled) {
                if (recordAudioPermission.status.isGranted) {
                    kotlinx.coroutines.delay(500)
                    speechHelper?.startListening()
                } else {
                    recordAudioPermission.launchPermissionRequest()
                }
            }
        }
    }

    // Initialize speech recognizer with automatic hands-free dispatcher
    DisposableEffect(currentQuestion) {
        speechHelper = SpeechRecognizerHelper(
            context = context,
            onResult = { result ->
                userTextResponse = result
                isListeningState = false
                
                // Automatic hands-free submit when user finishes speaking
                if (isHandsFreeEnabled && result.trim().isNotEmpty()) {
                    currentQuestion?.let { q ->
                        viewModel.submitAnswerAndEvaluate(q.id, result)
                        if (currentIndex + 1 >= questions.size) {
                            Toast.makeText(context, "Interview complete! Compiling final scorecard...", Toast.LENGTH_LONG).show()
                            onNavigateToReport()
                        }
                    }
                }
            },
            onPartialResult = { partial ->
                userTextResponse = partial
            },
            onError = { error ->
                recognitionError = error
                isListeningState = false
                Toast.makeText(context, error, Toast.LENGTH_SHORT).show()
            },
            onListeningStateChanged = { listening ->
                isListeningState = listening
            }
        )

        onDispose {
            speechHelper?.destroy()
        }
    }

    // Clean up TTS helper on screen dispose
    DisposableEffect(Unit) {
        onDispose {
            ttsHelper.shutdown()
        }
    }

    // Animation for pulse recording
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha"
    )

    val session = activeSession
    if (session == null) {
        Box(modifier = modifier.fillMaxSize().background(ObsidianBg), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(ObsidianBg)
            .verticalScroll(scrollState)
            .padding(20.dp)
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        // Active Session Badge with dynamic recruiter stage
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(32.dp))
                    .background(GlowGreen.copy(alpha = 0.12f))
                    .border(1.dp, GlowGreen.copy(alpha = 0.3f), RoundedCornerShape(32.dp))
                    .padding(horizontal = 12.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "RECRUITER STAGE: ${(currentQuestion?.stageName ?: session.currentStage).uppercase()}",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = GlowGreen,
                    letterSpacing = 1.sp
                )
            }

            Text(
                text = "Skip Prep",
                color = GlowRed,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier
                    .clickable {
                        viewModel.skipCurrentSession()
                        onNavigateToReport()
                    }
                    .padding(8.dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Recruiter Avatar representation
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderSlate, RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(CircleShape)
                        .background(Brush.linearGradient(listOf(ElectricBlue, NeonPurple))),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Face,
                        contentDescription = "AI Recruiter face icon",
                        tint = Color.White,
                        modifier = Modifier.size(28.dp)
                    )
                }
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text(
                        text = "AI Interviewer (Recruiter Mode)",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextWhite
                    )
                    Text(
                        text = "Analyzing STAR articulation & Technical depth",
                        fontSize = 12.sp,
                        color = TextMuted
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Current Question Card
        if (currentQuestion != null) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSlate, RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "QUESTION ${currentIndex + 1} OF ${questions.size}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = ElectricBlue,
                            letterSpacing = 1.sp
                        )

                        // Speak Question again Button
                        IconButton(
                            onClick = { ttsHelper.speak(currentQuestion.questionText) },
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(BorderSlate)
                        ) {
                            Icon(
                                imageVector = Icons.Default.VolumeUp,
                                contentDescription = "Listen Question Aloud",
                                tint = ElectricBlue,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Progressive disclosure (synchronized live subtitles)
                    val visibleText = words.take(visibleWordCount).joinToString(" ")
                    Text(
                        text = if (visibleText.isEmpty()) "AI Recruiter is thinking..." else visibleText,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isTtsSpeaking) CyberCyan else TextWhite,
                        lineHeight = 22.sp
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Hands-Free Mode Indicator and Control Toggle
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(BorderSlate.copy(alpha = 0.3f))
                            .padding(8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (isHandsFreeEnabled) Icons.Default.Hearing else Icons.Default.Keyboard,
                                contentDescription = "Input mode indicator",
                                tint = if (isHandsFreeEnabled) NeonPurple else TextMuted,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Hands-Free Voice Flow",
                                fontSize = 11.sp,
                                color = TextMuted,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Switch(
                            checked = isHandsFreeEnabled,
                            onCheckedChange = { isHandsFreeEnabled = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = NeonPurple,
                                checkedTrackColor = NeonPurple.copy(alpha = 0.4f),
                                uncheckedThumbColor = BorderSlate,
                                uncheckedTrackColor = Color.Transparent
                            )
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Answer Box Label
        Text(
            text = "YOUR COGNITIVE RESPONSE",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = TextMuted,
            letterSpacing = 1.5.sp
        )

        Spacer(modifier = Modifier.height(10.dp))

        // Answer Input Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderSlate, RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                OutlinedTextField(
                    value = userTextResponse,
                    onValueChange = { userTextResponse = it },
                    placeholder = { Text("Speak using our custom voice engine or paste structured response here...", color = TextMuted) },
                    textStyle = LocalTextStyle.current.copy(color = TextWhite),
                    minLines = 5,
                    maxLines = 8,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ElectricBlue,
                        unfocusedBorderColor = Color.Transparent
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Microphone Vocal Capture Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .background(
                                if (isListeningState) Brush.radialGradient(
                                    colors = listOf(
                                        NeonPurple.copy(alpha = pulseAlpha),
                                        NeonPurple.copy(alpha = 0.05f)
                                    )
                                ) else Brush.linearGradient(listOf(ElectricBlue, NeonPurple))
                            )
                            .clickable {
                                if (!recordAudioPermission.status.isGranted) {
                                    recordAudioPermission.launchPermissionRequest()
                                } else {
                                    if (isListeningState) {
                                        speechHelper?.stopListening()
                                    } else {
                                        recognitionError = ""
                                        speechHelper?.startListening()
                                    }
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isListeningState) Icons.Default.MicOff else Icons.Default.Mic,
                            contentDescription = "Microphone voice capture",
                            tint = Color.White,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = if (isListeningState) "SYSTEM LISTENING... Speak clearly." else "Tap Microphone to dictate, or type manually.",
                    fontSize = 11.sp,
                    color = if (isListeningState) NeonPurple else TextMuted,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Evaluation & Progress Controls
        if (gradingState is UiState.Loading) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSlate, RoundedCornerShape(12.dp)),
                colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = ElectricBlue)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("AI grading answer accuracy...", color = TextWhite, fontSize = 14.sp)
                }
            }
        } else {
            Button(
                onClick = {
                    if (userTextResponse.trim().isEmpty()) {
                        Toast.makeText(context, "Please provide or dictate an answer.", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    if (currentQuestion != null) {
                        viewModel.submitAnswerAndEvaluate(currentQuestion.id, userTextResponse)
                        // If it was the last question, go to final report screen
                        if (currentIndex + 1 >= questions.size) {
                            Toast.makeText(context, "Interview complete! Final report compiled.", Toast.LENGTH_LONG).show()
                            onNavigateToReport()
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                contentPadding = PaddingValues(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Brush.linearGradient(listOf(ElectricBlue, NeonPurple))),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Send, contentDescription = "Submit Response", tint = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (currentIndex + 1 >= questions.size) "Finalize Interview" else "Submit Answer",
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(48.dp))
    }
}
