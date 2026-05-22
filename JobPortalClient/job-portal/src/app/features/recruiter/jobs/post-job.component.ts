import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { JobService } from '../../../core/services/job.service';
import { Company } from '../../../core/models/index';

@Component({
  selector: 'app-post-job',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatInputModule, MatSelectModule, MatStepperModule, MatProgressSpinnerModule, MatFormFieldModule, MatSnackBarModule],
  template: `
    <div class="page-wrap-sm">
      <div class="flex items-center gap-16 mb-24">
        <button mat-icon-button routerLink="/recruiter/dashboard"><mat-icon>arrow_back</mat-icon></button>
        <h2>{{ isEditMode ? 'Edit Job Listing' : 'Post a New Job' }}</h2>
        <span class="mode-badge" [class.edit-badge]="isEditMode">
          <mat-icon>{{ isEditMode ? 'edit' : 'add_circle' }}</mat-icon>
          {{ isEditMode ? 'Editing' : 'New Listing' }}
        </span>
      </div>

      <!-- Company not found error state -->
      <div *ngIf="companyError" class="no-company-card">
        <div class="no-company-icon">
          <mat-icon>business_off</mat-icon>
        </div>
        <h3>No Company Registered</h3>
        <p>You need a registered company to post jobs. Company details are set up during the recruiter registration process.</p>
        <p class="no-company-hint">If you believe this is a mistake, please contact support or try logging out and back in.</p>
        <button mat-raised-button color="primary" routerLink="/recruiter/dashboard">Back to Dashboard</button>
      </div>

      <!-- Loading state -->
      <div *ngIf="(loadingCompany || loadingJob) && !companyError" class="company-loading">
        <mat-spinner diameter="36"></mat-spinner>
        <p>{{ loadingJob ? 'Loading job details...' : 'Loading your company details...' }}</p>
      </div>

      <!-- Edit mode: job not found -->
      <div *ngIf="jobNotFound" class="no-company-card">
        <div class="no-company-icon">
          <mat-icon style="color:#f87171">work_off</mat-icon>
        </div>
        <h3>Job Not Found</h3>
        <p>This job listing could not be found or you don't have permission to edit it.</p>
        <button mat-raised-button color="primary" routerLink="/recruiter/dashboard">Back to Dashboard</button>
      </div>

      <!-- Main form — only shown when company is loaded -->
      <ng-container *ngIf="company() && !loadingCompany && !loadingJob && !jobNotFound">

        <!-- Edit notice for approved jobs -->
        <div class="edit-notice" *ngIf="isEditMode && existingJob?.moderationStatus === 'Approved'">
          <mat-icon>info</mat-icon>
          <span>This job is currently <strong>live</strong>. Saving changes will reset its status to <strong>Pending</strong> for re-moderation.</span>
        </div>

        <!-- Edit notice for pending jobs -->
        <div class="edit-notice pending-notice" *ngIf="isEditMode && existingJob?.moderationStatus === 'Pending'">
          <mat-icon>pending</mat-icon>
          <span>This job is <strong>awaiting moderation</strong>. You can update it and it will remain in the review queue.</span>
        </div>

        <!-- Read-only Company Banner -->
        <div class="company-banner">
          <div class="company-banner-left">
            <div class="company-logo-placeholder" *ngIf="!company()?.logoUrl">
              <mat-icon>business</mat-icon>
            </div>
            <img *ngIf="company()?.logoUrl" [src]="company()!.logoUrl" [alt]="company()!.name" class="company-logo-img">
            <div class="company-banner-info">
              <div class="company-banner-name">{{ company()!.name }}</div>
              <div class="company-banner-meta">
                <span *ngIf="company()!.industry"><mat-icon>category</mat-icon>{{ company()!.industry }}</span>
                <span *ngIf="company()!.location"><mat-icon>location_on</mat-icon>{{ company()!.location }}</span>
                <a *ngIf="company()!.website" [href]="company()!.website" target="_blank" class="company-website">
                  <mat-icon>language</mat-icon>{{ company()!.website }}
                </a>
              </div>
              <div class="company-banner-desc" *ngIf="company()!.description">{{ company()!.description }}</div>
            </div>
          </div>
          <div class="company-banner-badge">
            <mat-icon>verified</mat-icon>
            <span>Verified Company</span>
          </div>
        </div>
        <p class="company-readonly-note">
          <mat-icon>info</mat-icon>
          This job will be posted under your registered company. Company details cannot be changed here.
        </p>

        <!-- Job form steps -->
        <div class="card p-0">
          <mat-stepper linear #stepper>

            <!-- Step 1: Basic Info -->
            <mat-step [stepControl]="basicForm" label="Basic Info">
              <form [formGroup]="basicForm">
                <div class="step-content">
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Job Title</mat-label>
                    <input matInput formControlName="title" placeholder="e.g. Senior Software Engineer">
                  </mat-form-field>
                  <div class="two-col">
                    <mat-form-field appearance="outline">
                      <mat-label>Job Type</mat-label>
                      <mat-select formControlName="jobType">
                        <mat-option value="FullTime">Full Time</mat-option>
                        <mat-option value="PartTime">Part Time</mat-option>
                        <mat-option value="Contract">Contract</mat-option>
                        <mat-option value="Remote">Remote</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Location</mat-label>
                      <input matInput formControlName="location" placeholder="e.g. Bangalore, India">
                    </mat-form-field>
                  </div>
                  <div class="flex justify-end mt-16">
                    <button mat-raised-button color="primary" matStepperNext>Next</button>
                  </div>
                </div>
              </form>
            </mat-step>

            <!-- Step 2: Details -->
            <mat-step [stepControl]="detailsForm" label="Details">
              <form [formGroup]="detailsForm">
                <div class="step-content">
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Job Description</mat-label>
                    <textarea matInput formControlName="description" rows="6"
                      placeholder="Describe the role, responsibilities, and requirements..."></textarea>
                  </mat-form-field>
                  <div class="two-col">
                    <mat-form-field appearance="outline">
                      <mat-label>Min Salary ₹ (optional)</mat-label>
                      <input matInput formControlName="salaryMin" type="number">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Max Salary ₹ (optional)</mat-label>
                      <input matInput formControlName="salaryMax" type="number">
                    </mat-form-field>
                  </div>
                  <div class="flex justify-between mt-16">
                    <button mat-button matStepperPrevious>Back</button>
                    <button mat-raised-button color="primary" matStepperNext>Next</button>
                  </div>
                </div>
              </form>
            </mat-step>

            <!-- Step 3: Review & Publish / Save -->
            <mat-step [label]="isEditMode ? 'Save Changes' : 'Publish'">
              <div class="step-content text-center">
                <mat-icon class="publish-icon">{{ isEditMode ? 'save' : 'rocket_launch' }}</mat-icon>
                <h3>{{ isEditMode ? 'Save your changes?' : 'Ready to publish?' }}</h3>
                <p class="text-muted mb-16">Posting as <strong>{{ company()!.name }}</strong></p>
                <p class="text-muted mb-24" *ngIf="!isEditMode">Your listing will go through a brief moderation review before going live.</p>
                <p class="text-muted mb-24" *ngIf="isEditMode && existingJob?.moderationStatus === 'Approved'">
                  <mat-icon inline style="color:#d97706">warning</mat-icon>
                  Saving will put the job back into <strong>Pending</strong> moderation.
                </p>

                <!-- Review summary -->
                <div class="review-summary" *ngIf="isEditMode">
                  <div class="summary-row"><span class="summary-label">Title</span><span class="summary-value">{{ basicForm.value.title }}</span></div>
                  <div class="summary-row"><span class="summary-label">Type</span><span class="summary-value">{{ basicForm.value.jobType }}</span></div>
                  <div class="summary-row"><span class="summary-label">Location</span><span class="summary-value">{{ basicForm.value.location }}</span></div>
                  <div class="summary-row" *ngIf="detailsForm.value.salaryMin">
                    <span class="summary-label">Salary</span>
                    <span class="summary-value">₹{{ detailsForm.value.salaryMin | number }}{{ detailsForm.value.salaryMax ? ' – ₹' + (detailsForm.value.salaryMax | number) : ' onwards' }}</span>
                  </div>
                </div>

                <div class="flex justify-center gap-16">
                  <button mat-button matStepperPrevious>Back</button>
                  <button mat-raised-button color="primary" [disabled]="loading" (click)="submit()"
                    [class.edit-submit-btn]="isEditMode">
                    <mat-spinner diameter="18" *ngIf="loading" style="display:inline-block;margin-right:8px"></mat-spinner>
                    <mat-icon *ngIf="!loading">{{ isEditMode ? 'save' : 'rocket_launch' }}</mat-icon>
                    <span>{{ loading ? (isEditMode ? 'Saving...' : 'Publishing...') : (isEditMode ? 'Save Changes' : 'Publish Job Listing') }}</span>
                  </button>
                </div>
              </div>
            </mat-step>

          </mat-stepper>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .p-0 { padding: 0; }
    .step-content { padding: 28px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    /* Mode badge */
    .mode-badge {
      display:flex; align-items:center; gap:5px; padding:4px 12px;
      border-radius:20px; font-size:.75rem; font-weight:700;
      background:#f0f7ec; color:#2d4a22; border:1px solid #c5d8bc; margin-left:auto;
    }
    .mode-badge mat-icon { font-size:14px; width:14px; height:14px; }
    .edit-badge { background:#fff7ed; color:#92400e; border-color:#fcd34d; }

    /* Edit notices */
    .edit-notice {
      display:flex; align-items:flex-start; gap:10px;
      background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px;
      padding:12px 16px; margin-bottom:14px; font-size:.85rem; color:#1e3a5f; line-height:1.5;
    }
    .edit-notice mat-icon { font-size:18px; width:18px; height:18px; color:#3b82f6; flex-shrink:0; margin-top:1px; }
    .pending-notice { background:#fffbeb; border-color:#fde68a; color:#78350f; }
    .pending-notice mat-icon { color:#d97706; }

    /* Review summary */
    .review-summary {
      background:#f8faf6; border:1px solid #e8ede4; border-radius:10px;
      padding:14px 18px; margin:0 auto 20px; max-width:360px; text-align:left;
    }
    .summary-row { display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #f0f7ec; }
    .summary-row:last-child { border-bottom:none; }
    .summary-label { font-size:.78rem; color:#64748b; font-weight:600; }
    .summary-value { font-size:.82rem; color:#1a2e12; font-weight:500; max-width:60%; text-align:right; }

    /* Edit submit button */
    .edit-submit-btn { background:linear-gradient(135deg,#1a2e12,#3d5a30)!important; }

    /* Company Banner */
    .company-banner {
      display: flex; align-items: flex-start; justify-content: space-between;
      background: linear-gradient(135deg, #f0f7ec, #e8f5e9);
      border: 1.5px solid #c5d8bc; border-radius: 14px;
      padding: 20px 24px; margin-bottom: 10px; gap: 16px;
    }
    .company-banner-left { display: flex; align-items: flex-start; gap: 16px; flex: 1; }
    .company-logo-placeholder {
      width: 56px; height: 56px; border-radius: 12px;
      background: linear-gradient(135deg, #2d4a22, #6b8660);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .company-logo-placeholder mat-icon { color: #fff; font-size: 28px; width: 28px; height: 28px; }
    .company-logo-img { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; flex-shrink: 0; }
    .company-banner-info { flex: 1; }
    .company-banner-name { font-size: 1.1rem; font-weight: 700; color: #1a2e12; margin-bottom: 6px; }
    .company-banner-meta { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
    .company-banner-meta span, .company-website {
      display: flex; align-items: center; gap: 4px;
      font-size: .82rem; color: #4a6741;
    }
    .company-banner-meta mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .company-website { text-decoration: none; }
    .company-website:hover { text-decoration: underline; }
    .company-banner-desc { font-size: .83rem; color: #64748b; line-height: 1.5; }
    .company-banner-badge {
      display: flex; align-items: center; gap: 5px; flex-shrink: 0;
      background: #d1fae5; border: 1px solid #6ee7b7; border-radius: 20px;
      padding: 5px 12px; font-size: .78rem; font-weight: 700; color: #065f46;
    }
    .company-banner-badge mat-icon { font-size: 15px; width: 15px; height: 15px; color: #059669; }

    .company-readonly-note {
      display: flex; align-items: center; gap: 6px;
      font-size: .78rem; color: #64748b; margin-bottom: 16px; padding: 0 4px;
    }
    .company-readonly-note mat-icon { font-size: 15px; width: 15px; height: 15px; color: #94a3b8; }

    /* No company error */
    .no-company-card {
      text-align: center; background: #fff; border: 1.5px solid #fecaca;
      border-radius: 14px; padding: 48px 32px;
    }
    .no-company-icon { margin-bottom: 16px; }
    .no-company-icon mat-icon { font-size: 56px; width: 56px; height: 56px; color: #f87171; }
    .no-company-card h3 { font-size: 1.2rem; font-weight: 700; color: #1a2e12; margin-bottom: 10px; }
    .no-company-card p { color: #64748b; margin-bottom: 8px; }
    .no-company-hint { font-size: .82rem; color: #94a3b8; margin-bottom: 24px; }

    /* Loading state */
    .company-loading { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 48px; color: #64748b; }

    .publish-icon { font-size: 64px; height: 64px; width: 64px; color: var(--primary); display: block; margin: 0 auto 16px; }
    @media(max-width:600px){ .company-banner{ flex-direction:column } .two-col{grid-template-columns:1fr} .mode-badge{display:none} }
  `]
})
export class PostJobComponent implements OnInit {
  private fb = inject(FormBuilder);
  private jobService = inject(JobService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);

