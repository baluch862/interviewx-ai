package com.example.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.Image
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.ui.theme.*

@Composable
fun LandingScreen(
    onNavigateToAuth: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    var visible by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        visible = true
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(ObsidianBg)
    ) {
        // Subtle background glow
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(NeonPurple.copy(alpha = 0.15f), Color.Transparent),
                        radius = 1200f
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(48.dp))

            // Logo Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Brush.linearGradient(listOf(ElectricBlue, NeonPurple)))
                        .padding(4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.FlashOn,
                        contentDescription = "InterviewX Flash logo",
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "InterviewX AI",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite,
                    letterSpacing = 1.sp
                )
            }

            Spacer(modifier = Modifier.height(36.dp))

            AnimatedVisibility(
                visible = visible,
                enter = fadeIn() + slideInVertically(initialOffsetY = { 100 })
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    // Headline
                    Text(
                        text = "Practice with Real AI\nRecruiters, Not Chatbots",
                        fontSize = 32.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = TextWhite,
                        lineHeight = 40.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "The premium, immersive simulation platform that analyzes your speech, grades technical accuracy in real-time, and scores your resume with high-fidelity feedback.",
                        fontSize = 15.sp,
                        color = TextMuted,
                        textAlign = TextAlign.Center,
                        lineHeight = 22.sp,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp)
                    )

                    Spacer(modifier = Modifier.height(32.dp))

                    // Main Action Hero Image
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .border(1.dp, BorderSlate, RoundedCornerShape(16.dp))
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.hero_interviewx_1782826577983),
                            contentDescription = "Futuristic Interview AI Banner",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        colors = listOf(Color.Transparent, ObsidianBg.copy(alpha = 0.85f))
                                    )
                                )
                        )
                    }

                    Spacer(modifier = Modifier.height(32.dp))

                    // Buttons
                    Button(
                        onClick = onNavigateToAuth,
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
                                .background(Brush.linearGradient(listOf(ElectricBlue, NeonPurple)))
                                .padding(horizontal = 16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Text(
                                    text = "Start Preparing Now",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp,
                                    color = Color.White
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Icon(Icons.Default.ArrowForward, contentDescription = "Arrow Forward")
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(48.dp))

                    // Features Section Title
                    Text(
                        text = "CORE SYSTEM FEATURES",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = ElectricBlue,
                        letterSpacing = 2.sp
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Premium Feature Cards
                    FeatureCard(
                        icon = Icons.Default.Mic,
                        title = "AI Voice Interviewer",
                        description = "Simulates real behavioral, technical, and executive interviews. Reads aloud naturally and listens to your spoken feedback."
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    FeatureCard(
                        icon = Icons.Default.Analytics,
                        title = "ATS Resume Scan",
                        description = "Detailed breakdown of your resume against target corporate benchmarks. Finds keywords, formatting defects, and missing skills."
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    FeatureCard(
                        icon = Icons.Default.Map,
                        title = "12-Week Career Roadmap",
                        description = "Custom-tailored learning plan outlining high-ROI certificates, projects, and target study timelines."
                    )
                }
            }

            Spacer(modifier = Modifier.height(64.dp))
        }
    }
}

@Composable
fun FeatureCard(
    onItemClick: () -> Unit = {},
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    description: String
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderSlate, RoundedCornerShape(16.dp))
            .clickable { onItemClick() },
        colors = CardDefaults.cardColors(containerColor = SpaceGrayCard),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.Top
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(ElectricBlue.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = ElectricBlue,
                    modifier = Modifier.size(24.dp)
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(
                    text = title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = description,
                    fontSize = 13.sp,
                    color = TextMuted,
                    lineHeight = 18.sp
                )
            }
        }
    }
}
