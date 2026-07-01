package com.example.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface UserProfileDao {
    @Query("SELECT * FROM user_profiles WHERE id = 1 LIMIT 1")
    fun getProfile(): Flow<UserProfile?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateProfile(profile: UserProfile)
}

@Dao
interface InterviewSessionDao {
    @Query("SELECT * FROM interview_sessions ORDER BY timestamp DESC")
    fun getAllSessions(): Flow<List<InterviewSession>>

    @Query("SELECT * FROM interview_sessions WHERE id = :id")
    fun getSession(id: Int): Flow<InterviewSession?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: InterviewSession): Long

    @Update
    suspend fun updateSession(session: InterviewSession)

    @Delete
    suspend fun deleteSession(session: InterviewSession)
}

@Dao
interface InterviewQuestionDao {
    @Query("SELECT * FROM interview_questions WHERE sessionId = :sessionId ORDER BY orderIndex ASC")
    fun getQuestionsForSession(sessionId: Int): Flow<List<InterviewQuestion>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQuestion(question: InterviewQuestion)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQuestions(questions: List<InterviewQuestion>)

    @Update
    suspend fun updateQuestion(question: InterviewQuestion)
}

@Dao
interface ResumeAnalysisDao {
    @Query("SELECT * FROM resume_analyses ORDER BY timestamp DESC")
    fun getAllAnalyses(): Flow<List<ResumeAnalysis>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAnalysis(analysis: ResumeAnalysis): Long

    @Delete
    suspend fun deleteAnalysis(analysis: ResumeAnalysis)
}
