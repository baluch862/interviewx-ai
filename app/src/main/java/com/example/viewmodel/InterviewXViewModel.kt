package com.example.viewmodel

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.BuildConfig
import com.example.api.Content
import com.example.api.GenerateContentRequest
import com.example.api.Part
import com.example.api.RetrofitClient
import com.example.data.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

sealed interface UiState<out T> {
    object Idle : UiState<Nothing>
    object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}

class InterviewXViewModel(application: Application) : AndroidViewModel(application) {
    private val database = AppDatabase.getDatabase(application)
    private val repository = InterviewRepository(
        database.userProfileDao(),
        database.interviewSessionDao(),
        database.interviewQuestionDao(),
        database.resumeAnalysisDao()
    )

    // UI flows backed by Room
    val userProfile: StateFlow<UserProfile> = repository.userProfile
        .map { it ?: UserProfile() }
        .stateIn(viewModelScope, SharingStarted.Eagerly, UserProfile())

    val sessions: StateFlow<List<InterviewSession>> = repository.allSessions
        .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    val resumeAnalyses: StateFlow<List<ResumeAnalysis>> = repository.allAnalyses
        .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    // Active session states
    private val _activeSessionId = MutableStateFlow<Int?>(null)
    val activeSessionId: StateFlow<Int?> = _activeSessionId.asStateFlow()

    val activeSession: StateFlow<InterviewSession?> = _activeSessionId
        .flatMapLatest { id ->
            if (id != null) repository.getSession(id) else flowOf(null)
        }
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    val activeQuestions: StateFlow<List<InterviewQuestion>> = _activeSessionId
        .flatMapLatest { id ->
            if (id != null) repository.getQuestionsForSession(id) else flowOf(emptyList())
        }
        .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    private val _currentQuestionIndex = MutableStateFlow(0)
    val currentQuestionIndex: StateFlow<Int> = _currentQuestionIndex.asStateFlow()

    // API Status States
    private val _interviewGenerationState = MutableStateFlow<UiState<Unit>>(UiState.Idle)
    val interviewGenerationState: StateFlow<UiState<Unit>> = _interviewGenerationState.asStateFlow()

    private val _questionGradingState = MutableStateFlow<UiState<Unit>>(UiState.Idle)
    val questionGradingState: StateFlow<UiState<Unit>> = _questionGradingState.asStateFlow()

    private val _resumeAnalysisState = MutableStateFlow<UiState<ResumeAnalysis>>(UiState.Idle)
    val resumeAnalysisState: StateFlow<UiState<ResumeAnalysis>> = _resumeAnalysisState.asStateFlow()

    private val _careerCoachState = MutableStateFlow<UiState<String>>(UiState.Idle)
    val careerCoachState: StateFlow<UiState<String>> = _careerCoachState.asStateFlow()

