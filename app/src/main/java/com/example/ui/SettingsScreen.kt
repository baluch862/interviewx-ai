package com.example.ui

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.UserProfile
import com.example.ui.theme.*
import com.example.viewmodel.InterviewXViewModel

@Composable
fun SettingsScreen(
    viewModel: InterviewXViewModel,
    userProfile: UserProfile,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    var name by remember(userProfile) { mutableStateOf(userProfile.name) }
    var targetCompany by remember(userProfile) { mutableStateOf(userProfile.targetCompany) }
    var targetRole by remember(userProfile) { mutableStateOf(userProfile.targetRole) }
    var experienceLevel by remember(userProfile) { mutableStateOf(userProfile.experienceLevel) }
    var voiceSelection by remember { mutableStateOf("Prebuilt Voice: Kore (Male Cheerful)") }

    val experienceOptions = listOf("Junior", "Mid-Level", "Senior", "Lead", "Principal Architect")
    val voiceOptions = listOf(
        "Prebuilt Voice: Kore (Male Cheerful)",
        "Prebuilt Voice: Stella (Female Dynamic)",
        "Prebuilt Voice: Nyx (Non-binary Conversational)"
    )

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
                    .background(BorderSlate),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Settings,
                    contentDescription = "Settings Logo",
                    tint = TextWhite,
                    modifier = Modifier.size(22.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = "System Settings",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite
                )
                Text(
                    text = "Configure credential layers, vocal outputs, and profile scopes",
                    fontSize = 12.sp,
                    color = TextMuted
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Profile Configuration Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderSlate, RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "Candidate Profile Configuration",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite
                )
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Candidate Name", color = TextMuted) },
                    textStyle = LocalTextStyle.current.copy(color = TextWhite),
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ElectricBlue,
                        unfocusedBorderColor = BorderSlate
                    )
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = targetCompany,
                    onValueChange = { targetCompany = it },
                    label = { Text("Target Benchmark Company", color = TextMuted) },
                    textStyle = LocalTextStyle.current.copy(color = TextWhite),
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ElectricBlue,
                        unfocusedBorderColor = BorderSlate
                    )
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = targetRole,
                    onValueChange = { targetRole = it },
                    label = { Text("Target Practice Role", color = TextMuted) },
                    textStyle = LocalTextStyle.current.copy(color = TextWhite),
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ElectricBlue,
                        unfocusedBorderColor = BorderSlate
                    )
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text("Benchmark Seniority Scope", fontSize = 12.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(6.dp))
                SelectionSpinner(
                    selectedValue = experienceLevel,
                    options = experienceOptions,
                    onOptionSelected = { experienceLevel = it }
                )

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        viewModel.updateProfile(
                            userProfile.copy(
                                name = name,
                                targetCompany = targetCompany,
                                targetRole = targetRole,
                                experienceLevel = experienceLevel
                            )
                        )
                        Toast.makeText(context, "System profile updated successfully", Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = ElectricBlue),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Save Changes", fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Advanced AI Synthesis (Voice) Selection
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderSlate, RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "AI Voice Synthesis Configuration",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite
                )
                Spacer(modifier = Modifier.height(12.dp))

                SelectionSpinner(
                    selectedValue = voiceSelection,
                    options = voiceOptions,
                    onOptionSelected = { voiceSelection = it }
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Security & API credentials layer
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderSlate, RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = SpaceGrayCard)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "System Credentials Layer",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "We securely utilize Google Cloud credentials provided via your local secure Secrets Panel.",
                    fontSize = 12.sp,
                    color = TextMuted
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(GlowGreen)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "SECURE SANDBOX LINK ESTABLISHED",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = GlowGreen,
                        letterSpacing = 1.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Log out Action Button
        Button(
            onClick = onLogout,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .border(1.dp, GlowRed.copy(alpha = 0.5f), RoundedCornerShape(10.dp)),
            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
            shape = RoundedCornerShape(10.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.ExitToApp, contentDescription = "Exit icon", tint = GlowRed)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Log Out System Account", color = GlowRed, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(48.dp))
    }
}
