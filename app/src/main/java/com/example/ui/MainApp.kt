package com.example.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.compose.*
import com.example.ui.theme.*
import com.example.viewmodel.InterviewXViewModel

// Simple route definitions
object Routes {
    const val LANDING = "landing"
    const val AUTH = "auth"
    const val DASHBOARD = "dashboard"
    const val CONFIG = "config"
    const val ACTIVE = "active"
    const val REPORT = "report"
    const val RESUME = "resume"
    const val COACH = "coach"
    const val SETTINGS = "settings"
}

@Composable
fun MainApp(
    viewModel: InterviewXViewModel,
    modifier: Modifier = Modifier
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val userProfile by viewModel.userProfile.collectAsState()
    val sessions by viewModel.sessions.collectAsState()

    // Control visibility of navigation bars (Hide on landing/auth/active screen)
    val showBottomBar = currentRoute != null && 
            currentRoute != Routes.LANDING && 
            currentRoute != Routes.AUTH && 
            currentRoute != Routes.ACTIVE

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .background(ObsidianBg),
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = SpaceGrayCard,
                    contentColor = TextMuted,
                    modifier = Modifier.windowInsetsPadding(WindowInsets.navigationBars)
                ) {
                    NavigationBarItem(
                        selected = currentRoute == Routes.DASHBOARD,
                        onClick = { navController.navigate(Routes.DASHBOARD) { popUpTo(Routes.DASHBOARD) { inclusive = false } } },
                        icon = { Icon(Icons.Default.Home, contentDescription = "Dashboard") },
                        label = { Text("Home", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = ElectricBlue,
                            selectedTextColor = ElectricBlue,
                            indicatorColor = ElectricBlue.copy(alpha = 0.12f),
                            unselectedIconColor = TextMuted,
                            unselectedTextColor = TextMuted
                        )
                    )

                    NavigationBarItem(
                        selected = currentRoute == Routes.CONFIG,
                        onClick = { navController.navigate(Routes.CONFIG) { popUpTo(Routes.DASHBOARD) } },
                        icon = { Icon(Icons.Default.PlayCircle, contentDescription = "Simulate Prep") },
                        label = { Text("Practice", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = NeonPurple,
                            selectedTextColor = NeonPurple,
                            indicatorColor = NeonPurple.copy(alpha = 0.12f),
                            unselectedIconColor = TextMuted,
                            unselectedTextColor = TextMuted
                        )
                    )

                    NavigationBarItem(
                        selected = currentRoute == Routes.RESUME,
                        onClick = { navController.navigate(Routes.RESUME) { popUpTo(Routes.DASHBOARD) } },
                        icon = { Icon(Icons.Default.Analytics, contentDescription = "Resume Audit") },
                        label = { Text("ATS Audit", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = GlowGreen,
                            selectedTextColor = GlowGreen,
                            indicatorColor = GlowGreen.copy(alpha = 0.12f),
                            unselectedIconColor = TextMuted,
                            unselectedTextColor = TextMuted
                        )
                    )

                    NavigationBarItem(
                        selected = currentRoute == Routes.COACH,
                        onClick = { navController.navigate(Routes.COACH) { popUpTo(Routes.DASHBOARD) } },
                        icon = { Icon(Icons.Default.Timeline, contentDescription = "AI Coach") },
                        label = { Text("Coach", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = CyberCyan,
                            selectedTextColor = CyberCyan,
                            indicatorColor = CyberCyan.copy(alpha = 0.12f),
                            unselectedIconColor = TextMuted,
                            unselectedTextColor = TextMuted
                        )
                    )

                    NavigationBarItem(
                        selected = currentRoute == Routes.SETTINGS,
                        onClick = { navController.navigate(Routes.SETTINGS) { popUpTo(Routes.DASHBOARD) } },
                        icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                        label = { Text("Settings", fontSize = 11.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = TextWhite,
                            selectedTextColor = TextWhite,
                            indicatorColor = BorderSlate,
                            unselectedIconColor = TextMuted,
                            unselectedTextColor = TextMuted
                        )
                    )
                }
            }
        },
        contentWindowInsets = WindowInsets.safeDrawing
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Routes.LANDING,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Routes.LANDING) {
                LandingScreen(
                    onNavigateToAuth = { navController.navigate(Routes.AUTH) }
                )
            }

            composable(Routes.AUTH) {
                AuthScreen(
                    onAuthSuccess = {
                        navController.navigate(Routes.DASHBOARD) {
                            popUpTo(Routes.LANDING) { inclusive = true }
                        }
                    }
                )
            }

            composable(Routes.DASHBOARD) {
                DashboardScreen(
                    userProfile = userProfile,
                    sessions = sessions,
                    onStartPractice = { navController.navigate(Routes.CONFIG) },
                    onNavigateToResume = { navController.navigate(Routes.RESUME) },
                    onNavigateToCoach = { navController.navigate(Routes.COACH) },
                    onNavigateToHistorySession = { sid ->
                        navController.navigate("${Routes.REPORT}/$sid")
                    }
                )
            }

            composable(Routes.CONFIG) {
                InterviewConfigScreen(
                    viewModel = viewModel,
                    onNavigateToActive = { navController.navigate(Routes.ACTIVE) }
                )
            }

            composable(Routes.ACTIVE) {
                InterviewActiveScreen(
                    viewModel = viewModel,
                    onNavigateToReport = {
                        navController.navigate(Routes.REPORT) {
                            popUpTo(Routes.DASHBOARD)
                        }
                    }
                )
            }

            composable(Routes.REPORT) {
                EvaluationReportScreen(
                    viewModel = viewModel,
                    sessionId = null, // uses active session
                    onNavigateHome = { navController.navigate(Routes.DASHBOARD) { popUpTo(Routes.DASHBOARD) { inclusive = true } } }
                )
            }

            composable("${Routes.REPORT}/{sessionId}") { backStackEntry ->
                val sid = backStackEntry.arguments?.getString("sessionId")?.toIntOrNull()
                EvaluationReportScreen(
                    viewModel = viewModel,
                    sessionId = sid,
                    onNavigateHome = { navController.navigate(Routes.DASHBOARD) { popUpTo(Routes.DASHBOARD) { inclusive = true } } }
                )
            }

            composable(Routes.RESUME) {
                ResumeAnalyzerScreen(viewModel = viewModel)
            }

            composable(Routes.COACH) {
                CareerCoachScreen(viewModel = viewModel)
            }

            composable(Routes.SETTINGS) {
                SettingsScreen(
                    viewModel = viewModel,
                    userProfile = userProfile,
                    onLogout = {
                        navController.navigate(Routes.LANDING) {
                            popUpTo(Routes.DASHBOARD) { inclusive = true }
                        }
                    }
                )
            }
        }
    }
}
