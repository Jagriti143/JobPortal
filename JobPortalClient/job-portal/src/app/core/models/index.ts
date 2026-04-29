// Core Models for all Microservices

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  traceId?: string;
  pagination?: { page: number; limit: number; total?: number; };
}

// ------------------------------------
// 1. Authentication & Identity
// ------------------------------------
export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; role: 'JobSeeker' | 'Recruiter'; }
export interface AuthResponse { accessToken: string; refreshToken: string; expiresIn: number; }
export interface UserProfile { id: string; email: string; role: 'JobSeeker' | 'Recruiter' | 'Admin'; displayName?: string; emailVerified: boolean; }

// ------------------------------------
// 2. Jobs & Companies (JobCatalogService)
// ------------------------------------
export interface Job {
  id: string; companyId: string; postedByRecruiterId: string;
  title: string; description: string; location: string; jobType: string;
  salaryMin?: number; salaryMax?: number; moderationStatus: string;
  createdAt: string; updatedAt: string; company?: Company;
}
export interface Company {
  id: string; name: string; description?: string; website?: string;
  logoUrl?: string; industry?: string; location?: string; createdAt: string;
}
export interface JobSearchParams { q?: string; location?: string; jobType?: string; salaryMin?: number; salaryMax?: number; page?: number; limit?: number; }

// ------------------------------------
// 3. Applications
// ------------------------------------
export type AppStatus = 'Submitted' | 'Reviewed' | 'Shortlisted' | 'Rejected' | 'Withdrawn';
export interface Application { id: string; jobSeekerId: string; jobId: string; status: AppStatus; coverLetter?: string; appliedAt: string; updatedAt: string; job?: Job; }

// ------------------------------------
// 4. Resumes
// ------------------------------------
export interface EducationDto { institution: string; degree: string; fieldOfStudy?: string; startDate: string; endDate?: string; }
export interface ExperienceDto { company: string; jobTitle: string; description?: string; startDate: string; endDate?: string; isCurrentRole: boolean; }
export interface SkillDto { name: string; level?: string; }
export interface ProjectDto { name: string; description?: string; url?: string; }
export interface Resume { id: string; ownerId: string; title: string; summary?: string; templateId?: string; certifications?: string; createdAt: string; updatedAt: string; educations: EducationDto[]; experiences: ExperienceDto[]; skills: SkillDto[]; projects: ProjectDto[]; }

// ------------------------------------
// 5. Payment & Wallet
// ------------------------------------
export interface Wallet { id: string; recruiterId: string; balance: number; createdAt: string; updatedAt: string; }
export interface PaymentIntent { clientSecret: string; transactionId: string; amount: number; }
export interface Transaction { id: string; type: string; points: number; description?: string; amountPaid?: number; currency?: string; createdAt: string; }
