package com.example.ui

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import com.example.viewmodel.InterviewXViewModel
import com.example.viewmodel.UiState

@Composable
fun CareerCoachScreen(
    viewModel: InterviewXViewModel,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    val coachState by viewModel.careerCoachState.collectAsState()

    LaunchedEffect(Unit) {
        if (coachState is UiState.Idle) {
            viewModel.loadCareerCoachRoadmap()
        }
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
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(CyberCyan.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Timeline,
                    contentDescription = "Career Coach Logo",
                    tint = CyberCyan,
                    modifier = Modifier.size(22.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = "AI Career Advisor",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite
                )
                Text(
                    text = "Hyper-personalized 12-week sandbox coaching",
                    fontSize = 12.sp,
                    color = TextMuted
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        when (coachState) {
            is UiState.Idle, is UiState.Loading -> {
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
                        CircularProgressIndicator(color = CyberCyan)
                        Spacer(modifier = Modifier.height(20.dp))
                        Text(
                            text = "Consulting Career Advisor...",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextWhite
                        )
                        Text(
                            text = "Analyzing corporate benchmarks, parsing current mock performance trends, and formulating high-ROI certificate roadmaps...",
                            fontSize = 12.sp,
                            color = TextMuted,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            }

            is UiState.Error -> {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, BorderSlate, RoundedCornerShape(16.dp)),
                    colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.Error, contentDescription = "Error icon", tint = GlowRed, modifier = Modifier.size(40.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("Advisor Sync Failed", fontWeight = FontWeight.Bold, color = TextWhite)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = (coachState as UiState.Error).message,
                            fontSize = 12.sp,
                            color = TextMuted,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = { viewModel.loadCareerCoachRoadmap() },
                            colors = ButtonDefaults.buttonColors(containerColor = ElectricBlue)
                        ) {
                            Text("Retry Consulting")
                        }
                    }
                }
            }

            is UiState.Success -> {
                val roadmapText = (coachState as UiState.Success<String>).data

                // Beautiful custom styled card content parser
                val blocks = roadmapText.split("###").filter { it.trim().isNotEmpty() }

                blocks.forEach { block ->
                    val lines = block.trim().split("\n")
                    val blockTitle = lines.firstOrNull()?.replace("#", "")?.trim() ?: "Guidance Module"
                    val blockBody = lines.drop(1).joinToString("\n").trim()

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                            .border(1.dp, BorderSlate, RoundedCornerShape(16.dp)),
                        colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(
                                text = blockTitle,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = CyberCyan
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = blockBody,
                                fontSize = 13.sp,
                                color = TextWhite,
                                lineHeight = 19.sp
                            )
                        }
                    }
                }

                // If markdown formatting has no ### blocks, fallback to displaying the raw clean layout
                if (blocks.isEmpty()) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, BorderSlate, RoundedCornerShape(16.dp)),
                        colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(
                                text = "Personalized Coaching Roadmap",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = CyberCyan
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = roadmapText,
                                fontSize = 13.sp,
                                color = TextWhite,
                                lineHeight = 19.sp
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(48.dp))
    }
}