    init {
        // Create initial default profile if none exists
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertOrUpdateProfile(UserProfile())
        }
    }

    // --- Profile & Settings Actions ---
    fun getQuestionsForSession(sessionId: Int): Flow<List<InterviewQuestion>> {
        return repository.getQuestionsForSession(sessionId)
    }

    fun updateProfile(profile: UserProfile) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertOrUpdateProfile(profile)
        }
    }

    fun incrementStreak() {
        viewModelScope.launch(Dispatchers.IO) {
            val p = userProfile.value
            val now = System.currentTimeMillis()
            // simple check: if last active was > 12h ago and < 36h ago, increment streak.
            val diff = now - p.lastActiveTimestamp
            var newStreak = p.streak
            if (diff in 43200000..129600000) {
                newStreak += 1
            } else if (diff > 129600000) {
                newStreak = 1
            }
            repository.insertOrUpdateProfile(
                p.copy(
                    streak = newStreak,
                    lastActiveTimestamp = now
                )
            )
        }
    }

    // --- Interview Actions ---
    fun startNewSession(
        company: String,
        role: String,
        difficulty: String,
        mode: String
    ) {
        viewModelScope.launch(Dispatchers.IO) {
            _interviewGenerationState.value = UiState.Loading
            try {
                // 1. Insert empty/pending session with currentStage as Greeting
                val session = InterviewSession(
                    company = company,
                    role = role,
                    difficulty = difficulty,
                    mode = mode,
                    currentStage = "Greeting"
                )
                val sessionId = repository.insertSession(session).toInt()
                _activeSessionId.value = sessionId
                _currentQuestionIndex.value = 0

                // 2. Fetch the welcoming Greeting & Identity check question from Gemini
                val prompt = """
                    You are an elite, highly professional executive recruiter interviewing a candidate for:
                    Role: "$role"
                    Company: "$company"
                    Difficulty: "$difficulty"
                    Candidate Name: "${userProfile.value.name}"
                    
                    This is Stage 1: "Greeting & Identity confirmation".
                    Generate a natural, welcoming opening greeting. Confirm their identity, introduce yourself briefly, and ask if they are ready to begin the interview.
                    
                    The output MUST be a valid JSON object with exactly two fields:
                    - 'question': The welcoming and identity confirmation question.
                    - 'ideal_answer': A simple, professional reply indicating they are ready to begin (e.g. "Hi, yes I am John and I am fully prepared to begin this technical session.").
                    
                    Output ONLY the raw JSON object. Do NOT wrap it in ```json codeblocks or any markdown. Do NOT add any extra text or conversational sentences outside of JSON.
                """.trimIndent()

                val apiKey = BuildConfig.GEMINI_API_KEY
                val request = GenerateContentRequest(
                    contents = listOf(Content(parts = listOf(Part(text = prompt))))
                )

                val response = RetrofitClient.service.generateContent(apiKey, request)
                val rawResponse = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                    ?: throw Exception("No response from Gemini")

                val cleanJson = cleanJsonResponse(rawResponse)
                val obj = JSONObject(cleanJson)
                
                val firstQuestion = InterviewQuestion(
                    sessionId = sessionId,
                    questionText = obj.getString("question"),
                    idealAnswer = obj.optString("ideal_answer", "I am ready to begin."),
                    orderIndex = 0,
                    stageName = "Greeting & Identity Confirmation"
                )

                repository.insertQuestion(firstQuestion)
                _interviewGenerationState.value = UiState.Success(Unit)

                // Update total interview stats
                val currentProfile = userProfile.value
                repository.insertOrUpdateProfile(
                    currentProfile.copy(
                        totalInterviewsCount = currentProfile.totalInterviewsCount + 1,
                        lastActiveTimestamp = System.currentTimeMillis()
                    )
                )
            } catch (e: Exception) {
                Log.e("InterviewXVM", "Error starting session: ${e.message}", e)
                _interviewGenerationState.value = UiState.Error(e.message ?: "Failed to initialize interview.")
            }
        }
    }

    fun submitAnswerAndEvaluate(
        questionId: Int,
        userResponse: String
    ) {
        viewModelScope.launch(Dispatchers.IO) {
            _questionGradingState.value = UiState.Loading
            try {
                val question = activeQuestions.value.firstOrNull { it.id == questionId }
                    ?: throw Exception("Question not found")

                val currentSession = activeSession.value ?: throw Exception("Active session not found")

                // 1. Evaluate the current answer using Gemini
                val evaluationPrompt = """
                    You are an expert Principal Engineer and Executive Recruiter conducting a live interview.
                    Evaluate the candidate's response to this interview question:
                    Question: ${question.questionText}
                    Candidate's Answer: $userResponse
                    Ideal Answer reference: ${question.idealAnswer}

                    Provide deep technical and behavioral analysis. Score each category strictly from 1 to 10 (where 10 is perfect).
                    You must return a valid JSON object with the following fields:
                    - 'score': Overall score out of 10.
                    - 'confidence': Score out of 10 for Confidence.
                    - 'communication': Score out of 10 for Communication.
                    - 'grammar': Score out of 10 for Grammar.
                    - 'technicalAccuracy': Score out of 10 for Technical Accuracy.
                    - 'clarity': Score out of 10 for Clarity.
                    - 'problemSolving': Score out of 10 for Problem Solving.
                    - 'depthOfKnowledge': Score out of 10 for Depth of Knowledge.
                    - 'starFeedback': A precise STAR-structured feedback breakdown of their response.
                    - 'tips': Highly detailed advice on how the candidate can refine this specific answer to make it world-class.

                    Output ONLY the raw JSON object. Do NOT wrap in markdown or add conversational intro/outro.
                """.trimIndent()

                val apiKey = BuildConfig.GEMINI_API_KEY
                val requestEval = GenerateContentRequest(
                    contents = listOf(Content(parts = listOf(Part(text = evaluationPrompt))))
                )

                val responseEval = RetrofitClient.service.generateContent(apiKey, requestEval)
                val rawResponseEval = responseEval.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                    ?: throw Exception("Grading response empty")

                val cleanJsonEval = cleanJsonResponse(rawResponseEval)
                val objEval = JSONObject(cleanJsonEval)

                val updatedQuestion = question.copy(
                    userResponse = userResponse,
                    score = objEval.optInt("score", 7),
                    confidenceScore = objEval.optInt("confidence", 7),
                    communicationScore = objEval.optInt("communication", 7),
                    grammarScore = objEval.optInt("grammar", 7),
                    technicalAccuracyScore = objEval.optInt("technicalAccuracy", 7),
                    clarityScore = objEval.optInt("clarity", 7),
                    problemSolvingScore = objEval.optInt("problemSolving", 7),
                    depthOfKnowledgeScore = objEval.optInt("depthOfKnowledge", 7),
                    starFeedback = objEval.optString("starFeedback", "No STAR critique generated."),
                    tips = objEval.optString("tips", "Continue practicing to expand your response detail.")
                )

                repository.updateQuestion(updatedQuestion)

                // 2. Determine the next interview stage
                val nextStage = when (currentSession.currentStage) {
                    "Greeting" -> "Warm-up"
                    "Warm-up" -> "Core technical interview"
                    "Core technical interview" -> "Cross-questioning"
                    "Cross-questioning" -> "Scenario-based questions"
                    "Scenario-based questions" -> "Behavioral questions"
                    "Behavioral questions" -> "HR round"
                    "HR round" -> "Completed"
                    else -> "Completed"
                }

                if (nextStage == "Completed") {
                    // Update session status and complete
                    repository.updateSession(currentSession.copy(currentStage = "Completed"))
                    finalizeSessionReport()
                    _questionGradingState.value = UiState.Success(Unit)
                    return@launch
                }

                // Update session stage
                repository.updateSession(currentSession.copy(currentStage = nextStage))

                // 3. Generate the NEXT question dynamically from Gemini, remembering the full context
                val previousTurns = activeQuestions.value.map { q ->
                    val resp = if (q.id == questionId) userResponse else q.userResponse
                    "Interviewer: ${q.questionText}\nCandidate (Score: ${q.score}/10): $resp"
                }.joinToString("\n\n")

                val nextQuestionPrompt = """
                    You are conducting a professional mock interview.
                    Company: "${currentSession.company}"
                    Role: "${currentSession.role}"
                    Target Difficulty: "${currentSession.difficulty}"
                    Current Stage: "$nextStage"
                    
                    Below is the entire chat transcript of the interview so far:
                    $previousTurns

                    Task:
                    Generate the NEXT question matching the current stage: "$nextStage".
                    Be a natural recruiter. Speak naturally. Ask exactly ONE question. Never ask multiple questions together.
                    Do not repeat any question that has already been asked.
                    
                    Adapt difficulty based on the candidate's previous performances:
                    - If they had a high score (> 7/10) on previous questions, make the next question more challenging. If in "Cross-questioning", probe deep into any specific technologies or design patterns they claimed to use in previous answers (e.g. if they mentioned they designed a lock-free buffer, ask how they handled processor pipeline stall or ABA issues).
                    - If they struggled (< 6/10), keep it highly professional but offer a question focused on core principles to help them show their strength.
                    
                    The output MUST be a valid JSON object with exactly two fields:
                    - 'question': The natural spoken question text.
                    - 'ideal_answer': A perfect model response in STAR format for this question.

                    Output ONLY the raw JSON object. Do NOT wrap in markdown or add conversational sentences.
                """.trimIndent()

                val requestNext = GenerateContentRequest(
                    contents = listOf(Content(parts = listOf(Part(text = nextQuestionPrompt))))
                )

                val responseNext = RetrofitClient.service.generateContent(apiKey, requestNext)
                val rawResponseNext = responseNext.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                    ?: throw Exception("Failed to generate next question")

                val cleanJsonNext = cleanJsonResponse(rawResponseNext)
                val objNext = JSONObject(cleanJsonNext)

                val nextQuestion = InterviewQuestion(
                    sessionId = currentSession.id,
                    questionText = objNext.getString("question"),
                    idealAnswer = objNext.optString("ideal_answer", ""),
                    orderIndex = activeQuestions.value.size,
                    stageName = nextStage
                )

                repository.insertQuestion(nextQuestion)
                _currentQuestionIndex.value = activeQuestions.value.size

                _questionGradingState.value = UiState.Success(Unit)

            } catch (e: Exception) {
                Log.e("InterviewXVM", "Error grading or generating next question: ${e.message}", e)
                _questionGradingState.value = UiState.Error(e.message ?: "Failed to transition to the next question.")
            }
        }
    }

    private suspend fun finalizeSessionReport() {
        val sessionId = _activeSessionId.value ?: return
        val currentQuestions = activeQuestions.value
        if (currentQuestions.isEmpty()) return

        // Compute averages for overall, communication, tech knowledge, confidence, grammar, clarity, problem solving, depth of knowledge
        val avgScore = currentQuestions.map { it.score }.average() * 10 // scale to 0-100
        val overallScorePercent = avgScore.toInt()

        try {
            val qSummary = currentQuestions.joinToString("\n\n") { 
                "Q: ${it.questionText}\nA: ${it.userResponse}\nScores:\n- Technical Accuracy: ${it.technicalAccuracyScore}/10\n- Communication: ${it.communicationScore}/10\n- Problem Solving: ${it.problemSolvingScore}/10" 
            }

            val currentSession = activeSession.value ?: return

            val prompt = """
                You are a Senior Executive Talent Recruiter and Principal Engineer.
                Synthesize a comprehensive final executive evaluation report based on the candidate's complete performance:
                Role: "${currentSession.role}"
                Company: "${currentSession.company}"
                
                Transcript of the entire interview:
                $qSummary

                Please generate a detailed evaluation. You must output a valid JSON object with the following fields:
                - 'strengths': 3 major, detailed strengths (formatted as bullet points).
                - 'weaknesses': 3 major technical/behavioral weaknesses or areas of improvement (formatted as bullet points).
                - 'missedConcepts': Detailed list of key technical concepts, tools, or best practices that they missed or explained weakly.
                - 'suggestedLearningPlan': A structured 4-week tailored roadmap to help them overcome their specific weaknesses.
                - 'recruiterComments': Natural, encouraging but extremely honest expert advice from the interviewer.
                - 'generalFeedback': Dynamic executive summary of their overall interview presence and cognitive readiness (2-3 sentences).

                Output ONLY the raw JSON object. Do NOT wrap in markdown or add conversational intro/outro.
            """.trimIndent()

            val apiKey = BuildConfig.GEMINI_API_KEY
            val request = GenerateContentRequest(
                contents = listOf(Content(parts = listOf(Part(text = prompt))))
            )

            val response = RetrofitClient.service.generateContent(apiKey, request)
            val rawResponse = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                ?: throw Exception("Final report response empty")

            val cleanJson = cleanJsonResponse(rawResponse)
            val obj = JSONObject(cleanJson)

            val updatedSession = currentSession.copy(
                overallScore = overallScorePercent,
                strengths = obj.optString("strengths", "- Strong initial articulation\n- Good confidence"),
                weaknesses = obj.optString("weaknesses", "- Needs more depth in architectural tradeoffs"),
                generalFeedback = obj.optString("generalFeedback", "Great performance overall. Keep practicing systems scaling under heavy data load."),
                missedConcepts = obj.optString("missedConcepts", "- System design edge cases\n- Cache eviction policies"),
                suggestedLearningPlan = obj.optString("suggestedLearningPlan", "Week 1: Focus on cache policies.\nWeek 2: Solve database scaling designs."),
                recruiterComments = obj.optString("recruiterComments", "You have great technical intuition; with a bit of systematic preparation, you will easily crack L6+ roles."),
                isCompleted = true
            )

            repository.updateSession(updatedSession)

            // Update user readiness score in profile
            val currentProfile = userProfile.value
            val calculatedReadiness = ((currentProfile.estimatedReadiness * 0.4) + (overallScorePercent * 0.6)).toInt().coerceIn(15, 98)
            repository.insertOrUpdateProfile(
                currentProfile.copy(
                    estimatedReadiness = calculatedReadiness
                )
            )

        } catch (e: Exception) {
            Log.e("InterviewXVM", "Error finalizing report: ${e.message}", e)
            val currentSession = activeSession.value ?: return
            val updatedSession = currentSession.copy(
                overallScore = overallScorePercent,
                strengths = "- Clear delivery speed\n- Enthusiastic answers",
                weaknesses = "- Needs more metrics and system parameters\n- Could expand results in STAR format",
                generalFeedback = "Complete mock interview finished. Focus on quantitative success metrics.",
                missedConcepts = "- System observability patterns\n- Structured logging strategies",
                suggestedLearningPlan = "Focus on database replication lag, read-after-write consistency, and modern cache layers.",
                recruiterComments = "Solid effort. Introduce more concrete performance percentages in your STAR answers to shine.",
                isCompleted = true
            )
            repository.updateSession(updatedSession)
        }
    }

    fun skipCurrentSession() {
        _activeSessionId.value = null
        _currentQuestionIndex.value = 0
    }

    // --- Resume Analyzer Actions ---
    fun analyzeResumeText(resumeContent: String, fileName: String = "Resume.pdf") {
        viewModelScope.launch(Dispatchers.IO) {
            _resumeAnalysisState.value = UiState.Loading
            try {
                val prompt = """
                    Perform a professional ATS (Applicant Tracking System) scan and resume audit on the following resume text:
                    $resumeContent

                    Output a comprehensive report in valid JSON format with the following fields:
                    - 'atsScore': Integer from 0 to 100 representing how well optimized this resume is for modern ATS systems.
                    - 'suggestions': String representing clear, actionable bullet points to improve the resume content.
                    - 'missingSkills': String representing core missing skills or modern keywords relevant to their target role.
                    - 'formattingFeedback': String representing feedback on structure, sections, and formatting.
                    - 'grammarFeedback': String representing grammar, spelling, syntax, and phrasing critique.
                    - 'matchedKeywords': String representing a summary of keywords that are successfully matched.
                    - 'proposedCertsAndRoadmap': String representing suggested professional certifications, portfolio project ideas, and a structured learning plan.

                    Output ONLY the raw JSON object. Do NOT wrap in markdown or add conversational text.
                """.trimIndent()

                val apiKey = BuildConfig.GEMINI_API_KEY
                val request = GenerateContentRequest(
                    contents = listOf(Content(parts = listOf(Part(text = prompt))))
                )

                val response = RetrofitClient.service.generateContent(apiKey, request)
                val rawResponse = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                    ?: throw Exception("Resume analysis returned empty from Gemini")

                val cleanJson = cleanJsonResponse(rawResponse)
                val obj = JSONObject(cleanJson)

                val analysis = ResumeAnalysis(
                    fileName = fileName,
                    resumeText = resumeContent,
                    atsScore = obj.optInt("atsScore", 65),
                    suggestions = obj.optString("suggestions", "- Quantify results with metrics.\n- Highlight leadership roles."),
                    missingSkills = obj.optString("missingSkills", "- Docker, Kubernetes\n- System Design, Jetpack Compose"),
                    formattingFeedback = obj.optString("formattingFeedback", "Structure is clean but needs standard Margins. Place experience first."),
                    grammarFeedback = obj.optString("grammarFeedback", "Active voice is strong. Fix 2 passive phrasing instances in experience block."),
                    matchedKeywords = obj.optString("matchedKeywords", "Kotlin, Android development, Retrofit, Git"),
                    proposedCertsAndRoadmap = obj.optString("proposedCertsAndRoadmap", "Get Associate Android Developer certificate. Build a multi-modular compose app.")
                )

                repository.insertAnalysis(analysis)
                _resumeAnalysisState.value = UiState.Success(analysis)

                // Update profile with average ATS score
                val p = userProfile.value
                repository.insertOrUpdateProfile(
                    p.copy(
                        averageAtsScore = analysis.atsScore,
                        estimatedReadiness = ((p.estimatedReadiness * 0.5) + (analysis.atsScore * 0.5)).toInt().coerceIn(15, 98)
                    )
                )

            } catch (e: Exception) {
                Log.e("InterviewXVM", "Error analyzing resume: ${e.message}", e)
                _resumeAnalysisState.value = UiState.Error(e.message ?: "Failed to analyze resume.")
            }
        }
    }

    // --- AI Career Coach Actions ---
    fun loadCareerCoachRoadmap() {
        viewModelScope.launch(Dispatchers.IO) {
            _careerCoachState.value = UiState.Loading
            try {
                val profile = userProfile.value
                val prompt = """
                    You are InterviewX AI Career Coach. Generate a comprehensive personal career roadmap, project ideas, suggested certifications, and a weekly learning plan for a candidate with:
                    Target Role: ${profile.targetRole}
                    Target Company: ${profile.targetCompany}
                    Experience Level: ${profile.experienceLevel}
                    Current Readiness: ${profile.estimatedReadiness}%
                    Average ATS Score: ${profile.averageAtsScore}%

                    Format the response as a clean, highly structured professional report with sections for:
                    1. Target Analysis (Match index, SWOT analysis for target company)
                    2. 12-Week Structured Learning Roadmap
                    3. recommended Certifications (High ROI)
                    4. 3 Portfolio Project Ideas (Modern, advanced, relevant to target company)
                    5. Weekly Learning Schedule

                    Output the response in clean, easy-to-read markdown.
                """.trimIndent()

                val apiKey = BuildConfig.GEMINI_API_KEY
                val request = GenerateContentRequest(
                    contents = listOf(Content(parts = listOf(Part(text = prompt))))
                )

                val response = RetrofitClient.service.generateContent(apiKey, request)
                val rawResponse = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                    ?: throw Exception("Career coach roadmap returned empty from Gemini")

                _careerCoachState.value = UiState.Success(rawResponse)
            } catch (e: Exception) {
                Log.e("InterviewXVM", "Error generating career guidance: ${e.message}", e)
                _careerCoachState.value = UiState.Error(e.message ?: "Failed to generate coaching roadmap.")
            }
        }
    }

    // --- Utility JSON Cleaner ---
    private fun cleanJsonResponse(raw: String): String {
        var clean = raw.trim()
        if (clean.startsWith("```json")) {
            clean = clean.substringAfter("```json").substringBeforeLast("```")
        } else if (clean.startsWith("```")) {
            clean = clean.substringAfter("```").substringBeforeLast("```")
        }
        return clean.trim()
    }
}
