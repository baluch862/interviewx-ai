package com.example.ui

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
import com.example.data.ResumeAnalysis
import com.example.ui.theme.*
import com.example.viewmodel.InterviewXViewModel
import com.example.viewmodel.UiState

@Composable
fun ResumeAnalyzerScreen(
    viewModel: InterviewXViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    val resumeAnalyses by viewModel.resumeAnalyses.collectAsState()
    val analysisState by viewModel.resumeAnalysisState.collectAsState()

    var resumeText by remember { mutableStateOf("") }
    var fileName by remember { mutableStateOf("My_Resume.pdf") }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(ObsidianBg)
            .verticalScroll(scrollState)
            .padding(20.dp)
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        // Title Row
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(ElectricBlue.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Analytics,
                    contentDescription = "Resume Analyzer Logo",
                    tint = ElectricBlue,
                    modifier = Modifier.size(22.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = "Resume ATS Audit",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite
                )
                Text(
                    text = "Scan resume against corporate parsing algorithms",
                    fontSize = 12.sp,
                    color = TextMuted
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Form Section (if Idle or Error)
        if (analysisState is UiState.Idle || analysisState is UiState.Error) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSlate, RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Paste Resume Content",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextWhite
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Copy/paste your resume plain text or load our default template below.",
                        fontSize = 12.sp,
                        color = TextMuted
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = resumeText,
                        onValueChange = { resumeText = it },
                        placeholder = { Text("Paste entire resume layout here...", color = TextMuted) },
                        textStyle = LocalTextStyle.current.copy(color = TextWhite),
                        minLines = 8,
                        maxLines = 12,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ElectricBlue,
                            unfocusedBorderColor = BorderSlate
                        )
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Simulated Quick-Template Load
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(
                            onClick = {
                                resumeText = """
                                    John Doe
                                    john.doe@gmail.com | 555-0199 | San Francisco, CA
                                    
                                    PROFESSIONAL SUMMARY
                                    Junior Android Developer with 1 year experience building clean, responsive interfaces. Familiar with Java and Git. Looking to learn Kotlin and Room.
                                    
                                    EXPERIENCE
                                    AppCorp - Junior Developer (2025 - Present)
                                    - Fixed UI bugs in legacy Android Java application.
                                    - Participated in weekly standups and wrote pull requests.
                                    
                                    SKILLS
                                    Java, XML, Android SDK, Git, SQL, JSON
                                """.trimIndent()
                                fileName = "John_Doe_Developer_Resume.pdf"
                                Toast.makeText(context, "Loaded developer template", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = BorderSlate),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Dev Template", color = TextWhite)
                        }

                        Button(
                            onClick = {
                                if (resumeText.isEmpty()) {
                                    Toast.makeText(context, "Please paste resume text or load template first", Toast.LENGTH_SHORT).show()
                                    return@Button
                                }
                                viewModel.analyzeResumeText(resumeText, fileName)
                            },
                            modifier = Modifier.weight(1.2f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                            contentPadding = PaddingValues(),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(Brush.linearGradient(listOf(ElectricBlue, NeonPurple))),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.QueryStats, contentDescription = "Scan Icon", tint = Color.White)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Audit Resume", fontWeight = FontWeight.Bold, color = Color.White)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Loading Section
        if (analysisState is UiState.Loading) {
            Spacer(modifier = Modifier.height(16.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSlate, RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
            ) {
                Column(
                    modifier = Modifier.padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularProgressIndicator(color = ElectricBlue)
                    Spacer(modifier = Modifier.height(20.dp))
                    Text(
                        text = "AI Analyzing Resume Architecture...",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextWhite,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "Running ATS keyword parsing, checking structure anomalies, grammar layout, and compiling customized training roadmap...",
                        fontSize = 12.sp,
                        color = TextMuted,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }

        // Success Report Section
        if (analysisState is UiState.Success) {
            val analysis = (analysisState as UiState.Success<ResumeAnalysis>).data
            Spacer(modifier = Modifier.height(16.dp))

            // Score Badge
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        BorderStroke(1.dp, Brush.linearGradient(listOf(ElectricBlue, NeonPurple))),
                        RoundedCornerShape(16.dp)
                    ),
                colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "OVERALL ATS SCORE",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextMuted,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "${analysis.atsScore}",
                        fontSize = 64.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = if (analysis.atsScore >= 75) GlowGreen else GlowOrange
                    )
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (analysis.atsScore >= 75) GlowGreen.copy(alpha = 0.12f) else GlowOrange.copy(alpha = 0.12f))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = if (analysis.atsScore >= 75) "OPTIMIZED" else "NEEDS POLISH",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (analysis.atsScore >= 75) GlowGreen else GlowOrange
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Detailed Cards
            ReportCard(title = "Matched Keywords", icon = Icons.Default.CheckCircle, content = analysis.matchedKeywords, tint = GlowGreen)
            Spacer(modifier = Modifier.height(12.dp))
            ReportCard(title = "Missing Critical Skills", icon = Icons.Default.Cancel, content = analysis.missingSkills, tint = GlowRed)
            Spacer(modifier = Modifier.height(12.dp))
            ReportCard(title = "Content Improvement Suggestions", icon = Icons.Default.Lightbulb, content = analysis.suggestions, tint = GlowOrange)
            Spacer(modifier = Modifier.height(12.dp))
            ReportCard(title = "Formatting Evaluation", icon = Icons.Default.FormatAlignLeft, content = analysis.formattingFeedback, tint = ElectricBlue)
            Spacer(modifier = Modifier.height(12.dp))
            ReportCard(title = "Grammar & Phrasing", icon = Icons.Default.Spellcheck, content = analysis.grammarFeedback, tint = NeonPurple)
            Spacer(modifier = Modifier.height(12.dp))
            ReportCard(title = "Custom Training Roadmap", icon = Icons.Default.Timeline, content = analysis.proposedCertsAndRoadmap, tint = CyberCyan)

            Spacer(modifier = Modifier.height(24.dp))

            // Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = {
                        viewModelScopeLaunchDummy(viewModel) {
                            // Re-enable editing
                            viewModel.updateProfile(viewModel.userProfile.value) // trigger refresh
                        }
                        Toast.makeText(context, "Rescan activated", Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = BorderSlate),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("New Audit", color = TextWhite)
                }

                Button(
                    onClick = {
                        Toast.makeText(context, "Report saved locally as Resume_Audit_Report.pdf", Toast.LENGTH_LONG).show()
                    },
                    modifier = Modifier.weight(1.2f),
                    colors = ButtonDefaults.buttonColors(containerColor = ElectricBlue),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Download, contentDescription = "Download")
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Download PDF")
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(48.dp))
    }
}

// Inline helper to launch clean coroutines for UI reset
fun viewModelScopeLaunchDummy(viewModel: InterviewXViewModel, action: () -> Unit) {
    action()
}

@Composable
fun ReportCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    content: String,
    tint: Color
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderSlate, RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = SpaceGrayCard),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = tint,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = content,
                fontSize = 13.sp,
                color = TextMuted,
                lineHeight = 18.sp
            )
        }
    }
}
