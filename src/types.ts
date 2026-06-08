export interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Resume {
  id: string;
  name: string;
  uploadedAt: string;
  fileSize: string;
}

export interface KeywordOptimizationItem {
  keyword: string;
  frequency: number;
  status: "Good" | "Missing" | "Optimize" | string;
  recommendation: string;
}

export interface GrammarIssueItem {
  original: string;
  correction: string;
  explanation: string;
}

export interface AnalysisData {
  overall_score: number;
  ats_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  keyword_optimization: KeywordOptimizationItem[];
  grammar_issues: GrammarIssueItem[];
  recommendations: string[];
}

export interface HistoricalAnalysis {
  id: string;
  resumeName: string;
  overallScore: number;
  atsScore: number;
  createdAt: string;
  analysis: AnalysisData;
}

export interface JobMatchData {
  match_percentage: number;
  missing_skills: string[];
  recommended_improvements: string[];
  recruiter_readiness_score: number;
  recruiter_feedback: string;
}

export interface CoverLetterData {
  subject: string;
  salutation: string;
  body: string[];
  sign_off: string;
}

export interface ResumeBuilderData {
  summary: string;
  experience: {
    company: string;
    role: string;
    duration: string;
    bullet_points: string[];
  }[];
  skills: string[];
  education: {
    institution: string;
    degree: string;
    year: string;
  }[];
}

export type SubscriptionPlan = "Free" | "Pro";
export interface Subscription {
  plan: SubscriptionPlan;
  status: "Active" | "Expired" | "None";
  expiryDate?: string;
}

export interface CareerRoadmapData {
  timeline: {
    plan_30_day: string[];
    plan_90_day: string[];
    plan_180_day: string[];
  };
  recommendations: {
    projects: {
      name: string;
      description: string;
    }[];
    courses: {
      name: string;
      platform: string;
    }[];
    resources: string[];
  };
}

