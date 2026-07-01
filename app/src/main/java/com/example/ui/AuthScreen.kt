package com.example.ui

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun AuthScreen(
    onAuthSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current
    val scrollState = rememberScrollState()

    // Form States
    var isLoginMode by remember { mutableStateOf(true) }
    var name by remember { mutableStateOf("") }
    var nameError by remember { mutableStateOf<String?>(null) }

    var email by remember { mutableStateOf("") }
    var emailError by remember { mutableStateOf<String?>(null) }

    var password by remember { mutableStateOf("") }
    var passwordError by remember { mutableStateOf<String?>(null) }

    var confirmPassword by remember { mutableStateOf("") }
    var confirmPasswordError by remember { mutableStateOf<String?>(null) }

    var passwordVisible by remember { mutableStateOf(false) }
    var confirmPasswordVisible by remember { mutableStateOf(false) }

    var isAgreedToTerms by remember { mutableStateOf(false) }
    var isAgreedToTermsError by remember { mutableStateOf<String?>(null) }

    // Loading States
    var isSubmitting by remember { mutableStateOf(false) }
    var isGoogleAuthActive by remember { mutableStateOf(false) }

    // Form Validation Logic
    fun validateForm(): Boolean {
        var isValid = true

        // Name validation (only in Signup mode)
        if (!isLoginMode) {
            if (name.trim().isEmpty()) {
                nameError = "Name is required"
                isValid = false
            } else if (name.trim().length < 2) {
                nameError = "Name must be at least 2 characters"
                isValid = false
            } else {
                nameError = null
            }
        } else {
            nameError = null
        }

        // Email validation
        val emailPattern = android.util.Patterns.EMAIL_ADDRESS
        val trimmedEmail = email.trim()
        if (trimmedEmail.isEmpty()) {
            emailError = "Email is required"
            isValid = false
        } else if (!emailPattern.matcher(trimmedEmail).matches()) {
            emailError = "Enter a valid corporate email address"
            isValid = false
        } else {
            emailError = null
        }

        // Password validation
        if (password.isEmpty()) {
            passwordError = "Password is required"
            isValid = false
        } else if (password.length < 6) {
            passwordError = "Password must be at least 6 characters"
            isValid = false
        } else {
            passwordError = null
        }

        // Confirm Password validation (only in Signup mode)
        if (!isLoginMode) {
            if (confirmPassword.isEmpty()) {
                confirmPasswordError = "Please confirm your password"
                isValid = false
            } else if (confirmPassword != password) {
                confirmPasswordError = "Passwords do not match"
                isValid = false
            } else {
                confirmPasswordError = null
            }

            if (!isAgreedToTerms) {
                isAgreedToTermsError = "Please accept the active security guidelines"
                isValid = false
            } else {
                isAgreedToTermsError = null
            }
        } else {
            confirmPasswordError = null
            isAgreedToTermsError = null
        }

        return isValid
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(ObsidianBg),
        contentAlignment = Alignment.Center
    ) {
        // 1. Futuristic tech-dot grid overlay
        Canvas(modifier = Modifier.fillMaxSize()) {
            val dotRadius = 1.dp.toPx()
            val spacing = 28.dp.toPx()
            val dotColor = Color.White.copy(alpha = 0.04f)

            var x = 0f
            while (x < size.width) {
                var y = 0f
                while (y < size.height) {
                    drawCircle(
                        color = dotColor,
                        radius = dotRadius,
                        center = androidx.compose.ui.geometry.Offset(x, y)
                    )
                    y += spacing
                }
                x += spacing
            }
        }

        // 2. High-depth colorful radial glow spheres
        Box(
            modifier = Modifier
                .size(350.dp)
                .align(Alignment.TopEnd)
                .offset(x = 80.dp, y = (-50).dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            NeonPurple.copy(alpha = 0.22f),
                            Color.Transparent
                        )
                    )
                )
        )

        Box(
            modifier = Modifier
                .size(380.dp)
                .align(Alignment.BottomStart)
                .offset(x = (-100).dp, y = 80.dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            ElectricBlue.copy(alpha = 0.25f),
                            Color.Transparent
                        )
                    )
                )
        )

        Box(
            modifier = Modifier
                .size(300.dp)
                .align(Alignment.Center)
                .offset(y = (-150).dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            CyberCyan.copy(alpha = 0.12f),
                            Color.Transparent
                        )
                    )
                )
        )

        // Main Scrollable Container
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = 24.dp, vertical = 40.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(modifier = Modifier.height(20.dp))

            // Pulse Status Badge
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(32.dp))
                    .background(ElectricBlue.copy(alpha = 0.08f))
                    .border(
                        border = BorderStroke(
                            width = 1.dp,
                            brush = Brush.horizontalGradient(
                                listOf(ElectricBlue.copy(alpha = 0.4f), NeonPurple.copy(alpha = 0.4f))
                            )
                        ),
                        shape = RoundedCornerShape(32.dp)
                    )
                    .padding(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .clip(CircleShape)
                            .background(GlowGreen)
                    )
                    Text(
                        text = "SECURE ENCLAVE ENFORCED",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = ElectricBlue,
                        letterSpacing = 1.2.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            Text(
                text = if (isLoginMode) "Access Dashboard" else "Register Core Profile",
                fontSize = 28.sp,
                fontWeight = FontWeight.ExtraBold,
                color = TextWhite,
                textAlign = TextAlign.Center,
                letterSpacing = (-0.5).sp
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = if (isLoginMode) 
                    "Deploy your customized AI interview pipeline" 
                else 
                    "Setup credentials to begin full sandbox evaluations",
                fontSize = 13.sp,
                color = TextMuted,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )

            Spacer(modifier = Modifier.height(30.dp))

            // Redesigned Glassmorphic Card Form
            GlassCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .animateContentSize()
            ) {
                if (isSubmitting) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 40.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator(
                            color = ElectricBlue,
                            modifier = Modifier.size(44.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = if (isLoginMode) "Authorizing access credentials..." else "Provisioning sandbox workspace...",
                            color = TextWhite,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    // LaunchedEffect to simulate successful submission after 1.2s
                    LaunchedEffect(Unit) {
                        delay(1200)
                        isSubmitting = false
                        onAuthSuccess()
                    }
                } else {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Full Name (Signup only)
                        AnimatedVisibility(visible = !isLoginMode) {
                            Column {
                                GlassTextField(
                                    value = name,
                                    onValueChange = {
                                        name = it
                                        nameError = null
                                    },
                                    label = "Full Name",
                                    leadingIcon = Icons.Default.Person,
                                    errorText = nameError,
                                    keyboardOptions = KeyboardOptions(
                                        keyboardType = KeyboardType.Text,
                                        imeAction = ImeAction.Next
                                    )
                                )
                            }
                        }

                        // Corporate Email
                        GlassTextField(
                            value = email,
                            onValueChange = {
                                email = it
                                emailError = null
                            },
                            label = "Corporate Email",
                            leadingIcon = Icons.Default.Email,
                            errorText = emailError,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Email,
                                imeAction = ImeAction.Next
                            )
                        )

                        // Password
                        Column {
                            GlassTextField(
                                value = password,
                                onValueChange = {
                                    password = it
                                    passwordError = null
                                },
                                label = "Password",
                                leadingIcon = Icons.Default.Lock,
                                isPassword = true,
                                passwordVisible = passwordVisible,
                                onPasswordVisibilityChange = { passwordVisible = !passwordVisible },
                                errorText = passwordError,
                                keyboardOptions = KeyboardOptions(
                                    keyboardType = KeyboardType.Password,
                                    imeAction = if (isLoginMode) ImeAction.Done else ImeAction.Next
                                ),
                                keyboardActions = KeyboardActions(
                                    onDone = {
                                        if (isLoginMode) {
                                            focusManager.clearFocus()
                                            if (validateForm()) {
                                                isSubmitting = true
                                            }
                                        }
                                    }
                                )
                            )

                            // Password Strength Analyzer (Signup only)
                            AnimatedVisibility(visible = !isLoginMode && password.isNotEmpty()) {
                                PasswordStrengthIndicator(password = password)
                            }
                        }

                        // Confirm Password (Signup only)
                        AnimatedVisibility(visible = !isLoginMode) {
                            Column {
                                GlassTextField(
                                    value = confirmPassword,
                                    onValueChange = {
                                        confirmPassword = it
                                        confirmPasswordError = null
                                    },
                                    label = "Confirm Password",
                                    leadingIcon = Icons.Default.Lock,
                                    isPassword = true,
                                    passwordVisible = confirmPasswordVisible,
                                    onPasswordVisibilityChange = { confirmPasswordVisible = !confirmPasswordVisible },
                                    errorText = confirmPasswordError,
                                    keyboardOptions = KeyboardOptions(
                                        keyboardType = KeyboardType.Password,
                                        imeAction = ImeAction.Done
                                    ),
                                    keyboardActions = KeyboardActions(
                                        onDone = {
                                            focusManager.clearFocus()
                                            if (validateForm()) {
                                                isSubmitting = true
                                            }
                                        }
                                    )
                                )
                            }
                        }

                        // Terms Checklist (Signup only)
                        AnimatedVisibility(visible = !isLoginMode) {
                            Column {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable(
                                            interactionSource = remember { MutableInteractionSource() },
                                            indication = null
                                        ) {
                                            isAgreedToTerms = !isAgreedToTerms
                                            isAgreedToTermsError = null
                                        }
                                        .padding(vertical = 4.dp)
                                ) {
                                    Checkbox(
                                        checked = isAgreedToTerms,
                                        onCheckedChange = {
                                            isAgreedToTerms = it
                                            isAgreedToTermsError = null
                                        },
                                        colors = CheckboxDefaults.colors(
                                            checkedColor = ElectricBlue,
                                            uncheckedColor = Color.White.copy(alpha = 0.2f),
                                            checkmarkColor = TextWhite
                                        )
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "I authorize sandbox operations under active security guidelines",
                                        color = TextMuted,
                                        fontSize = 11.sp,
                                        lineHeight = 14.sp
                                    )
                                }
                                AnimatedVisibility(visible = isAgreedToTermsError != null) {
                                    if (isAgreedToTermsError != null) {
                                        Text(
                                            text = isAgreedToTermsError ?: "",
                                            color = GlowRed,
                                            fontSize = 11.sp,
                                            modifier = Modifier.padding(start = 12.dp, top = 2.dp)
                                        )
                                    }
                                }
                            }
                        }

                        // Forgot Password (Login only)
                        AnimatedVisibility(visible = isLoginMode) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End
                            ) {
                                Text(
                                    text = "Forgot Password?",
                                    color = ElectricBlue,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    textDecoration = TextDecoration.Underline,
                                    modifier = Modifier
                                        .clickable {
                                            if (email.trim().isEmpty()) {
                                                emailError = "Enter email to receive reset instructions"
                                            } else {
                                                emailError = null
                                                Toast.makeText(
                                                    context,
                                                    "Instructions dispatched to ${email.trim()}",
                                                    Toast.LENGTH_LONG
                                                ).show()
                                            }
                                        }
                                        .padding(vertical = 2.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        // Submit Button
                        Button(
                            onClick = {
                                focusManager.clearFocus()
                                if (validateForm()) {
                                    isSubmitting = true
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                            contentPadding = PaddingValues(),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.linearGradient(
                                            colors = listOf(ElectricBlue, NeonPurple)
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = if (isLoginMode) "Authorize Access" else "Create System Account",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Or Divider
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(1.dp)
                        .background(Color.White.copy(alpha = 0.08f))
                )
                Text(
                    text = "SECURE FEDERATED PASSKEY",
                    color = TextMuted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.5.sp,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(1.dp)
                        .background(Color.White.copy(alpha = 0.08f))
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Google sign-in simulation with high-fidelity glassmorphism style
            Button(
                onClick = {
                    focusManager.clearFocus()
                    isGoogleAuthActive = true
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .border(
                        BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                        RoundedCornerShape(12.dp)
                    ),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White.copy(alpha = 0.03f)
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    GoogleIcon()
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Sign in with Google Account",
                        color = TextWhite,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Switch Mode Toggle link
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = if (isLoginMode) "New recruit?" else "Already registered?",
                    color = TextMuted,
                    fontSize = 13.sp
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = if (isLoginMode) "Create Account" else "Sign In",
                    color = NeonPurple,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    textDecoration = TextDecoration.Underline,
                    modifier = Modifier.clickable {
                        isLoginMode = !isLoginMode
                        // Reset all input states on toggle
                        name = ""
                        email = ""
                        password = ""
                        confirmPassword = ""
                        isAgreedToTerms = false
                        nameError = null
                        emailError = null
                        passwordError = null
                        confirmPasswordError = null
                        isAgreedToTermsError = null
                    }
                )
            }

            Spacer(modifier = Modifier.height(20.dp))
        }

        // Beautiful full-screen glass overlay for secure Google Auth
        if (isGoogleAuthActive) {
            GoogleAuthOverlay(
                onComplete = {
                    isGoogleAuthActive = false
                    onAuthSuccess()
                }
            )
        }
    }
}

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color.White.copy(alpha = 0.05f),
                        Color.White.copy(alpha = 0.01f)
                    )
                )
            )
            .border(
                border = BorderStroke(
                    width = 1.dp,
                    brush = Brush.linearGradient(
                        colors = listOf(
                            Color.White.copy(alpha = 0.22f),
                            Color.White.copy(alpha = 0.02f),
                            ElectricBlue.copy(alpha = 0.15f),
                            NeonPurple.copy(alpha = 0.2f)
                        )
                    )
                ),
                shape = RoundedCornerShape(24.dp)
            )
            .padding(1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            content = content
        )
    }
}

