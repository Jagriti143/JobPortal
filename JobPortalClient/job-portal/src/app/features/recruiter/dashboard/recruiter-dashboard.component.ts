import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { JobService } from '../../../core/services/job.service';
import { ApplicationService } from '../../../core/services/application.service';
import { WalletService } from '../../../core/services/wallet.service';
import { ResumeService } from '../../../core/services/resume.service';
import { AuthService } from '../../../core/services/auth.service';
import { Company } from '../../../core/models/index';

@Component({
  selector: 'app-recruiter-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule],  template: `
    <div class="recruiter-layout">

      <!-- Sidebar -->
      <aside class="recruiter-sidebar">
        <div class="sidebar-brand">
          <mat-icon>business_center</mat-icon>
          <span>Recruiter Portal</span>
        </div>
        <nav>
          <button class="sidebar-item" [class.active]="tab() === 'jobs'" (click)="tab.set('jobs')">
            <mat-icon>work</mat-icon> My Jobs
          </button>
          <button class="sidebar-item" [class.active]="tab() === 'applicants'" (click)="tab.set('applicants'); loadAllApplicants()">
            <mat-icon>people</mat-icon> All Applicants
            <span class="badge" *ngIf="totalApplicants > 0">{{ totalApplicants }}</span>
          </button>
          <button class="sidebar-item" [class.active]="tab() === 'company'" (click)="tab.set('company'); loadCompany()">
            <mat-icon>business</mat-icon> My Company
          </button>
          <a class="sidebar-item" routerLink="/recruiter/wallet">
            <mat-icon>account_balance_wallet</mat-icon> Wallet
          </a>
          <a class="sidebar-item" routerLink="/recruiter/jobs/new">
            <mat-icon>add_circle</mat-icon> Post New Job
          </a>
        </nav>
      </aside>

      <!-- Main -->
      <main class="recruiter-main">

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon jobs-icon"><mat-icon>work</mat-icon></div>
            <div class="stat-value">{{ jobs.length }}</div>
            <div class="stat-label">Total Jobs Posted</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon approved-icon"><mat-icon>check_circle</mat-icon></div>
            <div class="stat-value">{{ approvedJobs }}</div>
            <div class="stat-label">Live / Approved</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon pending-icon"><mat-icon>pending</mat-icon></div>
            <div class="stat-value">{{ pendingJobs }}</div>
            <div class="stat-label">Pending Review</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon applicants-icon"><mat-icon>people</mat-icon></div>
            <div class="stat-value">{{ totalApplicants }}</div>
            <div class="stat-label">Total Applicants</div>
          </div>
        </div>

        <!-- â”€â”€ MY JOBS TAB â”€â”€ -->
        <div *ngIf="tab() === 'jobs'">
          <div class="section-header">
            <h2><mat-icon>work</mat-icon> My Job Listings</h2>
            <a mat-raised-button color="primary" routerLink="/recruiter/jobs/new">
              <mat-icon>add</mat-icon> Post New Job
            </a>
          </div>

          <div *ngIf="loadingJobs" class="loading-center"><mat-spinner diameter="36"></mat-spinner></div>

          <div *ngIf="!loadingJobs && jobs.length === 0" class="empty-state">
            <div class="empty-icon"><mat-icon>work_off</mat-icon></div>
            <h3>No jobs posted yet</h3>
            <p>Post your first job to start receiving applications</p>
            <a mat-raised-button color="primary" routerLink="/recruiter/jobs/new">
              <mat-icon>add</mat-icon> Post a Job
            </a>
          </div>

          <div class="jobs-list" *ngIf="!loadingJobs && jobs.length > 0">
            <div *ngFor="let job of jobs" class="job-card">
              <div class="job-card-left">
                <div class="job-icon">{{ job.title?.charAt(0) ?? 'J' }}</div>
                <div class="job-info">
                  <h3>{{ job.title }}</h3>
                  <div class="job-meta">
                    <span><mat-icon>location_on</mat-icon>{{ job.location }}</span>
                    <span><mat-icon>work</mat-icon>{{ job.jobType }}</span>
                    <span *ngIf="job.salaryMin"><mat-icon>payments</mat-icon>â‚¹{{ job.salaryMin | number }} â€“ â‚¹{{ job.salaryMax | number }}</span>
                    <span><mat-icon>schedule</mat-icon>{{ job.createdAt | date:'mediumDate' }}</span>
                  </div>
                </div>
              </div>
              <div class="job-card-right">
                <span class="status-chip" [class]="'status-' + job.moderationStatus?.toLowerCase()">
                  {{ job.moderationStatus }}
                </span>
                <button mat-stroked-button color="primary"
                  (click)="viewApplicants(job)"
                  [disabled]="job.moderationStatus !== 'Approved'">
                  <mat-icon>people</mat-icon>
                  View Applicants
                  <span class="applicant-count" *ngIf="applicantCounts[job.id] !== undefined">
                    ({{ applicantCounts[job.id] }})
                  </span>
                </button>
                <button mat-stroked-button class="edit-job-btn" title="Edit job listing"
                  (click)="editJob(job)">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
                <button mat-icon-button color="warn" title="Delete job listing"
                  (click)="deleteJob(job)" [disabled]="job._deleting">
                  <mat-spinner diameter="18" *ngIf="job._deleting"></mat-spinner>
                  <mat-icon *ngIf="!job._deleting">delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- COMPANY TAB -->
        <div *ngIf="tab() === 'company'">
          <div class="section-header">
            <h2><mat-icon>business</mat-icon> My Company</h2>
            <button mat-stroked-button *ngIf="company && !editMode()" (click)="startEdit()">
              <mat-icon>edit</mat-icon> Edit Details
            </button>
          </div>

          <div *ngIf="loadingCompany" class="loading-center"><mat-spinner diameter="36"></mat-spinner></div>

          <div *ngIf="!loadingCompany && companyError" class="no-company-card">
            <mat-icon style="font-size:48px;width:48px;height:48px;color:#f87171;display:block;margin:0 auto 12px">business_off</mat-icon>
            <h3>No Company Found</h3>
            <p>Company details are registered once during account creation. Please contact support if you believe this is an error.</p>
          </div>

          <!-- VIEW MODE -->
          <div *ngIf="!loadingCompany && company && !editMode()" class="company-detail-card">
            <div class="company-detail-header">
              <div class="company-logo-box" *ngIf="!company?.logoUrl"><mat-icon>business</mat-icon></div>
              <img *ngIf="company?.logoUrl" [src]="company!.logoUrl" [alt]="company!.name" class="company-logo-img">
              <div class="company-detail-info">
                <h3>{{ company!.name }}</h3>
                <div class="company-meta-row">
                  <span *ngIf="company!.industry"><mat-icon>category</mat-icon>{{ company!.industry }}</span>
                  <span *ngIf="company!.location"><mat-icon>location_on</mat-icon>{{ company!.location }}</span>
                  <a *ngIf="company!.website" [href]="company!.website" target="_blank" class="company-link">
                    <mat-icon>language</mat-icon>{{ company!.website }}
                  </a>
                </div>
              </div>
              <div class="verified-badge"><mat-icon>verified</mat-icon> Verified</div>
            </div>
            <div *ngIf="company!.description" class="company-desc">{{ company!.description }}</div>
          </div>

          <!-- EDIT MODE -->
          <div *ngIf="!loadingCompany && company && editMode()" class="company-detail-card">
            <form [formGroup]="editForm" (ngSubmit)="saveCompany()" class="company-edit-form">
              <div class="edit-form-grid">

                <div class="edit-field">
                  <label class="edit-label">Company Name <span class="req">*</span></label>
                  <div class="edit-input-wrap" [class.err]="editForm.get('name')?.invalid && editForm.get('name')?.touched">
                    <mat-icon>apartment</mat-icon>
                    <input type="text" formControlName="name" placeholder="e.g. Acme Corp">
                  </div>
                  <span class="edit-error" *ngIf="editForm.get('name')?.hasError('required') && editForm.get('name')?.touched">Name is required</span>
                </div>

                <div class="edit-field">
                  <label class="edit-label">Industry</label>
                  <div class="edit-input-wrap">
                    <mat-icon>category</mat-icon>
                    <input type="text" formControlName="industry" placeholder="e.g. Technology">
                  </div>
                </div>

                <div class="edit-field">
                  <label class="edit-label">Location</label>
                  <div class="edit-input-wrap">
                    <mat-icon>location_on</mat-icon>
                    <input type="text" formControlName="location" placeholder="e.g. Bangalore">
                  </div>
                </div>

                <div class="edit-field">
                  <label class="edit-label">Website</label>
                  <div class="edit-input-wrap">
                    <mat-icon>language</mat-icon>
                    <input type="url" formControlName="website" placeholder="https://...">
                  </div>
                </div>

                <div class="edit-field edit-field-full">
                  <label class="edit-label">Logo URL</label>
                  <div class="edit-input-wrap">
                    <mat-icon>image</mat-icon>
                    <input type="url" formControlName="logoUrl" placeholder="https://...">
                  </div>
                </div>

                <div class="edit-field edit-field-full">
                  <label class="edit-label">Description</label>
                  <div class="edit-input-wrap edit-textarea-wrap">
                    <mat-icon style="margin-top:13px">description</mat-icon>
                    <textarea formControlName="description" rows="4" placeholder="Brief company description..."></textarea>
                  </div>
                </div>

              </div>

              <div class="edit-actions">
                <button type="button" mat-stroked-button (click)="cancelEdit()" [disabled]="savingCompany">
                  <mat-icon>close</mat-icon> Cancel
                </button>
                <button type="submit" mat-raised-button color="primary"
                  [disabled]="editForm.invalid || savingCompany">
                  <mat-spinner diameter="16" *ngIf="savingCompany"></mat-spinner>
                  <mat-icon *ngIf="!savingCompany">save</mat-icon>
                  {{ savingCompany ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- ——— APPLICANTS TAB ——— -->
        <div *ngIf="tab() === 'applicants'">
          <div class="section-header">
            <h2><mat-icon>people</mat-icon> Applicants</h2>
            <div class="filter-row">
              <button mat-stroked-button [class.active-filter]="statusFilter === ''" (click)="statusFilter = ''; filterApplicants()">All</button>
              <button mat-stroked-button [class.active-filter]="statusFilter === 'Submitted'" (click)="statusFilter = 'Submitted'; filterApplicants()">New</button>
              <button mat-stroked-button [class.active-filter]="statusFilter === 'Shortlisted'" (click)="statusFilter = 'Shortlisted'; filterApplicants()">Shortlisted</button>
              <button mat-stroked-button [class.active-filter]="statusFilter === 'Rejected'" (click)="statusFilter = 'Rejected'; filterApplicants()">Rejected</button>
            </div>
          </div>

          <!-- Wallet balance + cost legend -->
          <div class="applicants-toolbar">
            <div class="wallet-badge" *ngIf="walletBalance !== null">
              <mat-icon>account_balance_wallet</mat-icon> {{ walletBalance }} pts
            </div>
            <div class="cost-legend">
              <span><mat-icon>visibility</mat-icon> View = 5 pts</span>
              <span><mat-icon>download</mat-icon> PDF = 15 pts</span>
              <span><mat-icon>phone</mat-icon> Phone = 10 pts</span>
            </div>
          </div>

          <div *ngIf="loadingApplicants" class="loading-center"><mat-spinner diameter="36"></mat-spinner></div>

          <div *ngIf="!loadingApplicants && filteredApplicants.length === 0" class="empty-state">
            <div class="empty-icon"><mat-icon>inbox</mat-icon></div>
            <h3>No applicants yet</h3>
            <p>Applications will appear here once candidates apply to your jobs</p>
          </div>

          <div class="applicants-list" *ngIf="!loadingApplicants && filteredApplicants.length > 0">
            <div *ngFor="let app of filteredApplicants" class="applicant-card">
              <div class="applicant-avatar">{{ app.jobSeekerEmail?.charAt(0)?.toUpperCase() ?? 'A' }}</div>

              <div class="applicant-info">
                <div class="applicant-email fw-600">{{ app.jobSeekerEmail || 'Applicant #' + (app.jobSeekerId | slice:0:8) }}</div>
                <div class="applicant-meta text-muted text-sm">
                  <span>Applied {{ app.appliedAt | date:'mediumDate' }}</span>
                  <span *ngIf="app.jobTitle"> Â· {{ app.jobTitle }}</span>
                </div>
                <!-- Unlocked phone -->
                <div class="phone-unlocked" *ngIf="app._phoneUnlocked">
                  <mat-icon>phone</mat-icon> {{ app._phone }}
                </div>
                <!-- Cover letter -->
                <div class="cover-preview text-sm text-muted" *ngIf="app.coverLetter && app._showCover">
                  "{{ app.coverLetter }}"
                </div>
              </div>

              <div class="applicant-right">
                <span class="status-chip" [class]="'status-' + app.status?.toLowerCase()">{{ app.status }}</span>

                <div class="action-row">
                  <!-- View Resume (5 pts) â€” pay every time -->
                  <button mat-stroked-button class="act-btn view-btn"
                    [disabled]="app._loading || !app.resumeId"
                    [title]="app.resumeId ? 'View resume â€” 5 pts each time' : 'No resume attached'"
                    (click)="app.resumeId && viewResume(app)">
                    <mat-icon>visibility</mat-icon> View (5)
                  </button>

                  <!-- Download PDF (15 pts first time, free after) -->
                  <button mat-stroked-button class="act-btn dl-btn"
                    [disabled]="app._loading || !app.resumeId"
                    [title]="app.resumeId ? (app._pdfDownloaded ? 'Re-download free' : 'Download PDF â€” 15 pts') : 'No resume attached'"
                    (click)="app.resumeId && downloadResume(app)">
                    <mat-icon>download</mat-icon>
                    {{ app._pdfDownloaded ? 'PDF (Free)' : 'PDF (15)' }}
                  </button>

                  <!-- Unlock Phone (10 pts) -->
                  <button mat-stroked-button class="act-btn phone-btn"
                    *ngIf="!app._phoneUnlocked"
                    [disabled]="app._loading"
                    title="Unlock phone â€” 10 pts"
                    (click)="unlockPhone(app)">
                    <mat-icon>phone_locked</mat-icon> Phone (10)
                  </button>

                  <!-- Cover letter toggle -->
                  <button mat-icon-button *ngIf="app.coverLetter"
                    (click)="app._showCover = !app._showCover" title="Cover letter">
                    <mat-icon>{{ app._showCover ? 'expand_less' : 'notes' }}</mat-icon>
                  </button>

                  <!-- Shortlist -->
                  <button mat-icon-button color="primary" title="Shortlist"
                    *ngIf="app.status === 'Submitted' || app.status === 'Reviewed'"
                    (click)="shortlist(app)">
                    <mat-icon>star</mat-icon>
                  </button>

                  <!-- Reject -->
                  <button mat-icon-button color="warn" title="Reject"
                    *ngIf="app.status !== 'Rejected' && app.status !== 'Withdrawn'"
                    (click)="reject(app)">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  `,
  styles: [`
    .recruiter-layout { display:flex;min-height:calc(100vh - 70px) }
    .recruiter-sidebar { width:240px;min-width:240px;background:#1a2e12;color:white;display:flex;flex-direction:column }
    .sidebar-brand { display:flex;align-items:center;gap:10px;padding:20px;font-size:1rem;font-weight:700;border-bottom:1px solid rgba(255,255,255,.08) }
    .sidebar-brand mat-icon { color:#c5d8bc }
    .sidebar-item { display:flex;align-items:center;gap:10px;width:100%;padding:12px 20px;background:none;border:none;color:rgba(255,255,255,.55);font-size:.875rem;font-weight:500;cursor:pointer;text-align:left;text-decoration:none;transition:all .15s;position:relative }
    .sidebar-item mat-icon { font-size:18px;width:18px;height:18px }
    .sidebar-item:hover { background:rgba(255,255,255,.08);color:white;text-decoration:none }
    .sidebar-item.active { background:rgba(107,134,96,.2);color:#c5d8bc;border-right:3px solid #8a9e80 }
    .badge { margin-left:auto;background:#dc2626;color:white;border-radius:10px;padding:1px 7px;font-size:.7rem;font-weight:700 }
    .recruiter-main { flex:1;padding:28px 32px;background:#fafaf8;overflow-x:hidden }
    .stats-row { display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px }
    .stat-card { background:white;border-radius:12px;padding:20px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(26,46,18,.04);border:1px solid #e8ede4 }
    .stat-icon { width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
    .stat-icon mat-icon { font-size:22px;width:22px;height:22px }
    .jobs-icon { background:#f0f7ec;color:#6b8660 }
    .approved-icon { background:rgba(22,163,74,.08);color:#16a34a }
    .pending-icon { background:rgba(217,119,6,.08);color:#d97706 }
    .applicants-icon { background:rgba(45,74,34,.08);color:#2d4a22 }
    .stat-value { font-size:1.8rem;font-weight:800;color:#1a2e12;line-height:1;font-family:'DM Serif Display',serif }
    .stat-label { font-size:.75rem;color:#64748b;margin-top:2px }
    .section-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:20px }
    .section-header h2 { display:flex;align-items:center;gap:8px;font-size:1.2rem;font-weight:400;font-family:'DM Serif Display',serif;color:#1a2e12 }
    .section-header mat-icon { color:#6b8660 }
    .jobs-list { display:flex;flex-direction:column;gap:12px }
    .job-card { background:white;border-radius:12px;padding:18px 22px;box-shadow:0 1px 4px rgba(26,46,18,.04);display:flex;justify-content:space-between;align-items:center;gap:16px;border:1px solid #e8ede4;transition:box-shadow .2s }
    .job-card:hover { box-shadow:0 4px 12px rgba(26,46,18,.08) }
    .job-card-left { display:flex;align-items:center;gap:14px;flex:1 }
    .job-icon { width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#1a2e12,#6b8660);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.2rem;flex-shrink:0 }
    .job-info h3 { font-size:1rem;font-weight:700;margin-bottom:4px;color:#1a2e12 }
    .job-meta { display:flex;flex-wrap:wrap;gap:10px }
    .job-meta span { display:flex;align-items:center;gap:3px;font-size:.78rem;color:#64748b }
    .job-meta mat-icon { font-size:13px;width:13px;height:13px }
    .job-card-right { display:flex;align-items:center;gap:10px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end }
    .edit-job-btn { color:#6b8660!important;border-color:#6b8660!important;font-size:.78rem!important;height:34px!important }
    .applicant-count { font-weight:700 }
    .status-chip { padding:4px 12px;border-radius:20px;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.3px }
    .status-approved { background:rgba(22,163,74,.08);color:#16a34a }
    .status-pending { background:rgba(217,119,6,.08);color:#b45309 }
    .status-flagged { background:rgba(220,38,38,.06);color:#dc2626 }
    .status-submitted { background:rgba(107,134,96,.1);color:#6b8660 }
    .status-shortlisted { background:rgba(22,163,74,.08);color:#16a34a }
    .status-rejected { background:rgba(220,38,38,.06);color:#dc2626 }
    .status-reviewed { background:rgba(217,119,6,.08);color:#b45309 }
    .status-withdrawn { background:rgba(0,0,0,.04);color:#64748b }
    .filter-row { display:flex;gap:8px }
    .active-filter { background:#f0f7ec!important;color:#2d4a22!important;border-color:#6b8660!important }
    .applicants-list { display:flex;flex-direction:column;gap:10px }
    .applicant-card { background:white;border-radius:12px;padding:16px 20px;box-shadow:0 1px 4px rgba(26,46,18,.04);display:flex;align-items:flex-start;gap:14px;border:1px solid #e8ede4 }
    .applicant-avatar { width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#1a2e12,#6b8660);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0 }
    .applicant-info { flex:1 }
    .applicant-email { font-size:.9rem;margin-bottom:2px }
    .applicant-meta { display:flex;gap:8px }
    .applicant-right { display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0 }
    .action-row { display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end }
    .act-btn { font-size:.75rem!important;height:30px!important;border-radius:6px!important;padding:0 8px!important }
    .view-btn { color:#6b8660!important;border-color:#6b8660!important }
    .dl-btn { color:#7c3aed!important;border-color:#7c3aed!important }
    .phone-btn { color:#16a34a!important;border-color:#16a34a!important }
    .phone-unlocked { display:flex;align-items:center;gap:4px;color:#16a34a;font-size:.85rem;font-weight:600;margin-top:4px }
    .phone-unlocked mat-icon { font-size:14px;width:14px;height:14px }
    .cover-preview { margin-top:6px;background:#f0f7ec;border-radius:6px;padding:8px 10px;font-style:italic;border-left:3px solid #e8ede4 }
    .applicants-toolbar { display:flex;align-items:center;gap:16px;margin-bottom:16px;flex-wrap:wrap }
    .wallet-badge { display:flex;align-items:center;gap:5px;background:#f0f7ec;color:#2d4a22;padding:6px 14px;border-radius:20px;font-weight:700;font-size:.85rem;border:1px solid #e8ede4 }
    .wallet-badge mat-icon { font-size:16px;width:16px;height:16px }
    .cost-legend { display:flex;gap:14px;flex-wrap:wrap }
    .cost-legend span { display:flex;align-items:center;gap:4px;font-size:.78rem;color:#64748b;background:#fafaf8;padding:4px 10px;border-radius:6px;border:1px solid #e8ede4 }
    .cost-legend mat-icon { font-size:13px;width:13px;height:13px }
    .loading-center { display:flex;justify-content:center;padding:60px }
    .empty-state { text-align:center;padding:60px 24px }
    .empty-icon { width:72px;height:72px;border-radius:18px;background:#f0f7ec;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;border:1px solid #e8ede4 }
    .empty-icon mat-icon { font-size:36px;width:36px;height:36px;color:#6b8660 }
    .empty-state h3 { font-size:1.1rem;font-weight:400;margin-bottom:6px;font-family:'DM Serif Display',serif;color:#1a2e12 }
    .empty-state p { color:#64748b;margin-bottom:20px }
    .fw-600 { font-weight:600 }
    .text-muted { color:#64748b }
    .text-sm { font-size:.8rem }
    @media(max-width:900px){ .recruiter-sidebar{display:none} .stats-row{grid-template-columns:repeat(2,1fr)} .recruiter-main{padding:16px} .job-card{flex-direction:column;align-items:flex-start} }
    .company-detail-card { background:white;border-radius:14px;padding:24px;border:1px solid #e8ede4;box-shadow:0 1px 4px rgba(26,46,18,.04) }
    .company-detail-header { display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;flex-wrap:wrap }
    .company-logo-box { width:64px;height:64px;border-radius:14px;background:linear-gradient(135deg,#1a2e12,#6b8660);color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
    .company-logo-box mat-icon { font-size:32px;width:32px;height:32px }
    .company-logo-img { width:64px;height:64px;border-radius:14px;object-fit:cover;flex-shrink:0 }
    .company-detail-info { flex:1 }
    .company-detail-info h3 { font-size:1.2rem;font-weight:700;color:#1a2e12;margin-bottom:8px }
    .company-meta-row { display:flex;flex-wrap:wrap;gap:12px }
    .company-meta-row span,.company-link { display:flex;align-items:center;gap:4px;font-size:.82rem;color:#4a6741 }
    .company-meta-row mat-icon,.company-link mat-icon { font-size:14px;width:14px;height:14px }
    .company-link { text-decoration:none } .company-link:hover { text-decoration:underline }
    .verified-badge { display:flex;align-items:center;gap:5px;background:#d1fae5;border:1px solid #6ee7b7;border-radius:20px;padding:5px 12px;font-size:.78rem;font-weight:700;color:#065f46;flex-shrink:0 }
    .verified-badge mat-icon { font-size:15px;width:15px;height:15px;color:#059669 }
    .company-desc { font-size:.88rem;color:#64748b;line-height:1.6;padding:12px 0;border-top:1px solid #f0f7ec;margin-top:4px }
    .company-readonly-note { display:flex;align-items:center;gap:6px;font-size:.78rem;color:#94a3b8;margin-top:14px;padding:10px 12px;background:#fafaf8;border-radius:8px;border:1px solid #e8ede4 }
    .company-readonly-note mat-icon { font-size:15px;width:15px;height:15px;color:#cbd5e1 }
    .no-company-card { text-align:center;background:#fff;border:1.5px solid #fecaca;border-radius:14px;padding:48px 32px }
    .no-company-card h3 { font-size:1.1rem;font-weight:700;color:#1a2e12;margin:12px 0 8px } .no-company-card p { color:#64748b }
    /* Edit form */
    .company-edit-form { display:flex;flex-direction:column;gap:20px }
    .edit-form-grid { display:grid;grid-template-columns:1fr 1fr;gap:16px }
    .edit-field-full { grid-column:1/-1 }
    .edit-label { display:block;font-size:.8rem;font-weight:600;color:#3d5a30;margin-bottom:6px }
    .req { color:#dc2626 }
    .edit-input-wrap { display:flex;align-items:center;border:1.5px solid #e8ede4;border-radius:10px;background:#f8faf6;transition:all .2s;overflow:hidden }
    .edit-textarea-wrap { align-items:flex-start }
    .edit-input-wrap:focus-within { border-color:#6b8660;background:#fff;box-shadow:0 0 0 3px rgba(107,134,96,.1) }
    .edit-input-wrap.err { border-color:#dc2626 }
    .edit-input-wrap mat-icon { font-size:17px;width:17px;height:17px;color:#8a9e80;padding:0 10px;flex-shrink:0 }
    .edit-input-wrap input,.edit-input-wrap textarea { flex:1;border:none;outline:none;background:transparent;font-size:.88rem;color:#1a2e12;padding:12px 10px 12px 0;font-family:'Inter',sans-serif }
    .edit-input-wrap textarea { resize:vertical;min-height:90px;padding-top:12px }
    .edit-error { display:block;font-size:.73rem;color:#dc2626;margin-top:3px }
    .edit-actions { display:flex;gap:10px;justify-content:flex-end;padding-top:8px;border-top:1px solid #f0f7ec }
    @media(max-width:700px){ .edit-form-grid{grid-template-columns:1fr} }
  `]
})
export class RecruiterDashboardComponent implements OnInit {
  private jobService    = inject(JobService);
  private appService    = inject(ApplicationService);
  private walletService = inject(WalletService);
  private resumeService = inject(ResumeService);
  private authService   = inject(AuthService);
  private fb            = inject(FormBuilder);
  private snack         = inject(MatSnackBar);
  private router        = inject(Router);

  // Company edit state
  editMode      = signal(false);
  savingCompany = false;
  editForm = this.fb.group({
    name:        ['', Validators.required],
    industry:    [''],
    location:    [''],
    website:     [''],
    logoUrl:     [''],
    description: ['']
  });

  startEdit(): void {
    if (!this.company) return;
    this.editForm.patchValue({
      name:        this.company.name        ?? '',
      industry:    this.company.industry    ?? '',
      location:    this.company.location    ?? '',
      website:     this.company.website     ?? '',
      logoUrl:     this.company.logoUrl     ?? '',
      description: this.company.description ?? ''
    });
    this.editMode.set(true);
  }

  cancelEdit(): void { this.editMode.set(false); }

  saveCompany(): void {
    if (this.editForm.invalid || !this.company) return;
    this.savingCompany = true;
    const v = this.editForm.value;
    this.jobService.updateMyCompany({
      name:        v.name        || undefined,
      industry:    v.industry    || undefined,
      location:    v.location    || undefined,
      website:     v.website     || undefined,
      logoUrl:     v.logoUrl     || undefined,
      description: v.description || undefined
    }).subscribe({
      next: res => {
        this.savingCompany = false;
        if (res.success && res.data) {
          this.company = res.data;
          this.editMode.set(false);
          this.snack.open('Company details updated successfully!', 'OK', { duration: 3500 });
        }
      },
      error: err => {
        this.savingCompany = false;
        this.snack.open(err.error?.message ?? 'Failed to update company.', 'Close', { duration: 4000 });
      }
    });
  }

  tab = signal<'jobs' | 'applicants' | 'company'>('jobs');

  // Company panel state
  company: Company | null = null;
  loadingCompany = false;
  companyError = false;
  private companyLoaded = false;

  jobs: any[] = [];
  allApplicants: any[] = [];
  filteredApplicants: any[] = [];
  applicantCounts: Record<string, number> = {};
  expandedApp: string | null = null;
  statusFilter = '';
  walletBalance: number | null = null;

  loadingJobs = false;
  loadingApplicants = false;

  get approvedJobs() { return this.jobs.filter(j => j.moderationStatus === 'Approved').length; }
  get pendingJobs()  { return this.jobs.filter(j => j.moderationStatus === 'Pending').length; }
  get totalApplicants() { return this.allApplicants.length; }

  ngOnInit(): void {
    // Load jobs directly via the authenticated endpoint — no companyId needed on the client.
    // GET /jobs/my resolves the recruiter from the JWT on the backend.
    this.loadJobs();
    this.walletService.getWalletBalance().subscribe({
      next: res => { this.walletBalance = res.data?.balance ?? 0; }
    });
  }

  /** Fetch company from backend — cached after first successful load. */
  loadCompany(): void {
    if (this.companyLoaded) return;
    this.loadingCompany = true;
    this.companyError = false;
    this.jobService.getMyCompany().subscribe({
      next: res => {
        this.loadingCompany = false;
        if (res.success && res.data) {
          this.company = res.data;
          this.companyLoaded = true;
        } else {
          this.companyError = true;
        }
      },
      error: () => {
        this.loadingCompany = false;
        this.companyError = true;
      }
    });
  }

  loadJobs(): void {
    // Uses GET /jobs/my — backend resolves recruiter identity from JWT.
    // Returns ALL jobs (Pending, Approved, Flagged) so the dashboard is always accurate.
    this.loadingJobs = true;
    this.jobService.getMyJobs().subscribe({
      next: res => {
        this.loadingJobs = false;
        this.jobs = res.data ?? [];
        // Load applicant counts for each approved job
        this.jobs.filter(j => j.moderationStatus === 'Approved').forEach(job => {
          this.appService.getJobApplicants(job.id).subscribe({
            next: r => { this.applicantCounts[job.id] = (r.data ?? []).length; }
          });
        });
      },
      error: () => { this.loadingJobs = false; }
    });
  }

  viewApplicants(job: any): void {
    this.tab.set('applicants');
    this.loadApplicantsForJob(job.id);
  }

  loadApplicantsForJob(jobId: string): void {
    this.loadingApplicants = true;
    this.appService.getJobApplicants(jobId).subscribe({
      next: res => {
        this.loadingApplicants = false;
        this.allApplicants = res.data ?? [];
        this.filterApplicants();
      },
      error: () => { this.loadingApplicants = false; }
    });
  }

  loadAllApplicants(): void {
    if (this.jobs.length === 0) return;
    this.loadingApplicants = true;
    this.allApplicants = [];

    const approvedJobs = this.jobs.filter(j => j.moderationStatus === 'Approved');
    if (approvedJobs.length === 0) { this.loadingApplicants = false; return; }

    let completed = 0;
    approvedJobs.forEach(job => {
      this.appService.getJobApplicants(job.id).subscribe({
        next: res => {
          const apps = (res.data ?? []).map((a: any) => ({ ...a, jobTitle: job.title }));
          this.allApplicants = [...this.allApplicants, ...apps];
          completed++;
          if (completed === approvedJobs.length) {
            this.loadingApplicants = false;
            this.filterApplicants();
            this.restoreUnlockState();
          }
        },
        error: () => {
          completed++;
          if (completed === approvedJobs.length) {
            this.loadingApplicants = false;
            this.filterApplicants();
          }
        }
      });
    });
  }

  restoreUnlockState(): void {
    const resumeIds = this.allApplicants
      .filter(a => a.resumeId)
      .map(a => a.resumeId);
    const seekerIds = this.allApplicants.map(a => a.jobSeekerId);
    const allIds = [...new Set([...resumeIds, ...seekerIds])];
    if (allIds.length === 0) return;

    this.walletService.checkUnlockStatus(allIds).subscribe({
      next: res => {
        const statusMap: Record<string, string[]> = res.data ?? {};
        this.allApplicants.forEach(app => {
          // ResumeView is NOT restored â€” it's pay-per-view every time
          const phoneTypes = statusMap[app.jobSeekerId] ?? [];
          if (phoneTypes.includes('ContactUnlock')) {
            app._phoneUnlocked = true;
            app._phone = app.phoneNumber || 'Contact via email';
          }
          // ResumePdfDownload IS permanent â€” restore it
          const resumeTypes = statusMap[app.resumeId] ?? [];
          if (resumeTypes.includes('ResumePdfDownload')) {
            app._pdfDownloaded = true;
          }
        });
        this.filterApplicants();
      }
    });
  }

  filterApplicants(): void {
    this.filteredApplicants = this.statusFilter
      ? this.allApplicants.filter(a => a.status === this.statusFilter)
      : this.allApplicants;
  }

  shortlist(app: any): void {
    // State machine: Submitted â†’ Reviewed â†’ Shortlisted
    // If still Submitted, must move to Reviewed first, then Shortlist
    const doShortlist = () => {
      this.appService.updateStatus(app.id, 'Shortlisted').subscribe({
        next: () => { app.status = 'Shortlisted'; this.filterApplicants(); this.snack.open('Shortlisted!', 'OK', { duration: 2000 }); },
        error: err => this.snack.open(err.error?.message ?? 'Failed', 'Close', { duration: 3000 })
      });
    };

    if (app.status === 'Submitted') {
      // Must go Submitted â†’ Reviewed â†’ Shortlisted
      this.appService.updateStatus(app.id, 'Reviewed').subscribe({
        next: () => { app.status = 'Reviewed'; doShortlist(); },
        error: err => this.snack.open(err.error?.message ?? 'Failed to review', 'Close', { duration: 3000 })
      });
    } else {
      doShortlist();
    }
  }

  reject(app: any): void {
    this.appService.updateStatus(app.id, 'Rejected').subscribe({
      next: () => { app.status = 'Rejected'; this.filterApplicants(); this.snack.open('Rejected', 'OK', { duration: 2000 }); },
      error: err => this.snack.open(err.error?.message ?? 'Failed', 'Close', { duration: 3000 })
    });
  }

  markReviewed(app: any): void {
    this.appService.updateStatus(app.id, 'Reviewed').subscribe({
      next: () => { app.status = 'Reviewed'; this.filterApplicants(); this.snack.open('Marked as Reviewed', 'OK', { duration: 2000 }); },
      error: err => this.snack.open(err.error?.message ?? 'Failed', 'Close', { duration: 3000 })
    });
  }

  viewResume(app: any): void {
    app._loading = true;
    this.walletService.deductResumeView(app.resumeId).subscribe({
      next: res => {
        app._loading = false;
        this.walletBalance = res.data?.balance ?? this.walletBalance;
        this.snack.open('5 points deducted â€” opening resume', 'OK', { duration: 3000 });
        // Open PDF in new tab every time
        this.resumeService.downloadPdf(app.resumeId).subscribe({
          next: (blob: Blob) => {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 10000);
          },
          error: () => this.snack.open('Could not open resume PDF', 'Close', { duration: 3000 })
        });
      },
      error: (err: any) => {
        app._loading = false;
        const msg = err.status === 402 ? 'Insufficient points to view resume (need 5)' : (err.error?.message ?? 'Failed');
        this.snack.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  downloadResume(app: any): void {
    app._loading = true;
    this.walletService.deductResumeDownload(app.resumeId).subscribe({
      next: res => {
        this.walletBalance = res.data?.balance ?? this.walletBalance;
        const alreadyUnlocked = res.data?.alreadyUnlocked;
        const msg = alreadyUnlocked ? 'Already downloaded â€” no charge' : '15 points deducted for PDF download';
        this.resumeService.downloadPdf(app.resumeId).subscribe({
          next: (blob: Blob) => {
            app._loading = false;
            app._pdfDownloaded = true;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `resume-${app.resumeId}.pdf`; a.click();
            URL.revokeObjectURL(url);
            this.snack.open(msg, 'OK', { duration: 3000 });
          },
          error: (err: any) => {
            app._loading = false;
            this.snack.open(err.error?.message ?? 'Failed to download', 'Close', { duration: 4000 });
          }
        });
      },
      error: (err: any) => {
        app._loading = false;
        const msg = err.status === 402 ? 'Insufficient points (need 15)' : (err.error?.message ?? 'Failed');
        this.snack.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  unlockPhone(app: any): void {
    app._loading = true;
    this.walletService.unlockContact(app.jobSeekerId).subscribe({
      next: (res: any) => {
        app._loading = false;
        app._phoneUnlocked = true;
        app._phone = app.phoneNumber || 'Contact via email';
        const alreadyUnlocked = res.data?.alreadyUnlocked;
        if (!alreadyUnlocked) this.walletBalance = (this.walletBalance ?? 0) - 10;
        const msg = alreadyUnlocked ? 'Phone already unlocked â€” no charge' : 'Phone unlocked â€” 10 points deducted';
        this.snack.open(msg, 'OK', { duration: 3000 });
      },
      error: (err: any) => {
        app._loading = false;
        const msg = err.status === 402 ? 'Insufficient points (need 10)' : (err.error?.message ?? 'Failed');
        this.snack.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  editJob(job: any): void {
    this.router.navigate(['/recruiter/jobs', job.id, 'edit']);
  }

  deleteJob(job: any): void {    if (!confirm(`Delete "${job.title}"? This cannot be undone and the job will no longer appear to job seekers.`)) return;
    job._deleting = true;
    this.jobService.deleteJob(job.id).subscribe({
      next: () => {
        this.jobs = this.jobs.filter(j => j.id !== job.id);
        this.snack.open(`"${job.title}" has been removed`, 'OK', { duration: 4000 });
      },
      error: err => {
        job._deleting = false;
        this.snack.open(err.error?.message ?? 'Failed to delete job', 'Close', { duration: 4000 });
      }
    });
  }
}
