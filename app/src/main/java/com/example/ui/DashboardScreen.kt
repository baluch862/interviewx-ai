package com.example.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.InterviewSession
import com.example.data.UserProfile
import com.example.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun DashboardScreen(
    userProfile: UserProfile,
    sessions: List<InterviewSession>,
    onStartPractice: () -> Unit,
    onNavigateToResume: () -> Unit,
    onNavigateToCoach: () -> Unit,
    onNavigateToHistorySession: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(ObsidianBg)
            .padding(horizontal = 20.dp),
        contentPadding = PaddingValues(bottom = 32.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(28.dp))

            // Welcome & Profile Summary Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "System Ready,",
                        fontSize = 14.sp,
                        color = TextMuted,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "Hello, ${userProfile.name}!",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = TextWhite
                    )
                }

                // Premium Badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(Brush.linearGradient(listOf(NeonPurple, ElectricBlue)))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.WorkspacePremium,
                            contentDescription = "Premium Badge Icon",
                            tint = Color.White,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "PREMIUM",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White,
                            letterSpacing = 1.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Target Role Info Card
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
                            .size(48.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(ElectricBlue.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.BusinessCenter,
                            contentDescription = "Target icon",
                            tint = ElectricBlue,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Targeting ${userProfile.targetRole}",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextWhite
                        )
                        Text(
                            text = "at ${userProfile.targetCompany} (${userProfile.experienceLevel})",
                            fontSize = 13.sp,
                            color = TextMuted
                        )
                    }
                    // Streak counter
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.LocalFireDepartment,
                            contentDescription = "Streak Fire Icon",
                            tint = GlowOrange,
                            modifier = Modifier.size(24.dp)
                        )
                        Text(
                            text = "${userProfile.streak}d Streak",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = GlowOrange
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Key Metrics Rings
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                MetricWidget(
                    modifier = Modifier.weight(1f),
                    title = "Readiness Rating",
                    score = userProfile.estimatedReadiness,
                    color = ElectricBlue,
                    glowingColor = NeonPurple,
                    onItemClick = onNavigateToCoach
                )
                MetricWidget(
                    modifier = Modifier.weight(1f),
                    title = "ATS Resume",
                    score = if (userProfile.averageAtsScore > 0) userProfile.averageAtsScore else 45,
                    color = GlowGreen,
                    glowingColor = ElectricBlue,
                    onItemClick = onNavigateToResume
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Performance Trend Title
            Text(
                text = "PERFORMANCE PROGRESS GRAPH",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = ElectricBlue,
                letterSpacing = 1.5.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Interactive Progress Canvas Graph
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSlate, RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "SaaS Sandbox Prep Velocity (0-100)",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextWhite
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    val scorePoints = remember(sessions) {
                        val points = sessions.filter { it.isCompleted }.take(6).reversed().map { it.overallScore.toFloat() }
                        if (points.isEmpty()) listOf(40f, 45f, 52f, 58f, 64f, 75f) else points
                    }

                    Canvas(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp)
                    ) {
                        val width = size.width
                        val height = size.height
                        val stepX = width / (scorePoints.size - 1).coerceAtLeast(1)
                        val maxScore = 100f

                        val points = scorePoints.mapIndexed { index, score ->
                            val x = index * stepX
                            val y = height - (score / maxScore * height)
                            Offset(x, y)
                        }

                        // Draw background vertical guides
                        for (i in 0 until scorePoints.size) {
                            val x = i * stepX
                            drawLine(
                                color = BorderSlate.copy(alpha = 0.5f),
                                start = Offset(x, 0f),
                                end = Offset(x, height),
                                strokeWidth = 1.dp.toPx()
                            )
                        }

                        // Draw path line
                        val path = Path().apply {
                            moveTo(points.first().x, points.first().y)
                            for (i in 1 until points.size) {
                                val current = points[i]
                                val prev = points[i - 1]
                                val cpX1 = prev.x + (current.x - prev.x) / 2
                                val cpY1 = prev.y
                                val cpX2 = prev.x + (current.x - prev.x) / 2
                                val cpY2 = current.y
                                cubicTo(cpX1, cpY1, cpX2, cpY2, current.x, current.y)
                            }
                        }

                        drawPath(
                            path = path,
                            color = ElectricBlue,
                            style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
                        )

                        // Gradient fill under path
                        val fillPath = Path().apply {
                            addPath(path)
                            lineTo(points.last().x, height)
                            lineTo(points.first().x, height)
                            close()
                        }
                        drawPath(
                            path = fillPath,
                            brush = Brush.verticalGradient(
                                colors = listOf(ElectricBlue.copy(alpha = 0.25f), Color.Transparent)
                            )
                        )

                        // Draw circular points
                        points.forEach { offset ->
                            drawCircle(
                                color = NeonPurple,
                                radius = 5.dp.toPx(),
                                center = offset
                            )
                            drawCircle(
                                color = Color.White,
                                radius = 2.dp.toPx(),
                                center = offset
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        val labels = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Today")
                        labels.forEach { label ->
                            Text(text = label, fontSize = 10.sp, color = TextMuted)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Daily Challenge Panel
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        BorderStroke(1.dp, Brush.linearGradient(listOf(ElectricBlue, NeonPurple))),
                        RoundedCornerShape(16.dp)
                    )
                    .clickable { onStartPractice() },
                colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
            ) {
                Row(
                    modifier = Modifier.padding(18.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(Brush.linearGradient(listOf(ElectricBlue, NeonPurple))),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.OfflineBolt,
                            contentDescription = "Daily challenge icon",
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Daily Challenge: Apple System Design",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextWhite
                        )
                        Text(
                            text = "Earn streak rewards & increase readiness score",
                            fontSize = 12.sp,
                            color = TextMuted
                        )
                    }
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "Start daily challenge",
                        tint = ElectricBlue
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Recent Interviews Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "RECENT EVALUATIONS",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted,
                    letterSpacing = 1.5.sp
                )
                Text(
                    text = "View All (${sessions.size})",
                    fontSize = 12.sp,
                    color = ElectricBlue,
                    modifier = Modifier.clickable { onStartPractice() }
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
        }

        if (sessions.isEmpty()) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                        .border(1.dp, BorderSlate, RoundedCornerShape(16.dp)),
                    colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.HourglassEmpty,
                            contentDescription = "No interviews conducted yet",
                            tint = TextMuted,
                            modifier = Modifier.size(36.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "No sandbox interviews launched yet.",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextWhite
                        )
                        Text(
                            text = "Launch your first custom interview loop to view reports.",
                            fontSize = 12.sp,
                            color = TextMuted,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = onStartPractice,
                            colors = ButtonDefaults.buttonColors(containerColor = ElectricBlue),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Launch Prep Room", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        } else {
            items(sessions.take(4)) { session ->
                SessionHistoryItem(
                    session = session,
                    onItemClick = { onNavigateToHistorySession(session.id) }
                )
                Spacer(modifier = Modifier.height(10.dp))
            }
        }
    }
}

@Composable
fun MetricWidget(
    modifier: Modifier = Modifier,
    title: String,
    score: Int,
    color: Color,
    glowingColor: Color,
    onItemClick: () -> Unit
) {
    val animatedScore by animateFloatAsState(
        targetValue = score.toFloat(),
        animationSpec = tween(durationMillis = 1000)
    )

    Card(
        modifier = modifier
            .border(1.dp, BorderSlate, RoundedCornerShape(16.dp))
            .clickable { onItemClick() },
        colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = title,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = TextMuted
            )

            Spacer(modifier = Modifier.height(16.dp))

            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(80.dp)
            ) {
                Canvas(modifier = Modifier.size(80.dp)) {
                    // Gray Track
                    drawArc(
                        color = BorderSlate,
                        startAngle = -90f,
                        sweepAngle = 360f,
                        useCenter = false,
                        style = Stroke(width = 6.dp.toPx(), cap = StrokeCap.Round)
                    )
                    // Colored rating fill
                    drawArc(
                        brush = Brush.sweepGradient(
                            listOf(color, glowingColor, color)
                        ),
                        startAngle = -90f,
                        sweepAngle = (animatedScore / 100f) * 360f,
                        useCenter = false,
                        style = Stroke(width = 6.dp.toPx(), cap = StrokeCap.Round)
                    )
                }
                Text(
                    text = "${animatedScore.toInt()}%",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = TextWhite
                )
            }
        }
    }
}

