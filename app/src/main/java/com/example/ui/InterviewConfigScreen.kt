package com.example.ui

import android.widget.Toast
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
import com.example.ui.theme.*
import com.example.viewmodel.InterviewXViewModel
import com.example.viewmodel.UiState

@Composable
fun InterviewConfigScreen(
    viewModel: InterviewXViewModel,
    onNavigateToActive: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    val generationState by viewModel.interviewGenerationState.collectAsState()

    var targetCompany by remember { mutableStateOf("Google") }
    var targetRole by remember { mutableStateOf("Software Engineer") }
    var difficulty by remember { mutableStateOf("Medium") }
    var interviewMode by remember { mutableStateOf("Technical Round") }

    val companies = listOf(
        "Google", "Microsoft", "Amazon", "Meta", "Apple", "NVIDIA",
        "Qualcomm", "Intel", "AMD", "Synopsys", "Cadence", "Cisco",
        "Oracle", "TCS", "Accenture", "Deloitte"
    )

    val roles = listOf(
        "Software Engineer", "Systems Architect", "Hardware Engineer",
        "Product Manager", "Data Scientist", "Embedded Firmware Dev",
        "VLSI QA Specialist", "Technical Analyst"
    )

    val modes = listOf(
        "Technical Round", "Behavioral Round", "HR Round",
        "Coding Round", "Aptitude Round", "Manager Round",
        "Case Study", "Group Discussion", "Final Interview", "Stress Interview"
    )

    LaunchedEffect(generationState) {
        if (generationState is UiState.Success) {
            onNavigateToActive()
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
                    .background(NeonPurple.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Videocam,
                    contentDescription = "Interview Setup",
                    tint = NeonPurple,
                    modifier = Modifier.size(22.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = "Launch Sandbox Room",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite
                )
                Text(
                    text = "Configure customized corporate evaluations",
                    fontSize = 12.sp,
                    color = TextMuted
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        if (generationState is UiState.Loading) {
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
                    CircularProgressIndicator(color = NeonPurple)
                    Spacer(modifier = Modifier.height(20.dp))
                    Text(
                        text = "Configuring Simulated Sandbox...",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextWhite
                    )
                    Text(
                        text = "Gemini is generating high-fidelity, company-specific questions tailored to your experience level...",
                        fontSize = 12.sp,
                        color = TextMuted,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        } else {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderSlate, RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    // Company Selection
                    Text("Target Corporate Entity", fontSize = 13.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))
                    SelectionSpinner(
                        selectedValue = targetCompany,
                        options = companies,
                        onOptionSelected = { targetCompany = it }
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Role Selection
                    Text("Professional Role", fontSize = 13.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))
                    SelectionSpinner(
                        selectedValue = targetRole,
                        options = roles,
                        onOptionSelected = { targetRole = it }
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Interview Mode Selection
                    Text("Interview Round Mode", fontSize = 13.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))
                    SelectionSpinner(
                        selectedValue = interviewMode,
                        options = modes,
                        onOptionSelected = { interviewMode = it }
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Difficulty Levels
                    Text("Complexity Level", fontSize = 13.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        val difficulties = listOf("Easy", "Medium", "Hard")
                        difficulties.forEach { diff ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (difficulty == diff) ElectricBlue.copy(alpha = 0.15f) else BorderSlate)
                                    .border(
                                        1.dp,
                                        if (difficulty == diff) ElectricBlue else Color.Transparent,
                                        RoundedCornerShape(8.dp)
                                    )
                                    .clickable { difficulty = diff }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = diff,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (difficulty == diff) ElectricBlue else TextWhite
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(32.dp))

                    // Launch Button
                    Button(
                        onClick = {
                            viewModel.startNewSession(targetCompany, targetRole, difficulty, interviewMode)
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
                                Icon(Icons.Default.Launch, contentDescription = "Launch Icon", tint = Color.White)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Launch Active Prep Room", fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(48.dp))
    }
}

@Composable
fun SelectionSpinner(
    selectedValue: String,
    options: List<String>,
    onOptionSelected: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(BorderSlate)
            .border(1.dp, BorderSlate.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
            .clickable { expanded = true }
            .padding(horizontal = 16.dp, vertical = 14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = selectedValue, color = TextWhite, fontSize = 14.sp)
            Icon(
                imageVector = if (expanded) Icons.Default.ArrowDropUp else Icons.Default.ArrowDropDown,
                contentDescription = "Dropdown icon",
                tint = TextMuted
            )
        }

        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .background(SpaceGrayCard)
                .border(1.dp, BorderSlate, RoundedCornerShape(8.dp))
        ) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(text = option, color = TextWhite) },
                    onClick = {
                        onOptionSelected(option)
                        expanded = false
                    }
                )
            }
        }
    }
}
