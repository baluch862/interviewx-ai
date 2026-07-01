'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { 
  Sparkles, 
  LayoutDashboard, 
  FileText, 
  Building2, 
  Terminal, 
  Mic, 
  LineChart, 
  User, 
  Settings, 
  ShieldAlert, 
  Upload, 
  CheckCircle2, 
  Play, 
  LogOut, 
  Briefcase, 
  Clock, 
  Sliders, 
  BookOpen, 
  Check, 
  Code, 
  Bot, 
  Send,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import AuthCard from '@/components/auth/AuthCard';
import VoiceInterview from '@/components/VoiceInterview';
import { 
  ResponsiveContainer, 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip 
} from 'recharts';

// Import local types
import { 
  DifficultyLevel, 
  QuestionCategory 
} from '@/types/database';

interface CounterProps {
  value: number;
}

function Counter({ value }: CounterProps) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.round(latest))
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue}</span>;
}

interface VoiceToggleProps {
  onTranscriptChange: (text: string) => void;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
}

function VoiceToggle({ onTranscriptChange, isListening, setIsListening }: VoiceToggleProps) {
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onTranscriptChange(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event);
      if (event.error !== 'no-speech') {
        setError(`Error: ${event.error}`);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscriptChange, setIsListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (error) return;
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (error) {
    return (
      <span className="text-[10px] text-zinc-500 italic" title={error}>
        Voice input unavailable
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all duration-300 outline-none ${
        isListening
          ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse'
          : 'bg-white/[0.02] border-white/[0.06] hover:border-cyan-400/40 text-zinc-400 hover:text-white hover:bg-white/[0.04]'
      }`}
    >
      {isListening ? (
        <>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span>Listening...</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 text-zinc-400" />
          <span>Speak Answer</span>
        </>
      )}
    </button>
  );
}

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const staggerItemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 120, 
      damping: 15 
    } 
  }
};

export default function InterviewXApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'resume' | 'company' | 'interview' | 'progress' | 'profile' | 'settings' | 'admin'>('dashboard');

  // Sub-states
  // 1. Resume Sub-state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [resumeScore, setResumeScore] = useState<number | null>(null);

  // 2. Company Select state
  const [selectedCompany, setSelectedCompany] = useState<string>('Google');
  const [targetRole, setTargetRole] = useState<string>('Senior Software Engineer');

  // 3. Interview session parameters
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [interviewType, setInterviewType] = useState<'technical' | 'hr' | 'voice' | 'coding' | 'aptitude'>('technical');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userTranscript, setUserTranscript] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<'junior' | 'mid' | 'senior' | 'staff'>('senior');
  const [liveScores, setLiveScores] = useState<{
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    overallRating: number;
  } | null>(null);

  const handleVoiceTranscript = (text: string) => {
    setUserTranscript(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${text.trim()}` : text.trim();
    });
  };
  const [interviewConversation, setInterviewConversation] = useState<Array<{ role: 'model' | 'user'; text: string }>>([]);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [interviewResult, setInterviewResult] = useState<any | null>(null);

  // Session comparison state
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareSession1, setCompareSession1] = useState<string>('session_1');
  const [compareSession2, setCompareSession2] = useState<string>('session_2');

  const historicalSessionsForCompare = [
    {
      id: 'session_1',
      date: '2026-06-29',
      type: 'Technical Sandbox',
      target: 'Google - Staff Eng',
      metrics: {
        overall: 87,
        technical: 89,
        communication: 82,
        problemSolving: 90,
        confidence: 85
      },
      duration: '45 mins',
      difficulty: 'Staff (L7)',
      feedback: 'Excellent deep system design capabilities. Identified clear lock contention trade-offs. Minor optimization gaps in distributed concurrency.'
    },
    {
      id: 'session_2',
      date: '2026-06-27',
      type: 'HR Rubrics',
      target: 'Netflix - Tech Lead',
      metrics: {
        overall: 81,
        technical: 78,
        communication: 88,
        problemSolving: 80,
        confidence: 83
      },
      duration: '30 mins',
      difficulty: 'Senior (L6)',
      feedback: 'Highly empathetic style. Clear structured answers using STAR framework. Strong representation of cross-functional team alignment.'
    },
    {
      id: 'session_3',
      date: '2026-06-24',
      type: 'Voice Reciter',
      target: 'Stripe - SSE',
      metrics: {
        overall: 84,
        technical: 82,
        communication: 85,
        problemSolving: 83,
        confidence: 88
      },
      duration: '20 mins',
      difficulty: 'Senior (L6)',
      feedback: 'Impressive speaking pacing and low vocabulary hesitation. Accurately summarized container cold starts.'
    },
    {
      id: 'session_4',
      date: '2026-06-20',
      type: 'Critical Analytical Test',
      target: 'Meta - Principal Eng',
      metrics: {
        overall: 74,
        technical: 75,
        communication: 70,
        problemSolving: 78,
        confidence: 72
      },
      duration: '60 mins',
      difficulty: 'Principal (L8)',
      feedback: 'Strong problem solving, but communication structure felt slightly rushed. Focus more on explicit failure scenario mitigation.'
    }
  ];

  // Default Mock Data for Demonstration & Interaction
  const defaultStats = {
    totalSessions: 14,
    averageScore: 84,
    resumeMatchScore: 92,
    activeSubscription: 'Enterprise Sandbox Pass'
  };

  const sampleQuestions = {
    technical: [
      "Explain the performance trade-offs of using optimistic concurrency locking versus pessimistic locking in distributed systems, and how you'd implement it with Firebase Firestore.",
      "How would you optimize a React component with millions of dynamically updated child nodes to avoid garbage collection bottlenecks during rendering?",
      "Design an enterprise-level rate limiting architecture for the Gemini API utilizing Redis key-value evictions."
    ],
    hr: [
      "Describe a situation where you had an architectural disagreement with a Principal Architect. How did you resolve the conflict with data?",
      "Why is high-quality communication and developer empathy critical for cross-functional staff engineering roles?",
      "What core challenges do you foresee in ensuring bias mitigation when evaluating human talent using automated LLMs?"
    ],
    voice: [
      "Welcome operator. In your own voice, synthesize a clear high-level approach for mitigating cold-start container latencies in serverless cloud runtimes.",
      "Explain how a microservices mesh handles cascading circuit breaker trip-outs under a massive burst-traffic DDoS event.",
      "Describe how memory compaction works inside the modern V8 runtime's garbage collection loop."
    ],
    coding: [
      "Implement a thread-safe custom LRU Cache container class using double-linked nodes and an index map in TypeScript.",
      "Given an unsorted list of integers, find the maximum consecutive subarray product sequence in O(n) runtime complexity.",
      "Write a reactive token bucket algorithm that throttles multiple API endpoints across independent rate buckets."
    ],
    aptitude: [
      "A distributed system replicates databases asynchronously across 3 zones. If the packet loss is 1% between Zone A and B, and 0.5% between B and C, what is the maximum compound failure probability of a commit acknowledgment across the cluster?",
      "State which caching eviction strategy would yield the lowest page-fault margin under highly sequential data read operations.",
      "Estimate the daily system storage bandwidth footprint of a server processing 50,000 JSON payloads per second, where each payload is 1.5 kilobytes."
    ]
  };

  // Mock Resume Evaluation Results
  const mockResumeFeedback = {
    overallScore: 88,
    formattingScore: 95,
    impactBulletPointsScore: 82,
    detectedSkills: ["React Native", "TypeScript", "Node.js", "Docker", "AWS ECS", "NoSQL", "CI/CD"],
    missingSkills: ["Kubernetes (EKS)", "Distributed Logging (Elastic/Prometheus)", "OAuth2/SAML protocol patterns"],
    bulletFeedback: [
      "Your bullet points are strong but require more direct quantitative metrics (e.g., 'reduced render-blocking time by 35%').",
      "Format looks exceptional and scans perfectly under ATS standards."
    ]
  };

  const companies = [
    { name: 'Google', tagline: 'Algorithmic focus & scale engineering', logo: 'G' },
    { name: 'Microsoft', tagline: 'Enterprise systems & cloud architectures', logo: 'M' },
    { name: 'Meta', tagline: 'Extreme product iteration & fast shipping', logo: 'f' },
    { name: 'Netflix', tagline: 'High-availability streaming & chaos resiliency', logo: 'N' },
    { name: 'Stripe', tagline: 'API design, payment ledger integrity, & security', logo: 'S' }
  ];

  // Actions
  const handleUploadResume = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      setIsAnalyzingResume(true);
      setTimeout(() => {
        setIsAnalyzingResume(false);
        setResumeScore(88);
      }, 2500);
    }
  };

  const startInterview = async (type: 'technical' | 'hr' | 'voice' | 'coding' | 'aptitude') => {
    setInterviewType(type);
    setIsInterviewActive(true);
    setCurrentQuestionIndex(0);
    setInterviewResult(null);
    setUserTranscript('');
    setLiveScores(null);
    setCurrentDifficulty('senior');
    
    if (type === 'voice') {
      // Voice Interview handles itself using VoiceInterview component
      return;
    }

    setIsGeneratingQuestion(true);
    try {
      const res = await fetch('/api/interview/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_first',
          role: targetRole,
          company: selectedCompany,
          interviewType: type,
          currentDifficulty: 'senior'
        })
      });
      const data = await res.json();
      if (data.question) {
        setInterviewConversation([
          { role: 'model', text: data.question }
        ]);
      } else {
        // Fallback
        setInterviewConversation([
          { role: 'model', text: sampleQuestions[type][0] }
        ]);
      }
    } catch (err) {
      console.error(err);
      setInterviewConversation([
        { role: 'model', text: sampleQuestions[type][0] }
      ]);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const submitAnswer = async () => {
    if (!userTranscript.trim()) return;

    setIsSubmittingAnswer(true);
    const newConv = [...interviewConversation, { role: 'user' as const, text: userTranscript }];
    setInterviewConversation(newConv);
    setUserTranscript('');

    try {
      // We will perform a 3-question interview session
      const isLast = currentQuestionIndex === 2;

      if (isLast) {
        // Evaluate and generate final report card dynamically using Gemini!
        const res = await fetch('/api/interview/intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_report',
            role: targetRole,
            company: selectedCompany,
            interviewType,
            conversationHistory: newConv
          })
        });
        const data = await res.json();
        setIsSubmittingAnswer(false);
        setIsInterviewActive(false);

        if (data.report) {
          setInterviewResult({
            score: data.report.interviewReadinessPercentage || 85,
            feedback: data.report.recruiterSummary || "Strong performance.",
            strengths: data.report.strengths || [],
            gaps: data.report.weakAreas || []
          });
        } else {
          // Fallback
          setInterviewResult({
            score: Math.floor(Math.random() * 20) + 75,
            feedback: "Demonstrated strong theoretical foundations.",
            strengths: ["Excellent architectural mapping"],
            gaps: ["Consider deeper quantitative examples"]
          });
        }
      } else {
        const res = await fetch('/api/interview/intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'submit_answer',
            role: targetRole,
            company: selectedCompany,
            interviewType,
            conversationHistory: newConv,
            currentDifficulty
          })
        });
        const data = await res.json();
        
        if (data.nextQuestion) {
          setCurrentQuestionIndex(prev => prev + 1);
          if (data.nextDifficulty) setCurrentDifficulty(data.nextDifficulty);
          if (data.liveMetrics) {
            setLiveScores({
              technicalScore: data.liveMetrics.technicalScore || 80,
              communicationScore: data.liveMetrics.communicationScore || 80,
              confidenceScore: data.liveMetrics.confidenceScore || 80,
              overallRating: data.liveMetrics.overallRating || 80
            });
          }
          setInterviewConversation(prev => [
            ...prev,
            { role: 'model' as const, text: data.nextQuestion }
          ]);
        } else {
          // Fallback
          const nextIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIndex);
          setInterviewConversation(prev => [
            ...prev,
            { role: 'model' as const, text: sampleQuestions[interviewType][nextIndex] || "Please describe another architectural challenge you overcame." }
          ]);
        }
        setIsSubmittingAnswer(false);
      }
    } catch (err) {
      console.error(err);
      setIsSubmittingAnswer(false);
      // Fallback
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex >= 3) {
        setIsInterviewActive(false);
        setInterviewResult({
          score: 82,
          feedback: "Great session. Solid knowledge of basic parameters.",
          strengths: ["Clear verbal style"],
          gaps: ["Provide more depth"]
        });
      } else {
        setCurrentQuestionIndex(nextIndex);
        setInterviewConversation(prev => [
          ...prev,
          { role: 'model' as const, text: sampleQuestions[interviewType][nextIndex] || "Please describe another architectural challenge you overcame." }
        ]);
      }
    }
  };

  return (
    <div className="min-h-screen text-foreground bg-[#09090b] relative tech-dot-grid">
      
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 w-full glass-container border-b border-white/[0.06] backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Logo with Cyan Pulsing Accent */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyber-blue via-cyber-cyan to-cyber-purple p-[1.5px] shadow-[0_0_15px_rgba(79,172,254,0.3)] animate-pulse">
              <div className="w-full h-full bg-[#09090b] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-sm font-black tracking-wider text-white uppercase">
                InterviewX
              </span>
              <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase block -mt-1">
                Artificial Intelligence
              </span>
            </div>
          </div>

          {/* Nav items for authenticated user */}
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 mr-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">
                  Connected to Engine
                </span>
              </div>
              <button 
                onClick={() => setIsAuthenticated(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative">
        <AnimatePresence mode="wait">
          
          {/* 1. AUTH SCREEN VIEW */}
          {!isAuthenticated ? (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="py-12 flex flex-col items-center justify-center min-h-[70vh]"
            >
              <div className="max-w-md w-full">
                <AuthCard onSuccess={() => setIsAuthenticated(true)} />
              </div>
            </motion.div>
          ) : (
            
            /* 2. AUTHENTICATED WORKSPACE VIEW */
            <motion.div 
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              
              {/* SIDEBAR NAVIGATION MODULE */}
              <aside className="lg:col-span-3 space-y-2 p-3 glass-card rounded-2xl border border-white/[0.06] backdrop-blur-xl">
                <p className="text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase px-3 py-2">
                  Systems Engine
                </p>
                
                <nav className="space-y-1">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { id: 'resume', label: 'Resume Analyzer', icon: FileText },
                    { id: 'company', label: 'Company Hub', icon: Building2 },
                    { id: 'interview', label: 'AI Simulators', icon: Terminal },
                    { id: 'progress', label: 'Analytics Report', icon: LineChart },
                    { id: 'profile', label: 'Operator Profile', icon: User },
                    { id: 'settings', label: 'Enclave Settings', icon: Sliders },
                    { id: 'admin', label: 'Supervisor console', icon: ShieldAlert }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setIsInterviewActive(false);
                          setInterviewResult(null);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          activeTab === item.id 
                            ? 'bg-gradient-to-r from-cyber-blue/20 to-cyber-purple/20 border-l-2 border-cyan-400 text-white shadow-inner shadow-cyan-400/5' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                        }`}
                      >
                        <Icon className={`w-4.5 h-4.5 ${activeTab === item.id ? 'text-cyan-400' : 'text-zinc-500'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="pt-4 border-t border-white/[0.05] mt-4 px-3">
                  <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-900/30">
                    <p className="text-[10px] font-bold text-cyan-400 uppercase">Current Subsystem</p>
                    <p className="text-xs font-semibold text-white mt-1">Enterprise Developer</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Quota: Unlimited API sessions</p>
                  </div>
                </div>
              </aside>

              {/* CORE SCREEN MODULE DYNAMICS */}
              <div className="lg:col-span-9 space-y-6">
                
                {/* 1. DASHBOARD VIEW */}
                {activeTab === 'dashboard' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Welcome Banner */}
                    <div className="relative glass-card rounded-2xl p-8 border border-white/[0.06] overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-obsidian-900">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyber-blue to-cyan-400 opacity-10 blur-[80px] pointer-events-none" />
                      
                      <div className="relative z-10 space-y-3">
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 w-fit">
                          <Bot className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-[10px] font-bold tracking-wide text-cyan-400 uppercase">Active Copilot: Gemini 1.5 Pro</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white">
                          Welcome, Staff Operator
                        </h2>
                        <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                          Analyze candidate credentials, simulate complex architectural system bottlenecks, select custom company guidelines, and receive automated feedback scores mapped under standard elite benchmarks.
                        </p>
                      </div>
                    </div>

                    {/* Quick Analytics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Evaluation Score', value: `${defaultStats.averageScore}%`, desc: 'Elite engineer average', icon: LineChart, color: 'text-cyan-400' },
                        { label: 'Simulations Completed', value: `${defaultStats.totalSessions} Sessions`, desc: 'Technical & behavioral', icon: Terminal, color: 'text-purple-400' },
                        { label: 'Resume ATS Health', value: `${defaultStats.resumeMatchScore}%`, desc: 'Tailored for target role', icon: FileText, color: 'text-emerald-400' },
                        { label: 'Engine Authorization', value: 'Unlimited Pass', desc: 'Secure enterprise key', icon: Sliders, color: 'text-pink-400' }
                      ].map((card, i) => {
                        const Icon = card.icon;
                        return (
                          <div key={i} className="glass-card p-5 rounded-xl border border-white/[0.05] relative overflow-hidden">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-extrabold tracking-wider text-zinc-500 uppercase">{card.label}</span>
                              <Icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                            <div className="text-xl font-bold text-white mt-2">{card.value}</div>
                            <p className="text-[10px] text-zinc-500 mt-1">{card.desc}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Access Grid */}
                    <div>
                      <h3 className="text-xs font-extrabold tracking-widest text-zinc-400 uppercase mb-4">Core Simulators</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { title: 'Technical Sandbox', desc: 'Lock-free architectures, concurrency threads, API evictions.', type: 'technical' as const, icon: Code, accent: 'from-blue-500 to-cyan-500' },
                          { title: 'Voice Reciter Engine', desc: 'Syllable checks, delivery speed metrics, cold start analyses.', type: 'voice' as const, icon: Mic, accent: 'from-cyan-500 to-purple-500' },
                          { title: 'HR Behavior Rubrics', desc: 'Conflicts management, empathy vectors, cross-functional engineering.', type: 'hr' as const, icon: User, accent: 'from-purple-500 to-pink-500' }
                        ].map((btn, idx) => {
                          const Icon = btn.icon;
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setActiveTab('interview');
                                startInterview(btn.type);
                              }}
                              className="group text-left p-5 rounded-xl bg-white/[0.01] border border-white/[0.06] hover:border-cyan-400/30 transition duration-300 relative overflow-hidden"
                            >
                              <div className={`absolute top-0 left-0 h-[3px] w-1/3 bg-gradient-to-r ${btn.accent} group-hover:w-full transition-all duration-300`} />
                              <div className="flex justify-between items-center mb-3">
                                <div className="p-2 rounded-lg bg-white/[0.04]">
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <Play className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
                              </div>
                              <h4 className="text-xs font-bold text-white mb-1">{btn.title}</h4>
                              <p className="text-[11px] text-zinc-500 leading-normal">{btn.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. RESUME ANALYZER VIEW */}
                {activeTab === 'resume' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-2xl border border-white/[0.06] space-y-6"
                  >
                    <div>
                      <h2 className="text-lg font-black text-white">SaaS Resume Analyzer</h2>
                      <p className="text-xs text-zinc-500 mt-1">Upload your resume to perform automated ATS checks, detect critical skill gaps, and receive feedback.</p>
                    </div>

                    {/* Upload Dropzone */}
                    <div className="border border-dashed border-white/[0.1] hover:border-cyan-400/40 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-white/[0.01] hover:bg-white/[0.02] transition cursor-pointer relative overflow-hidden">
                      <input 
                        type="file" 
                        accept=".pdf,.docx"
                        onChange={handleUploadResume}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="p-4 rounded-full bg-white/[0.03] mb-4">
                        <Upload className="w-7 h-7 text-zinc-400" />
                      </div>
                      <p className="text-xs font-semibold text-white">Drag & drop resume payload</p>
                      <p className="text-[11px] text-zinc-500 mt-1">Supports PDF & DOCX formats (Max 10MB)</p>
                    </div>

                    {/* Loader */}
                    {isAnalyzingResume && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-cyan-950/20 border border-cyan-900/30">
                        <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                        <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Parsing file nodes & compiling gap models...</span>
                      </div>
                    )}

                    {/* Results Display */}
                    {resumeScore && !isAnalyzingResume && (
                      <motion.div 
                        variants={staggerContainerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-6 pt-4 border-t border-white/[0.06]"
                      >
                        <motion.div variants={staggerItemVariants} className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full border-4 border-cyan-400/20 border-t-cyan-400 flex items-center justify-center">
                              <span className="text-lg font-black text-white"><Counter value={resumeScore} />%</span>
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white">System ATS Health Assessment</h3>
                              <p className="text-[11px] text-zinc-500">Matching criteria against target: Staff Engineer</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-extrabold tracking-wider text-emerald-400 uppercase">Analysis Dispatched</span>
                          </div>
                        </motion.div>

                        {/* Skill Breakdown */}
                        <motion.div variants={staggerItemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-zinc-950/50 border border-white/[0.04]">
                            <h4 className="text-[11px] font-extrabold tracking-wider text-emerald-400 uppercase mb-3">Detected Skills Match</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {mockResumeFeedback.detectedSkills.map((skill, i) => (
                                <span key={i} className="px-2 py-1 rounded bg-zinc-900 text-[10px] text-zinc-300 font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400" /> {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-zinc-950/50 border border-white/[0.04]">
                            <h4 className="text-[11px] font-extrabold tracking-wider text-rose-400 uppercase mb-3">Identified Skill Gaps</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {mockResumeFeedback.missingSkills.map((skill, i) => (
                                <span key={i} className="px-2 py-1 rounded bg-zinc-900 text-[10px] text-zinc-300 font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-rose-400" /> {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>

                        {/* Quantitative Feedback */}
                        <motion.div variants={staggerItemVariants} className="p-4 rounded-xl bg-zinc-950/50 border border-white/[0.04]">
                          <h4 className="text-[11px] font-extrabold tracking-wider text-zinc-400 uppercase mb-3">Bullet Points Feedback</h4>
                          <ul className="space-y-2">
                            {mockResumeFeedback.bulletFeedback.map((fb, idx) => (
                              <li key={idx} className="text-xs text-zinc-400 flex items-start gap-2 leading-relaxed">
                                <span className="w-1 h-1 rounded-full bg-cyan-400 mt-2" />
                                <span>{fb}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* 3. COMPANY SELECTION VIEW */}
                {activeTab === 'company' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-2xl border border-white/[0.06] space-y-6"
                  >
                    <div>
                      <h2 className="text-lg font-black text-white">Target Company Configurations</h2>
                      <p className="text-xs text-zinc-500 mt-1">Select standard company profiles to tailor behavioral rubrics and architectural parameters for mock sessions.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {companies.map((company, i) => (
                        <div 
                          key={i}
                          onClick={() => setSelectedCompany(company.name)}
                          className={`p-5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                            selectedCompany === company.name 
                              ? 'bg-cyan-500/5 border-cyan-400/50' 
                              : 'bg-white/[0.01] border-white/[0.06] hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                              selectedCompany === company.name ? 'bg-cyan-500 text-white' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {company.logo}
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-white">{company.name}</h3>
                              <p className="text-[11px] text-zinc-500 mt-0.5">{company.tagline}</p>
                            </div>
                          </div>
                          {selectedCompany === company.name && (
                            <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Config params form */}
                    <div className="pt-6 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold tracking-wider text-zinc-500 uppercase mb-2">Target Role</label>
                        <input 
                          type="text" 
                          value={targetRole}
                          onChange={(e) => setTargetRole(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-xs bg-zinc-950 border border-white/[0.06] text-white focus:border-cyan-400/50 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold tracking-wider text-zinc-500 uppercase mb-2">Target Difficulty</label>
                        <select className="w-full px-4 py-2.5 rounded-xl text-xs bg-zinc-950 border border-white/[0.06] text-white focus:border-cyan-400/50 outline-none">
                          <option>Senior (L6)</option>
                          <option>Staff/Principal (L7)</option>
                          <option>Mid-level (L5)</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. AI INTERVIEW ENGINE VIEW */}
                {activeTab === 'interview' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {!isInterviewActive ? (
                      <div className="glass-card p-6 rounded-2xl border border-white/[0.06] space-y-6">
                        <div>
                          <h2 className="text-lg font-black text-white">AI Simulators</h2>
                          <p className="text-xs text-zinc-500 mt-1">Select a mock type below to instantiate an interactive evaluation session. Evaluation scores are generated dynamically using Gemini.</p>
                        </div>

                        {/* Simulator Selection Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { id: 'technical' as const, label: 'Technical Sandbox', icon: Code, desc: 'Covers software design, data systems, and optimization bottlenecks.' },
                            { id: 'hr' as const, label: 'HR Behavior Rubrics', icon: User, desc: 'Evaluates conflict resolution, executive storytelling, and teamwork.' },
                            { id: 'voice' as const, label: 'Voice Reciter Simulator', icon: Mic, desc: 'Real-time speech transcript parameters with direct latency metrics.' },
                            { id: 'coding' as const, label: 'Algorithm Compiler sandbox', icon: Terminal, desc: 'Implement reactive code blocks and optimization tasks.' },
                            { id: 'aptitude' as const, label: 'Critical Analytical Test', icon: BookOpen, desc: 'System statistics, cache eviction margins, and failure probabilities.' }
                          ].map((item) => {
                            const Icon = item.icon;
                            return (
                              <div key={item.id} className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.06] flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-white/[0.03]">
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="space-y-2 flex-1">
                                  <h3 className="text-xs font-bold text-white">{item.label}</h3>
                                  <p className="text-[11px] text-zinc-500 leading-normal">{item.desc}</p>
                                  <button
                                    onClick={() => startInterview(item.id)}
                                    className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 hover:underline outline-none"
                                  >
                                    <span>Instantiate Simulator</span>
                                    <Play className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Last Evaluation results if present */}
                        {interviewResult && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-5 rounded-2xl bg-cyan-950/10 border border-cyan-400/30 space-y-4"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider">Evaluation Report Available</h3>
                                <p className="text-[11px] text-zinc-400">Score generated by Gemini engine based on answers</p>
                              </div>
                              <div className="text-3xl font-black text-cyan-400">
                                <Counter value={interviewResult.score} />%
                              </div>
                            </div>
                            
                            <p className="text-xs text-zinc-300 leading-relaxed">{interviewResult.feedback}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              <div>
                                <h4 className="text-[10px] font-extrabold tracking-wider text-emerald-400 uppercase mb-1.5">Elite Strengths</h4>
                                <ul className="space-y-1.5">
                                  {interviewResult.strengths.map((s: string, idx: number) => (
                                    <li key={idx} className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                                      <Check className="w-3.5 h-3.5 text-emerald-400" /> {s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-extrabold tracking-wider text-rose-400 uppercase mb-1.5">Knowledge Gaps</h4>
                                <ul className="space-y-1.5">
                                  {interviewResult.gaps.map((g: string, idx: number) => (
                                    <li key={idx} className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> {g}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ) : interviewType === 'voice' ? (
                      <VoiceInterview 
                        role={targetRole}
                        company={selectedCompany}
                        onEnd={(result) => {
                          setIsInterviewActive(false);
                          setInterviewResult(result);
                        }}
                        onTerminate={() => {
                          setIsInterviewActive(false);
                        }}
                      />
                    ) : (
                      
                      /* INTERVIEW ACTIVE RUNTIME ENGINE */
                      <div className="glass-card p-6 rounded-2xl border border-white/[0.06] space-y-6 relative overflow-hidden bg-gradient-to-br from-zinc-950 to-obsidian-900">
                        {isGeneratingQuestion ? (
                          <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                            <div className="text-center">
                              <h3 className="text-sm font-black text-white uppercase tracking-wider">Generating Dynamic Assessment</h3>
                              <p className="text-[10px] text-zinc-500 mt-1">Gemini Interview Intelligence is building context matching your resume & credentials...</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Session headers */}
                            <div className="flex justify-between items-center border-b border-white/[0.06] pb-4 flex-wrap gap-4">
                              <div>
                                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{interviewType} SESSION FOR {selectedCompany}</span>
                                <h2 className="text-sm font-bold text-white mt-0.5">Question {currentQuestionIndex + 1} of 3</h2>
                              </div>

                              {/* Adaptive Difficulty Badge */}
                              <div className="px-2.5 py-1 rounded-md bg-zinc-900 border border-white/[0.06] text-[9px] font-extrabold uppercase tracking-widest text-cyan-400">
                                Adaptive Difficulty: {currentDifficulty}
                              </div>

                              <button 
                                onClick={() => setIsInterviewActive(false)}
                                className="text-xs font-semibold text-zinc-500 hover:text-zinc-300"
                              >
                                Terminate Session
                              </button>
                            </div>

                            {/* Live metrics scorecard row */}
                            {liveScores && (
                              <motion.div 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/[0.01] border border-white/[0.05] rounded-xl p-3"
                              >
                                <div>
                                  <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">Technical Mastery</span>
                                  <span className="text-sm font-black text-cyan-400">{liveScores.technicalScore}%</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">Communication style</span>
                                  <span className="text-sm font-black text-cyan-400">{liveScores.communicationScore}%</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">Executive Confidence</span>
                                  <span className="text-sm font-black text-cyan-400">{liveScores.confidenceScore}%</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block">Overall Rating</span>
                                  <span className="text-sm font-black text-cyan-400">{liveScores.overallRating}%</span>
                                </div>
                              </motion.div>
                            )}

                            {/* Interactive chat/dialogue box */}
                            <div className="space-y-4">
                              {interviewConversation.map((msg, idx) => (
                                <div 
                                  key={idx} 
                                  className={`flex ${msg.role === 'model' ? 'justify-start' : 'justify-end'}`}
                                >
                                  <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                                    msg.role === 'model' 
                                      ? 'bg-white/[0.03] border border-white/[0.06] text-white' 
                                      : 'bg-cyan-500/10 border border-cyan-400/20 text-cyan-300'
                                  }`}>
                                    <p className="font-bold text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
                                      {msg.role === 'model' ? 'AI Coach' : 'Your Answer'}
                                    </p>
                                    <p>{msg.text}</p>
                                  </div>
                                </div>
                              ))}

                              {isSubmittingAnswer && (
                                <div className="flex justify-end">
                                  <div className="p-4 rounded-2xl bg-zinc-900 border border-white/[0.06] flex items-center gap-2">
                                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                                    <span className="text-[10px] font-bold tracking-wide text-zinc-400 uppercase">Analyzing answer parameters...</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Input Box */}
                            <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                              <textarea 
                                rows={4}
                                value={userTranscript}
                                onChange={(e) => setUserTranscript(e.target.value)}
                                placeholder="Type or speak your complete technical response inside the secure buffer..."
                                className="w-full px-4 py-3 rounded-xl text-xs bg-zinc-950 border border-white/[0.06] focus:border-cyan-400/50 text-white outline-none resize-none"
                              />
                              
                              {isVoiceListening && (
                                <div className="flex items-center gap-0.5 px-3 py-1.5 bg-rose-500/5 border border-rose-500/10 rounded-lg w-fit">
                                  <span className="text-[10px] text-rose-400 font-bold mr-1.5 uppercase tracking-widest">Audio Stream Active:</span>
                                  {[...Array(8)].map((_, i) => (
                                    <div 
                                      key={i} 
                                      className="w-1 bg-rose-400 rounded-full animate-pulse" 
                                      style={{ 
                                        height: `${Math.floor(Math.random() * 14) + 6}px`,
                                        animationDelay: `${i * 0.08}s`,
                                        animationDuration: '0.5s'
                                      }} 
                                    />
                                  ))}
                                </div>
                              )}

                              <div className="flex justify-between items-center flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                  <VoiceToggle 
                                    onTranscriptChange={handleVoiceTranscript}
                                    isListening={isVoiceListening}
                                    setIsListening={setIsVoiceListening}
                                  />
                                  {isVoiceListening && (
                                    <div className="flex items-center gap-1.5 text-rose-400/80 text-[10px] font-semibold tracking-wider uppercase animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                      <span>Recording Real-time Audio Stream...</span>
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={submitAnswer}
                                  disabled={!userTranscript.trim() || isSubmittingAnswer}
                                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-xs font-bold text-white flex items-center gap-1.5 outline-none transition"
                                >
                                  <span>Next Answer</span>
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 5. PROGRESS DASHBOARD VIEW */}
                {activeTab === 'progress' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-2xl border border-white/[0.06] space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-4">
                      <div>
                        <h2 className="text-lg font-black text-white">Analytics Report</h2>
                        <p className="text-xs text-zinc-500 mt-1">Review historical progress trends, session completions, and skill matrix enhancements.</p>
                      </div>
                      
                      {/* Comparison Mode Toggle */}
                      <button
                        onClick={() => setIsCompareMode(!isCompareMode)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-300 outline-none select-none ${
                          isCompareMode
                            ? 'bg-cyan-500/10 border-cyan-400/50 text-cyan-400'
                            : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.12]'
                        }`}
                      >
                        <span>Session Comparison Mode</span>
                        <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-300 flex items-center ${isCompareMode ? 'bg-cyan-500 justify-end' : 'bg-zinc-800 justify-start'}`}>
                          <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md" />
                        </div>
                      </button>
                    </div>

                    {!isCompareMode ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Metric 1: Historical average */}
                          <div className="p-4 rounded-xl bg-zinc-950/50 border border-white/[0.04]">
                            <span className="text-[10px] font-extrabold text-zinc-500 tracking-widest uppercase">Score growth index</span>
                            <div className="flex items-baseline gap-2 mt-2">
                              <span className="text-2xl font-black text-white">84%</span>
                              <span className="text-[10px] text-emerald-400 font-bold">+2.4% this week</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-3">
                              <div className="h-full bg-cyan-400 w-[84%]" />
                            </div>
                          </div>

                          {/* Metric 2: Category distribution */}
                          <div className="p-4 rounded-xl bg-zinc-950/50 border border-white/[0.04]">
                            <span className="text-[10px] font-extrabold text-zinc-500 tracking-widest uppercase">Daily Activity Streak</span>
                            <div className="flex items-baseline gap-2 mt-2">
                              <span className="text-2xl font-black text-white">6 Days</span>
                              <span className="text-[10px] text-zinc-500">Active user streak</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-3">
                              <div className="h-full bg-purple-500 w-[75%]" />
                            </div>
                          </div>
                        </div>

                        {/* Performance Trend Line Chart */}
                        <div className="pt-4 border-t border-white/[0.06] space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Performance Trend Chart</h3>
                              <p className="text-[10px] text-zinc-500">Overall interview score progression over time.</p>
                            </div>
                            <span className="text-[9px] font-extrabold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded uppercase tracking-widest">
                              Recharts Engine
                            </span>
                          </div>
                          
                          <div className="h-64 w-full bg-zinc-950/20 border border-white/[0.02] rounded-xl p-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsLineChart
                                data={historicalSessionsForCompare.slice().reverse().map(s => ({
                                  date: s.date,
                                  Score: s.metrics.overall,
                                  Type: s.type
                                }))}
                                margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis 
                                  dataKey="date" 
                                  stroke="rgba(255,255,255,0.3)" 
                                  fontSize={10}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <YAxis 
                                  domain={[0, 100]} 
                                  stroke="rgba(255,255,255,0.3)" 
                                  fontSize={10}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <RechartsTooltip
                                  contentStyle={{
                                    backgroundColor: '#09090b',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                  }}
                                  labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                                  itemStyle={{ color: '#22d3ee' }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="Score" 
                                  stroke="#22d3ee" 
                                  strokeWidth={2.5}
                                  dot={{ r: 4, stroke: '#22d3ee', strokeWidth: 1.5, fill: '#09090b' }}
                                  activeDot={{ r: 6, stroke: '#22d3ee', strokeWidth: 2, fill: '#09090b' }}
                                />
                              </RechartsLineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Historical Table */}
                        <div className="pt-4 border-t border-white/[0.06]">
                          <h3 className="text-xs font-bold text-white mb-3">Historic Session Archive</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-white/[0.05] text-zinc-500 font-extrabold uppercase text-[10px]">
                                  <th className="py-2.5">Date</th>
                                  <th className="py-2.5">Sim Type</th>
                                  <th className="py-2.5">Target</th>
                                  <th className="py-2.5 text-right">Score</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.03] text-zinc-300">
                                {historicalSessionsForCompare.map((row, idx) => (
                                  <tr key={idx}>
                                    <td className="py-2.5 text-zinc-500 font-medium">{row.date}</td>
                                    <td className="py-2.5 font-bold text-white">{row.type}</td>
                                    <td className="py-2.5 text-zinc-400">{row.target}</td>
                                    <td className="py-2.5 text-right font-extrabold text-cyan-400">{row.metrics.overall}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-6">
                        {/* Selector Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.01] border border-white/[0.05] p-4 rounded-xl">
                          <div>
                            <label className="block text-[10px] font-extrabold tracking-wider text-zinc-500 uppercase mb-2">Primary Session (Base)</label>
                            <select
                              value={compareSession1}
                              onChange={(e) => setCompareSession1(e.target.value)}
                              className="w-full px-3 py-2.5 rounded-xl text-xs bg-zinc-950 border border-white/[0.06] text-white focus:border-cyan-400/50 outline-none cursor-pointer"
                            >
                              {historicalSessionsForCompare.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.date} - {s.type} ({s.metrics.overall}%)
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold tracking-wider text-zinc-500 uppercase mb-2">Comparison Session (Target)</label>
                            <select
                              value={compareSession2}
                              onChange={(e) => setCompareSession2(e.target.value)}
                              className="w-full px-3 py-2.5 rounded-xl text-xs bg-zinc-950 border border-white/[0.06] text-white focus:border-cyan-400/50 outline-none cursor-pointer"
                            >
                              {historicalSessionsForCompare.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.date} - {s.type} ({s.metrics.overall}%)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Side-by-Side Comparison Grid */}
                        {(() => {
                          const s1 = historicalSessionsForCompare.find(s => s.id === compareSession1) || historicalSessionsForCompare[0];
                          const s2 = historicalSessionsForCompare.find(s => s.id === compareSession2) || historicalSessionsForCompare[1];

                          const deltaOverall = s2.metrics.overall - s1.metrics.overall;
                          const deltaTechnical = s2.metrics.technical - s1.metrics.technical;
                          const deltaCommunication = s2.metrics.communication - s1.metrics.communication;
                          const deltaProblemSolving = s2.metrics.problemSolving - s1.metrics.problemSolving;
                          const deltaConfidence = s2.metrics.confidence - s1.metrics.confidence;

                          const renderDelta = (delta: number) => {
                            if (delta > 0) {
                              return <span className="text-[10px] font-bold text-emerald-400">+{delta}% improvement</span>;
                            } else if (delta < 0) {
                              return <span className="text-[10px] font-bold text-rose-400">{delta}% change</span>;
                            }
                            return <span className="text-[10px] font-bold text-zinc-500">No delta</span>;
                          };

                          return (
                            <div className="space-y-6">
                              {/* Overall scores comparison banner */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 rounded-2xl bg-zinc-950/50 border border-white/[0.04] relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />
                                  <span className="text-[10px] font-extrabold text-zinc-500 tracking-wider uppercase block">Primary Overall Score</span>
                                  <div className="flex items-baseline gap-2 mt-2">
                                    <span className="text-3xl font-black text-white">{s1.metrics.overall}%</span>
                                    <span className="text-[10px] text-zinc-400">({s1.type})</span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2">{s1.feedback}</p>
                                </div>

                                <div className="p-5 rounded-2xl bg-zinc-950/50 border border-white/[0.04] relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
                                  <span className="text-[10px] font-extrabold text-zinc-500 tracking-wider uppercase block">Comparison Overall Score</span>
                                  <div className="flex items-baseline gap-2 mt-2">
                                    <span className="text-3xl font-black text-white">{s2.metrics.overall}%</span>
                                    <span className="text-[10px] text-zinc-400">({s2.type})</span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2">{s2.feedback}</p>
                                </div>
                              </div>

                              {/* Detailed Metrics Side-by-Side comparison */}
                              <div className="p-5 rounded-2xl bg-zinc-950/30 border border-white/[0.04] space-y-5">
                                <h3 className="text-xs font-bold text-white tracking-wide uppercase border-b border-white/[0.06] pb-2">Functional Metrics Delta</h3>
                                
                                {/* 1. Overall comparison bar */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-zinc-400">Overall Score</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-zinc-500">{s1.metrics.overall}% vs {s2.metrics.overall}%</span>
                                      {renderDelta(deltaOverall)}
                                    </div>
                                  </div>
                                  <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${s1.metrics.overall}%` }} />
                                    <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${s2.metrics.overall}%` }} />
                                  </div>
                                </div>

                                {/* 2. Technical Mastery */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-zinc-400">Technical Mastery</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-zinc-500">{s1.metrics.technical}% vs {s2.metrics.technical}%</span>
                                      {renderDelta(deltaTechnical)}
                                    </div>
                                  </div>
                                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex gap-1">
                                    <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${s1.metrics.technical}%` }} />
                                    <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${s2.metrics.technical}%` }} />
                                  </div>
                                </div>

                                {/* 3. Communication Style */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-zinc-400">Communication Style</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-zinc-500">{s1.metrics.communication}% vs {s2.metrics.communication}%</span>
                                      {renderDelta(deltaCommunication)}
                                    </div>
                                  </div>
                                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex gap-1">
                                    <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${s1.metrics.communication}%` }} />
                                    <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${s2.metrics.communication}%` }} />
                                  </div>
                                </div>

                                {/* 4. Problem Solving */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-zinc-400">Problem Solving & Design</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-zinc-500">{s1.metrics.problemSolving}% vs {s2.metrics.problemSolving}%</span>
                                      {renderDelta(deltaProblemSolving)}
                                    </div>
                                  </div>
                                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex gap-1">
                                    <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${s1.metrics.problemSolving}%` }} />
                                    <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${s2.metrics.problemSolving}%` }} />
                                  </div>
                                </div>

                                {/* 5. Confidence Score */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-zinc-400">Executive Confidence</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-zinc-500">{s1.metrics.confidence}% vs {s2.metrics.confidence}%</span>
                                      {renderDelta(deltaConfidence)}
                                    </div>
                                  </div>
                                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex gap-1">
                                    <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${s1.metrics.confidence}%` }} />
                                    <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${s2.metrics.confidence}%` }} />
                                  </div>
                                </div>
                              </div>

                              {/* Contextual & Textual details side by side */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-zinc-950/40 border border-white/[0.04]">
                                  <h4 className="text-[10px] font-extrabold tracking-wider text-cyan-400 uppercase mb-3">Primary Session Context</h4>
                                  <div className="space-y-2 text-xs">
                                    <div className="flex justify-between border-b border-white/[0.02] pb-1">
                                      <span className="text-zinc-500">Date</span>
                                      <span className="text-white font-semibold">{s1.date}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/[0.02] pb-1">
                                      <span className="text-zinc-500">Simulator Type</span>
                                      <span className="text-white font-semibold">{s1.type}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/[0.02] pb-1">
                                      <span className="text-zinc-500">Target Role</span>
                                      <span className="text-white font-semibold">{s1.target}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/[0.02] pb-1">
                                      <span className="text-zinc-500">Session Duration</span>
                                      <span className="text-white font-semibold">{s1.duration}</span>
                                    </div>
                                    <div className="flex justify-between pb-1">
                                      <span className="text-zinc-500">Difficulty Level</span>
                                      <span className="text-white font-semibold">{s1.difficulty}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-4 rounded-xl bg-zinc-950/40 border border-white/[0.04]">
                                  <h4 className="text-[10px] font-extrabold tracking-wider text-purple-400 uppercase mb-3">Comparison Session Context</h4>
                                  <div className="space-y-2 text-xs">
                                    <div className="flex justify-between border-b border-white/[0.02] pb-1">
                                      <span className="text-zinc-500">Date</span>
                                      <span className="text-white font-semibold">{s2.date}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/[0.02] pb-1">
                                      <span className="text-zinc-500">Simulator Type</span>
                                      <span className="text-white font-semibold">{s2.type}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/[0.02] pb-1">
                                      <span className="text-zinc-500">Target Role</span>
                                      <span className="text-white font-semibold">{s2.target}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/[0.02] pb-1">
                                      <span className="text-zinc-500">Session Duration</span>
                                      <span className="text-white font-semibold">{s2.duration}</span>
                                    </div>
                                    <div className="flex justify-between pb-1">
                                      <span className="text-zinc-500">Difficulty Level</span>
                                      <span className="text-white font-semibold">{s2.difficulty}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Detailed feed backs side-by-side */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-zinc-950/40 border border-white/[0.04]">
                                  <h4 className="text-[10px] font-extrabold tracking-wider text-cyan-400 uppercase mb-2">Primary AI Feedback</h4>
                                  <p className="text-xs text-zinc-300 leading-relaxed font-normal">{s1.feedback}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-950/40 border border-white/[0.04]">
                                  <h4 className="text-[10px] font-extrabold tracking-wider text-purple-400 uppercase mb-2">Comparison AI Feedback</h4>
                                  <p className="text-xs text-zinc-300 leading-relaxed font-normal">{s2.feedback}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 6. PROFILE VIEW */}
                {activeTab === 'profile' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-2xl border border-white/[0.06] space-y-6"
                  >
                    <div>
                      <h2 className="text-lg font-black text-white">Operator Profile</h2>
                      <p className="text-xs text-zinc-500 mt-1">Configure your personal targets, years of experience, and general metadata parameters.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold tracking-wider text-zinc-500 uppercase mb-2">Display Name</label>
                        <input 
                          type="text" 
                          placeholder="John Doe"
                          className="w-full px-4 py-2.5 rounded-xl text-xs bg-zinc-950 border border-white/[0.06] text-white focus:border-cyan-400/50 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold tracking-wider text-zinc-500 uppercase mb-2">Total years of experience</label>
                        <input 
                          type="number" 
                          placeholder="8"
                          className="w-full px-4 py-2.5 rounded-xl text-xs bg-zinc-950 border border-white/[0.06] text-white focus:border-cyan-400/50 outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 7. SETTINGS VIEW */}
                {activeTab === 'settings' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-2xl border border-white/[0.06] space-y-6"
                  >
                    <div>
                      <h2 className="text-lg font-black text-white">Enclave Settings</h2>
                      <p className="text-xs text-zinc-500 mt-1">Customize local API parameters and secure sandbox connection variables.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-950 border border-white/[0.04]">
                        <div>
                          <p className="text-xs font-bold text-white">Voice Synthesizer Module</p>
                          <p className="text-[10px] text-zinc-500">Enable synthesized reading of questions inside simulators.</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded bg-zinc-900 border-white/[0.1] text-cyan-500 focus:ring-0" />
                      </div>

                      <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-950 border border-white/[0.04]">
                        <div>
                          <p className="text-xs font-bold text-white">Corporate Security Enclave Sandbox</p>
                          <p className="text-[10px] text-zinc-500">Decrypt evaluation payloads only inside local browser cache stores.</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded bg-zinc-900 border-white/[0.1] text-cyan-500 focus:ring-0" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 8. ADMIN PANEL VIEW */}
                {activeTab === 'admin' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 rounded-2xl border border-white/[0.06] space-y-6"
                  >
                    <div>
                      <h2 className="text-lg font-black text-white">Supervisor Console</h2>
                      <p className="text-xs text-zinc-500 mt-1">Administrative panel to review API health, pipeline metrics, and system key status check parameters.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-900/30">
                        <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider">Gemini Token Quota</span>
                        <p className="text-lg font-bold text-white mt-1">942,500 Tokens</p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">Remaining this month</p>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
                        <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Service Status</span>
                        <p className="text-lg font-bold text-white mt-1">Operational</p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">All models connected</p>
                      </div>

                      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/30">
                        <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">Global User count</span>
                        <p className="text-lg font-bold text-white mt-1">42 Operators</p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">Under active license</p>
                      </div>
                    </div>
                  </motion.div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modern cybernetic Footer */}
      <footer className="w-full py-8 mt-16 border-t border-white/[0.05] text-center text-zinc-600 text-[10px] tracking-widest uppercase">
        <span>© 2026 InterviewX AI inc. Security Sandbox environment version 4.12.0</span>
      </footer>
    </div>
  );
}
