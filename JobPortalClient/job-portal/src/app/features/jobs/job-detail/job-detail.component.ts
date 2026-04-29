import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { JobService } from '../../../core/services/job.service';
import { ApplicationService } from '../../../core/services/application.service';
import { ResumeService } from '../../../core/services/resume.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatInputModule, MatSelectModule,
    MatFormFieldModule, MatDividerModule],
  template: `
    <div class="page-wrap-sm" *ngIf="loading">
      <div class="text-center mt-24"><mat-spinner diameter="40" style="margin: 0 auto;"></mat-spinner></div>
    </div>

    <!-- Job no longer available -->
    <div class="page-wrap-sm" *ngIf="!loading && jobDeleted">
      <div class="deleted-state">
        <div class="deleted-icon"><mat-icon>work_off</mat-icon></div>
        <h2>This job is no longer available</h2>
        <p>The recruiter has removed this job listing. It may have been filled or taken down.</p>
        <a mat-raised-button color="primary" routerLink="/jobs">
          <mat-icon>search</mat-icon> Browse Other Jobs
        </a>
      </div>
    </div>

    <div class="page-wrap-sm" *ngIf="!loading && job">
      <a routerLink="/jobs" mat-button class="mb-24"><mat-icon>arrow_back</mat-icon> Back to Search</a>

      <div class="card job-detail-card">
        <div class="jd-header flex justify-between items-start">
          <div class="flex gap-24 items-center">
            <div class="company-logo-large">{{ job.title.charAt(0) }}</div>
            <div>
              <h1>{{ job.title }}</h1>
              <p class="text-muted">
                <mat-icon inline>location_on</mat-icon> {{ job.location }} &nbsp;·&nbsp;
                <mat-icon inline>work</mat-icon> {{ job.jobType }}
              </p>
              <div class="tags flex gap-16 mt-16">
                <span class="chip status-approved">{{ job.jobType }}</span>
                <span class="salary-strong" *ngIf="job.salaryMin">₹{{ job.salaryMin | number }} – ₹{{ job.salaryMax | number }}</span>
              </div>
            </div>
          </div>
          <div>
            <button mat-raised-button color="primary" class="apply-btn"
              (click)="openApply()" *ngIf="!showApply && isSeeker && !applied">
              <mat-icon>send</mat-icon> Apply Now
            </button>
            <button mat-raised-button disabled *ngIf="applied">
              <mat-icon>check</mat-icon> Applied
            </button>
            <p class="text-muted text-sm mt-16 text-center" *ngIf="!isSeeker">Login as Job Seeker to apply</p>
          </div>
        </div>

        <mat-divider style="margin: 32px 0;"></mat-divider>

        <div class="jd-body">
          <h3>Job Description</h3>
          <p class="desc-text">{{ job.description }}</p>
        </div>

        <!-- Application Form -->
        <div class="apply-section mt-24" *ngIf="showApply">
          <mat-divider style="margin-bottom: 24px;"></mat-divider>
          <h3>Submit Your Application</h3>
          <p class="text-muted text-sm mb-16">All fields marked * are required</p>

          <form [formGroup]="applyForm" (ngSubmit)="submitApplication()">
            <!-- Phone number — required -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Phone Number *</mat-label>
              <input matInput formControlName="phoneNumber" placeholder="+91 98765 43210" type="tel">
              <mat-icon matPrefix>phone</mat-icon>
              <mat-error *ngIf="applyForm.get('phoneNumber')?.hasError('required')">Phone number is required</mat-error>
              <mat-error *ngIf="applyForm.get('phoneNumber')?.hasError('pattern')">Enter a valid phone number</mat-error>
            </mat-form-field>

            <!-- Resume selection — required -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Select Resume *</mat-label>
              <mat-select formControlName="resumeId">
                <mat-option *ngIf="loadingResumes" disabled>Loading resumes...</mat-option>
                <mat-option *ngIf="!loadingResumes && resumes.length === 0" disabled>
                  No resumes found — <a routerLink="/seeker/resumes/new">create one first</a>
                </mat-option>
                <mat-option *ngFor="let r of resumes" [value]="r.id">
                  {{ r.title }} · Updated {{ r.updatedAt | date:'mediumDate' }}
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>description</mat-icon>
              <mat-error *ngIf="applyForm.get('resumeId')?.hasError('required')">Please select a resume</mat-error>
            </mat-form-field>

            <!-- Cover letter — optional -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Cover Letter (Optional)</mat-label>
              <textarea matInput formControlName="coverLetter" rows="5"
                placeholder="Tell the employer why you are a great fit..."></textarea>
            </mat-form-field>

            <div class="apply-actions">
              <button mat-button type="button" (click)="showApply = false">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="submitting || applyForm.invalid">
                <mat-spinner diameter="18" *ngIf="submitting" style="display:inline-block;margin-right:8px"></mat-spinner>
                <span *ngIf="!submitting">Submit Application</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .company-logo-large { width:80px;height:80px;border-radius:12px;background:#f0f7ec;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:2.5rem;color:#6b8660 }
    h1 { font-size:2rem;margin-bottom:8px;font-family:'DM Serif Display',serif;font-weight:400;color:#1a2e12 }
    mat-icon[inline] { font-size:16px;width:16px;height:16px;vertical-align:text-bottom }
    .salary-strong { font-weight:700;font-size:1.1rem;color:#2d4a22 }
    .apply-btn { height:48px;font-size:1rem;border-radius:8px!important }
    .desc-text { white-space:pre-wrap;line-height:1.7;font-size:1rem;color:#3d5a30 }
    .apply-section { background:#f0f7ec;padding:24px;border-radius:12px;border:1px solid #e8ede4 }
    .apply-section h3 { margin-bottom:4px;font-family:'DM Serif Display',serif;font-weight:400;color:#1a2e12 }
    .apply-actions { display:flex;justify-content:flex-end;gap:10px;margin-top:8px }
    .mb-16 { margin-bottom:16px }
    .deleted-state { text-align:center;padding:80px 24px;background:white;border-radius:16px;box-shadow:0 1px 4px rgba(26,46,18,.07);margin-top:24px }
    .deleted-icon { width:80px;height:80px;border-radius:20px;background:rgba(220,38,38,.06);display:flex;align-items:center;justify-content:center;margin:0 auto 20px }
    .deleted-icon mat-icon { font-size:40px;width:40px;height:40px;color:#dc2626 }
    .deleted-state h2 { font-size:1.4rem;font-weight:400;margin-bottom:10px;font-family:'DM Serif Display',serif;color:#1a2e12 }
    .deleted-state p { color:#64748b;margin-bottom:24px }
  `]
})
export class JobDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobService = inject(JobService);
  private appService = inject(ApplicationService);
  private resumeService = inject(ResumeService);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  job: any = null;
  loading = true;
  showApply = false;
  submitting = false;
  applied = false;
  isSeeker = false;
  resumes: any[] = [];
  loadingResumes = false;
  jobDeleted = false;

  applyForm = this.fb.group({
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[+\d\s\-()]{7,15}$/)]],
    resumeId:    [null as string | null, Validators.required],
    coverLetter: ['']
  });

  ngOnInit(): void {
    this.isSeeker = this.auth.isLoggedIn && this.auth.role === 'JobSeeker';
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.jobService.getJob(id).subscribe({
        next: res => { this.job = res.data; this.loading = false; },
        error: () => {
        this.loading = false;
        // Show "no longer available" instead of navigating away
        this.jobDeleted = true;
      }
      });
    }
  }

  openApply(): void {
    this.showApply = true;
    if (this.isSeeker && this.resumes.length === 0) {
      this.loadingResumes = true;
      this.resumeService.getMyResumes().subscribe({
        next: res => { this.loadingResumes = false; this.resumes = res.data ?? []; },
        error: () => { this.loadingResumes = false; }
      });
    }
  }

  submitApplication(): void {
    if (!this.job || this.applyForm.invalid) return;
    this.submitting = true;
    const { phoneNumber, resumeId, coverLetter } = this.applyForm.value;
    const email = this.auth.currentUser?.email ?? '';

    this.appService.applyForJob(this.job.id, coverLetter ?? '', email, phoneNumber!, resumeId!).subscribe({
      next: () => {
        this.submitting = false;
        this.showApply = false;
        this.applied = true;
        this.snack.open('Application submitted successfully!', 'Great', { duration: 5000 });
      },
      error: err => {
        this.submitting = false;
        this.snack.open(err.error?.message ?? err.error?.error ?? 'Failed to apply.', 'Close', { duration: 4000 });
      }
    });
  }
}