@Composable
fun GlassTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    leadingIcon: ImageVector,
    modifier: Modifier = Modifier,
    isPassword: Boolean = false,
    passwordVisible: Boolean = false,
    onPasswordVisibilityChange: (() -> Unit)? = null,
    errorText: String? = null,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    singleLine: Boolean = true
) {
    Column(modifier = modifier) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text(label, color = if (errorText != null) GlowRed.copy(alpha = 0.8f) else TextMuted) },
            leadingIcon = { Icon(leadingIcon, contentDescription = null, tint = if (errorText != null) GlowRed else ElectricBlue) },
            trailingIcon = if (isPassword && onPasswordVisibilityChange != null) {
                {
                    val icon = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff
                    IconButton(onClick = onPasswordVisibilityChange) {
                        Icon(icon, contentDescription = "Toggle password visibility", tint = TextMuted)
                    }
                }
            } else if (value.isNotEmpty() && !isPassword) {
                {
                    IconButton(onClick = { onValueChange("") }) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear text", tint = TextMuted)
                    }
                }
            } else null,
            visualTransformation = if (isPassword && !passwordVisible) PasswordVisualTransformation() else VisualTransformation.None,
            textStyle = LocalTextStyle.current.copy(color = TextWhite),
            singleLine = singleLine,
            isError = errorText != null,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = keyboardOptions,
            keyboardActions = keyboardActions,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = if (errorText != null) GlowRed else ElectricBlue,
                unfocusedBorderColor = if (errorText != null) GlowRed.copy(alpha = 0.5f) else Color.White.copy(alpha = 0.12f),
                disabledBorderColor = Color.White.copy(alpha = 0.05f),
                errorBorderColor = GlowRed,
                focusedContainerColor = Color.White.copy(alpha = 0.02f),
                unfocusedContainerColor = Color.White.copy(alpha = 0.01f),
                errorContainerColor = GlowRed.copy(alpha = 0.03f)
            )
        )

        AnimatedVisibility(visible = errorText != null) {
            if (errorText != null) {
                Row(
                    modifier = Modifier.padding(top = 4.dp, start = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = "Error",
                        tint = GlowRed,
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = errorText,
                        color = GlowRed,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

@Composable
fun PasswordStrengthIndicator(password: String) {
    val strength = remember(password) {
        when {
            password.isEmpty() -> 0
            password.length < 6 -> 1
            password.length >= 8 && password.any { it.isDigit() } && password.any { !it.isLetterOrDigit() } -> 3
            else -> 2
        }
    }

    val (strengthLabel, strengthColor, strengthProgress) = when (strength) {
        1 -> Triple("Weak", GlowRed, 0.33f)
        2 -> Triple("Moderate", GlowOrange, 0.66f)
        3 -> Triple("Optimal", GlowGreen, 1.0f)
        else -> Triple("No Password", TextMuted, 0.0f)
    }

    Column(modifier = Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Security Strength",
                color = TextMuted,
                fontSize = 11.sp
            )
            Text(
                text = strengthLabel,
                color = strengthColor,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            repeat(3) { index ->
                val active = strength >= (index + 1)
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(
                            if (active) strengthColor else Color.White.copy(alpha = 0.08f)
                        )
                )
            }
        }
    }
}

@Composable
fun GoogleIcon(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(18.dp)) {
        val w = size.width
        val h = size.height
        val strokeWidth = 2.5f.dp.toPx()

        // Red arc (top-left)
        drawArc(
            color = Color(0xFFEA4335),
            startAngle = 180f,
            sweepAngle = 90f,
            useCenter = false,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth)
        )
        // Yellow arc (bottom-left)
        drawArc(
            color = Color(0xFFFBBC05),
            startAngle = 90f,
            sweepAngle = 90f,
            useCenter = false,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth)
        )
        // Green arc (bottom-right)
        drawArc(
            color = Color(0xFF34A853),
            startAngle = 0f,
            sweepAngle = 90f,
            useCenter = false,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth)
        )
        // Blue arc (top-right)
        drawArc(
            color = Color(0xFF4285F4),
            startAngle = 270f,
            sweepAngle = 90f,
            useCenter = false,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth)
        )
        // Inner line of 'G'
        drawLine(
            color = Color(0xFF4285F4),
            start = androidx.compose.ui.geometry.Offset(w * 0.45f, h / 2),
            end = androidx.compose.ui.geometry.Offset(w, h / 2),
            strokeWidth = strokeWidth
        )
    }
}