@Composable
fun SessionHistoryItem(
    session: InterviewSession,
    onItemClick: () -> Unit
) {
    val dateFormat = remember { SimpleDateFormat("MMM dd, yyyy", Locale.US) }
    val dateString = dateFormat.format(Date(session.timestamp))

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderSlate, RoundedCornerShape(12.dp))
            .clickable { onItemClick() },
        colors = CardDefaults.cardColors(containerColor = SpaceGrayCard),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Score circle indicator
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(
                        if (session.overallScore >= 75) GlowGreen.copy(alpha = 0.15f)
                        else if (session.overallScore >= 50) GlowOrange.copy(alpha = 0.15f)
                        else GlowRed.copy(alpha = 0.15f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "${session.overallScore}",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (session.overallScore >= 75) GlowGreen
                    else if (session.overallScore >= 50) GlowOrange
                    else GlowRed
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${session.company} • ${session.mode}",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite
                )
                Text(
                    text = "${session.role} (${session.difficulty})",
                    fontSize = 12.sp,
                    color = TextMuted
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = dateString,
                    fontSize = 11.sp,
                    color = TextMuted
                )
                Spacer(modifier = Modifier.height(4.dp))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (session.isCompleted) GlowGreen.copy(alpha = 0.12f) else BorderSlate)
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = if (session.isCompleted) "Completed" else "In Progress",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (session.isCompleted) GlowGreen else TextMuted
                    )
                }
            }
        }
    }
}
