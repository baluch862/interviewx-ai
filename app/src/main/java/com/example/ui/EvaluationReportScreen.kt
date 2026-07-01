package com.example.ui

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.InterviewQuestion
import com.example.data.InterviewSession
import com.example.ui.theme.*
import com.example.viewmodel.InterviewXViewModel

@Composable
fun EvaluationReportScreen(
    viewModel: InterviewXViewModel,
    sessionId: Int?,
    onNavigateHome: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    val sessions by viewModel.sessions.collectAsState()
    val session = remember(sessions, sessionId) {
        sessions.firstOrNull { it.id == (sessionId ?: viewModel.activeSessionId.value) }
    }

    // Collect questions for the session
    var activeQuestions by remember { mutableStateOf<List<InterviewQuestion>>(emptyList()) }

    LaunchedEffect(session) {
        session?.let { s ->
            viewModel.getQuestionsForSession(s.id).collect {
                activeQuestions = it
            }
        }
    }

    if (session == null) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(ObsidianBg),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = ElectricBlue)
                Spacer(modifier = Modifier.height(16.dp))
                Text("Retrieving interview report profile...", color = TextMuted, fontSize = 14.sp)
            }
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

        // Title Header
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(GlowGreen.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Summarize,
                    contentDescription = "Summary Logo",
                    tint = GlowGreen,
                    modifier = Modifier.size(22.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = "Evaluation Report",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite
                )
                Text(
                    text = "${session.company} • ${session.mode}",
                    fontSize = 12.sp,
                    color = TextMuted
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Large Rating Banner Card
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
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "OVERALL INTERVIEW SCORE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "${session.overallScore}%",
                    fontSize = 54.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (session.overallScore >= 75) GlowGreen else GlowOrange
                )
                Spacer(modifier = Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (session.overallScore >= 75) GlowGreen.copy(alpha = 0.12f) else GlowOrange.copy(alpha = 0.12f))
                        .padding(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = if (session.overallScore >= 75) "EXCELLENT PREP VELOCITY" else "PRACTICE REQUIRED",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (session.overallScore >= 75) GlowGreen else GlowOrange
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Executive summary
        Text(
            text = "EXECUTIVE SUMMARY",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = TextMuted,
            letterSpacing = 1.5.sp
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Strengths & Weaknesses
        ReportCard(title = "Primary Key Strengths", icon = Icons.Default.ThumbUp, content = session.strengths, tint = GlowGreen)
        Spacer(modifier = Modifier.height(12.dp))
        ReportCard(title = "Constructive Areas of Improvement", icon = Icons.Default.ThumbDown, content = session.weaknesses, tint = GlowRed)
        Spacer(modifier = Modifier.height(12.dp))
        ReportCard(title = "Missed Technical Concepts", icon = Icons.Default.Warning, content = session.missedConcepts, tint = GlowOrange)
        Spacer(modifier = Modifier.height(12.dp))
        ReportCard(title = "Suggested Study & Learning Plan", icon = Icons.Default.School, content = session.suggestedLearningPlan, tint = CyberCyan)
        Spacer(modifier = Modifier.height(12.dp))
        ReportCard(title = "Recruiter Advisor Comments", icon = Icons.Default.Feedback, content = session.recruiterComments, tint = NeonPurple)
        Spacer(modifier = Modifier.height(12.dp))
        ReportCard(title = "Advisor General Feedback", icon = Icons.Default.Message, content = session.generalFeedback, tint = ElectricBlue)

        Spacer(modifier = Modifier.height(24.dp))

        // Detailed Question Breakdowns
        Text(
            text = "DETAILED QUESTION RUNS",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = TextMuted,
            letterSpacing = 1.5.sp
        )

        Spacer(modifier = Modifier.height(12.dp))

        activeQuestions.forEach { question ->
            QuestionBreakdownCard(question = question)
            Spacer(modifier = Modifier.height(12.dp))
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Bottom Actions
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = onNavigateHome,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = BorderSlate),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("Dashboard", color = TextWhite)
            }

            Button(
                onClick = {
                    Toast.makeText(context, "Full PDF Report exported to storage", Toast.LENGTH_LONG).show()
                },
                modifier = Modifier.weight(1.2f),
                colors = ButtonDefaults.buttonColors(containerColor = ElectricBlue),
                shape = RoundedCornerShape(10.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Share, contentDescription = "Share")
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Export Report PDF")
                }
            }
        }

        Spacer(modifier = Modifier.height(48.dp))
    }
}

@Composable
fun QuestionBreakdownCard(question: InterviewQuestion) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderSlate, RoundedCornerShape(12.dp))
            .clickable { expanded = !expanded },
        colors = CardDefaults.cardColors(containerColor = SpaceGrayCard),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(ElectricBlue.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "${question.score}/10",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = ElectricBlue
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = question.questionText,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextWhite,
                        maxLines = if (expanded) 5 else 1
                    )
                }
                Icon(
                    imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = "Expand info icon",
                    tint = TextMuted
                )
            }

            AnimatedVisibility(visible = expanded) {
                Column(modifier = Modifier.padding(top = 16.dp)) {
                    Divider(color = BorderSlate, modifier = Modifier.padding(bottom = 12.dp))

                    Text("Your Response", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                    Text(
                        text = if (question.userResponse.isEmpty()) "Not answered" else question.userResponse,
                        fontSize = 12.sp,
                        color = TextWhite,
                        modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
                    )

                    // Progress Metric Bars (Scores converted 1-10 to percentage)
                    MetricLineBar(label = "Confidence", score = question.confidenceScore * 10, color = ElectricBlue)
                    MetricLineBar(label = "Communication", score = question.communicationScore * 10, color = NeonPurple)
                    MetricLineBar(label = "Grammar Accuracy", score = question.grammarScore * 10, color = CyberCyan)
                    MetricLineBar(label = "Technical Accuracy", score = question.technicalAccuracyScore * 10, color = GlowGreen)
                    MetricLineBar(label = "Clarity & articulation", score = question.clarityScore * 10, color = GlowOrange)
                    MetricLineBar(label = "Problem Solving", score = question.problemSolvingScore * 10, color = ElectricBlue)
                    MetricLineBar(label = "Depth of Knowledge", score = question.depthOfKnowledgeScore * 10, color = NeonPurple)

                    Spacer(modifier = Modifier.height(12.dp))

                    Text("STAR Format Critique", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                    Text(
                        text = question.starFeedback,
                        fontSize = 12.sp,
                        color = TextWhite,
                        modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
                    )

                    Text("Actionable Tips", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                    Text(
                        text = question.tips,
                        fontSize = 12.sp,
                        color = GlowOrange,
                        modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
                    )

                    Text("Ideal Recommended Answer Reference", fontSize = 11.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                    Text(
                        text = question.idealAnswer,
                        fontSize = 12.sp,
                        color = TextMuted,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun MetricLineBar(
    label: String,
    score: Int,
    color: Color
) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = label, fontSize = 10.sp, color = TextMuted)
            Text(text = "$score%", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextWhite)
        }
        Spacer(modifier = Modifier.height(4.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(4.dp)
                .clip(RoundedCornerShape(2.dp))
                .background(BorderSlate)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(score / 100f)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(2.dp))
                    .background(color)
            )
        }
    }
}