@Composable
fun GoogleAuthOverlay(
    onComplete: () -> Unit
) {
    var statusText by remember { mutableStateOf("Initializing secure OAuth interface...") }
    var progress by remember { mutableStateOf(0.15f) }

    LaunchedEffect(Unit) {
        delay(700)
        statusText = "Authenticating federated Google credentials..."
        progress = 0.45f
        delay(800)
        statusText = "Retrieving corporate identity tokens..."
        progress = 0.75f
        delay(700)
        statusText = "Syncing environment with sandbox profile..."
        progress = 0.95f
        delay(500)
        statusText = "Profile approved! Loading workspace..."
        progress = 1.0f
        delay(500)
        onComplete()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.85f))
            .clickable(enabled = false) {}, // Block clicks from falling through
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .width(310.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color.White.copy(alpha = 0.08f),
                            Color.White.copy(alpha = 0.01f)
                        )
                    )
                )
                .border(
                    BorderStroke(1.dp, Brush.linearGradient(listOf(ElectricBlue, NeonPurple))),
                    RoundedCornerShape(24.dp)
                )
                .padding(28.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier.size(68.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.fillMaxSize(),
                        color = ElectricBlue,
                        strokeWidth = 4.dp,
                        trackColor = Color.White.copy(alpha = 0.08f)
                    )
                    GoogleIcon(modifier = Modifier.size(26.dp))
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "FEDERATED LOG-IN ENCLAVE",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = CyberCyan,
                    letterSpacing = 1.5.sp
                )

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = statusText,
                    fontSize = 13.sp,
                    color = TextWhite,
                    textAlign = TextAlign.Center,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.height(38.dp) // Fixed height prevents visual jitter on update
                )

                Spacer(modifier = Modifier.height(16.dp))

                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(3.dp)
                        .clip(RoundedCornerShape(2.dp)),
                    color = NeonPurple,
                    trackColor = Color.White.copy(alpha = 0.05f)
                )
            }
        }
    }
}
