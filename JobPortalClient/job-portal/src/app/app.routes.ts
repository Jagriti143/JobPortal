import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'auth/login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'auth/forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'auth/verify-email', loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent) },
  { path: 'jobs', loadComponent: () => import('./features/jobs/job-list/job-list.component').then(m => m.JobListComponent) },
  { path: 'jobs/:id', loadComponent: () => import('./features/jobs/job-detail/job-detail.component').then(m => m.JobDetailComponent) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },

  // Seeker
  { path: 'seeker/dashboard', canActivate: [authGuard, roleGuard('JobSeeker')], loadComponent: () => import('./features/seeker/dashboard/seeker-dashboard.component').then(m => m.SeekerDashboardComponent) },
  { path: 'seeker/resumes', canActivate: [authGuard, roleGuard('JobSeeker')], loadComponent: () => import('./features/seeker/resumes/seeker-resumes.component').then(m => m.SeekerResumesComponent) },
  { path: 'seeker/resumes/new', canActivate: [authGuard, roleGuard('JobSeeker')], loadComponent: () => import('./features/seeker/resumes/resume-form.component').then(m => m.ResumeFormComponent) },
  { path: 'seeker/resumes/:id/edit', canActivate: [authGuard, roleGuard('JobSeeker')], loadComponent: () => import('./features/seeker/resumes/resume-form.component').then(m => m.ResumeFormComponent) },

  // Recruiter
  { path: 'recruiter/dashboard', canActivate: [authGuard, roleGuard('Recruiter')], loadComponent: () => import('./features/recruiter/dashboard/recruiter-dashboard.component').then(m => m.RecruiterDashboardComponent) },
  { path: 'recruiter/jobs/new', canActivate: [authGuard, roleGuard('Recruiter', 'Admin')], loadComponent: () => import('./features/recruiter/jobs/post-job.component').then(m => m.PostJobComponent) },
  { path: 'recruiter/jobs/:jobId/applicants', canActivate: [authGuard, roleGuard('Recruiter')], loadComponent: () => import('./features/recruiter/applicants/job-applicants.component').then(m => m.JobApplicantsComponent) },
  { path: 'recruiter/wallet', canActivate: [authGuard, roleGuard('Recruiter')], loadComponent: () => import('./features/recruiter/wallet/wallet.component').then(m => m.RecruiterWalletComponent) },

  // Admin
  { path: 'admin/dashboard', canActivate: [authGuard, roleGuard('Admin')], loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },

  // Fallback
  { path: '**', redirectTo: '' }
];