  loading = false;
  loadingCompany = true;
  loadingJob = false;
  companyError = false;
  jobNotFound = false;
  isEditMode = false;
  editJobId: string | null = null;
  existingJob: any = null;

  company = signal<Company | null>(null);

  basicForm = this.fb.group({
    title: ['', Validators.required],
    jobType: ['FullTime', Validators.required],
    location: ['', Validators.required]
  });

  detailsForm = this.fb.group({
    description: ['', Validators.required],
    salaryMin: [null as number | null],
    salaryMax: [null as number | null]
  });

  ngOnInit(): void {
    // Detect edit mode from route param
    const jobId = this.route.snapshot.paramMap.get('jobId');
    if (jobId) {
      this.isEditMode = true;
      this.editJobId = jobId;
    }

    // Load company first
    this.jobService.getMyCompany().subscribe({
      next: res => {
        this.loadingCompany = false;
        if (res.success && res.data) {
          this.company.set(res.data);
          // If edit mode, fetch existing job data after company loads
          if (this.isEditMode) {
            this.loadExistingJob(this.editJobId!);
          }
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

  private loadExistingJob(jobId: string): void {
    this.loadingJob = true;
    this.jobService.getJob(jobId).subscribe({
      next: res => {
        this.loadingJob = false;
        if (res.success && res.data) {
          const job = res.data;
          this.existingJob = job;
          // Pre-fill the forms
          this.basicForm.patchValue({
            title: job.title ?? '',
            jobType: job.jobType ?? 'FullTime',
            location: job.location ?? ''
          });
          this.detailsForm.patchValue({
            description: job.description ?? '',
            salaryMin: job.salaryMin ?? null,
            salaryMax: job.salaryMax ?? null
          });
        } else {
          this.jobNotFound = true;
        }
      },
      error: () => {
        this.loadingJob = false;
        this.jobNotFound = true;
      }
    });
  }

  submit(): void {
    if (this.basicForm.invalid || this.detailsForm.invalid) {
      this.snack.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }
    if (!this.company()) {
      this.snack.open('No company found — cannot post job', 'Close', { duration: 4000 });
      return;
    }

    this.loading = true;
    const payload = {
      title:       this.basicForm.value.title,
      jobType:     this.basicForm.value.jobType,
      location:    this.basicForm.value.location,
      description: this.detailsForm.value.description,
      salaryMin:   this.detailsForm.value.salaryMin  || undefined,
      salaryMax:   this.detailsForm.value.salaryMax  || undefined
    };

    if (this.isEditMode && this.editJobId) {
      // UPDATE existing job
      this.jobService.updateJob(this.editJobId, payload).subscribe({
        next: () => {
          this.loading = false;
          this.snack.open('Job updated successfully! It will be re-reviewed before going live.', 'OK', { duration: 5000 });
          this.router.navigate(['/recruiter/dashboard']);
        },
        error: err => {
          this.loading = false;
          const msg = err.error?.message ?? err.error?.data ?? 'Failed to update job';
          this.snack.open(msg, 'Close', { duration: 5000 });
        }
      });
    } else {
      // CREATE new job
      this.jobService.createJob(payload).subscribe({
        next: () => {
          this.loading = false;
          this.snack.open('Job posted! Pending moderation.', 'OK', { duration: 4000 });
          this.router.navigate(['/recruiter/dashboard']);
        },
        error: err => {
          this.loading = false;
          const msg = err.error?.message ?? err.error?.data ?? 'Failed to post job';
          this.snack.open(msg, 'Close', { duration: 5000 });
          console.error('POST /jobs error:', err.error);
        }
      });
    }
  }
}
