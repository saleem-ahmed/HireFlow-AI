export type Role = "Owner" | "Admin" | "Recruiter" | "Hiring Manager";

export type ApplicationStatus =
  | "Received"
  | "Processing"
  | "Under Review"
  | "Shortlisted"
  | "Interview"
  | "On Hold"
  | "Rejected"
  | "Hired"
  | "Withdrawn";

export type DocumentStatus =
  | "Uploaded"
  | "Pending"
  | "Processing"
  | "Completed"
  | "Failed"
  | "Quarantined"
  | "Requires Manual Review";

export type EvidenceStatus = "Evidenced" | "Partially Evidenced" | "Not Found" | "Unclear";

export interface CriteriaAssessment {
  requirement_id?: string;
  title: string;
  category: "Essential" | "Preferred";
  status: EvidenceStatus;
  explanation: string;
  cv_excerpt?: string;
  page_number?: number;
}

export interface MatchAssessment {
  id: string;
  application_id: string;
  job_id: string;
  model_name: string;
  overall_fit_summary?: string;
  essential_requirements_met?: string;
  preferred_requirements_met?: string;
  criteria_assessments: CriteriaAssessment[];
  recruiter_overrides?: Record<string, any>;
  is_reviewed_by_recruiter: string;
  created_at: string;
}

export interface RecruiterSummary {
  id: string;
  application_id: string;
  candidate_overview: string;
  key_strengths: string[];
  potential_gaps: string[];
  suggested_interview_questions: string[];
  recruiter_edited_summary?: string;
  is_edited_by_recruiter: string;
  model_name: string;
  created_at: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: string;
  description?: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  field_of_study?: string;
  start_year?: string;
  end_year?: string;
}

export interface SkillItem {
  skill_name: string;
  years_experience?: number;
  source_evidence?: string;
}

export interface Candidate {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  professional_summary?: string;
  experiences: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  created_at: string;
}

export interface DocumentItem {
  id: string;
  file_name: string;
  file_type: string;
  mime_type: string;
  file_size_bytes: number;
  status: DocumentStatus;
  storage_provider: string;
  created_at: string;
}

export interface RecruiterNote {
  id: string;
  application_id: string;
  author_id?: string;
  author_name?: string;
  content: string;
  created_at: string;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  event_type: string;
  details?: string;
  created_at: string;
}

export interface Application {
  id: string;
  organization_id: string;
  job_id?: string;
  job_title?: string;
  candidate_id: string;
  status: ApplicationStatus;
  source: string;
  cover_letter?: string;
  assigned_recruiter_id?: string;
  assigned_recruiter_name?: string;
  created_at: string;
  candidate?: Candidate;
  documents: DocumentItem[];
  notes: RecruiterNote[];
  events: ApplicationEvent[];
  latest_assessment?: MatchAssessment;
  latest_summary?: RecruiterSummary;
}

export interface JobRequirement {
  id: string;
  job_id: string;
  title: string;
  description?: string;
  category: "Essential" | "Preferred";
}

export interface Job {
  id: string;
  organization_id: string;
  title: string;
  department?: string;
  location?: string;
  employment_type?: string;
  description: string;
  responsibilities?: string;
  qualifications?: string;
  experience_level?: string;
  status: "Draft" | "Published" | "Paused" | "Closed" | "Archived";
  created_at: string;
  requirements: JobRequirement[];
  application_count: number;
}

