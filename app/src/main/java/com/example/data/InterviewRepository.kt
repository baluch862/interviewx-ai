package com.example.data

import kotlinx.coroutines.flow.Flow

class InterviewRepository(
    private val userProfileDao: UserProfileDao,
    private val interviewSessionDao: InterviewSessionDao,
    private val interviewQuestionDao: InterviewQuestionDao,
    private val resumeAnalysisDao: ResumeAnalysisDao
) {
    val userProfile: Flow<UserProfile?> = userProfileDao.getProfile()
    val allSessions: Flow<List<InterviewSession>> = interviewSessionDao.getAllSessions()
    val allAnalyses: Flow<List<ResumeAnalysis>> = resumeAnalysisDao.getAllAnalyses()

    fun getSession(id: Int): Flow<InterviewSession?> = interviewSessionDao.getSession(id)
    fun getQuestionsForSession(sessionId: Int): Flow<List<InterviewQuestion>> = 
        interviewQuestionDao.getQuestionsForSession(sessionId)

    suspend fun insertOrUpdateProfile(profile: UserProfile) = 
        userProfileDao.insertOrUpdateProfile(profile)

    suspend fun insertSession(session: InterviewSession): Long = 
        interviewSessionDao.insertSession(session)
    
    suspend fun updateSession(session: InterviewSession) = 
        interviewSessionDao.updateSession(session)
    
    suspend fun deleteSession(session: InterviewSession) = 
        interviewSessionDao.deleteSession(session)

    suspend fun insertQuestion(question: InterviewQuestion) = 
        interviewQuestionDao.insertQuestion(question)
    
    suspend fun insertQuestions(questions: List<InterviewQuestion>) = 
        interviewQuestionDao.insertQuestions(questions)
    
    suspend fun updateQuestion(question: InterviewQuestion) = 
        interviewQuestionDao.updateQuestion(question)

    suspend fun insertAnalysis(analysis: ResumeAnalysis): Long = 
        resumeAnalysisDao.insertAnalysis(analysis)
    
    suspend fun deleteAnalysis(analysis: ResumeAnalysis) = 
        resumeAnalysisDao.deleteAnalysis(analysis)
}
