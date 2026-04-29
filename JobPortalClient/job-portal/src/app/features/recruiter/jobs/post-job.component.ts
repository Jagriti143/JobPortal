import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { JobService } from '../../../core/services/job.service';

const COMPANY_ID_KEY = 'recruiter_company_id';

@Component({
  selector: 'app-post-job',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatInputModule, MatSelectModule, MatStepperModule, MatProgressSpinnerModule, MatFormFieldModule, MatSnackBarModule],
  template: `
    <div class="page-wrap-sm">
      <div class="flex items-center gap-16 mb-24">
        <button mat-icon-button routerLink="/recruiter/dashboard"><mat-icon>arrow_back</mat-icon></button>
        <h2>Post a New Job</h2>
      </div>

      <div class="card p-0">
        <mat-stepper linear #stepper>

          <!-- Step 1: Company -->
          <mat-step [stepControl]="companyForm" label="Company">
            <form [formGroup]="companyForm">
              <div class="step-content">
                <div *ngIf="savedCompanyId" class="company-saved-banner">
                  <mat-icon>check_circle</mat-icon>
                  <span>Using saved company ID: <strong>{{ savedCompanyId | slice:0:18 }}...</strong></span>
                  <button mat-button color="warn" type="button" (click)="clearCompany()">Change</button>
                </div>

                <ng-container *ngIf="!savedCompanyId">
                  <p class="text-muted mb-16">Enter your existing company ID, or create a new company profile.</p>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Company ID (if you already have one)</mat-label>
                    <input matInput formControlName="existingCompanyId" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
                    <mat-icon matPrefix>business</mat-icon>
                    <mat-hint>Leave blank to create a new company</mat-hint>
                  </mat-form-field>

                  <div class="divider-text"><span>OR CREATE NEW COMPANY</span></div>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Company Name</mat-label>
                    <input matInput formControlName="companyName" placeholder="e.g. Acme Corp">
                  </mat-form-field>
                  <div class="two-col">
                    <mat-form-field appearance="outline">
                      <mat-label>Industry</mat-label>
                      <input matInput formControlName="industry" placeholder="e.g. Technology">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Location</mat-label>
                      <input matInput formControlName="companyLocation" placeholder="e.g. Bangalore">
                    </mat-form-field>
                  </div>
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Website (optional)</mat-label>
                    <input matInput formControlName="website" placeholder="https://...">
                  </mat-form-field>
                </ng-container>

                <div class="flex justify-end mt-16">
                  <button mat-raised-button color="primary" type="button" (click)="nextFromCompany(stepper)">
                    Next
                  </button>
                </div>
              </div>
            </form>
          </mat-step>

          <!-- Step 2: Basic Info -->
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
                <div class="flex justify-between mt-16">
                  <button mat-button matStepperPrevious>Back</button>
                  <button mat-raised-button color="primary" matStepperNext>Next</button>
                </div>
              </div>
            </form>
          </mat-step>

          <!-- Step 3: Details -->
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

          <!-- Step 4: Publish -->
          <mat-step label="Publish">
            <div class="step-content text-center">
              <mat-icon class="publish-icon">rocket_launch</mat-icon>
              <h3>Ready to publish?</h3>
              <p class="text-muted mb-24">Your listing will go through a brief moderation review before going live.</p>
              <div class="flex justify-center gap-16">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-raised-button color="primary" [disabled]="loading" (click)="submit()">
                  <mat-spinner diameter="18" *ngIf="loading" style="display:inline-block;margin-right:8px"></mat-spinner>
                  <span>{{ loading ? 'Publishing...' : 'Publish Job Listing' }}</span>
                </button>
              </div>
            </div>
          </mat-step>

        </mat-stepper>
      </div>
    </div>
  `,
  styles: [`
    .p-0 { padding: 0; }
    .step-content { padding: 28px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .company-saved-banner { display: flex; align-items: center; gap: 10px; background: #e8f5e9; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; color: #2e7d32; }
    .company-saved-banner mat-icon { color: #2e7d32; }
    .divider-text { display: flex; align-items: center; gap: 12px; margin: 20px 0; color: #9ca3af; font-size: 0.75rem; font-weight: 700; }
    .divider-text::before, .divider-text::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
    .publish-icon { font-size: 64px; height: 64px; width: 64px; color: var(--primary); display: block; margin: 0 auto 16px; }
  `]
})
export class PostJobComponent implements OnInit {
  private fb = inject(FormBuilder);
  private jobService = inject(JobService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  loading = false;
  savedCompanyId: string | null = null;

  companyForm = this.fb.group({
    existingCompanyId: [''],
    companyName: [''],
    industry: [''],
    companyLocation: [''],
    website: ['']
  });

  basicForm = this.fb.group({
    title: ['', Validators.required],
    jobType: ['FullTime', Validators.required],
    location: ['', Validators.required]
  });

  detailsForm = this.fb.group({
    description: ['', Validators.required],
    salaryMin: [null],
    salaryMax: [null]
  });

  ngOnInit(): void {
    // Restore saved company ID from previous session
    this.savedCompanyId = localStorage.getItem(COMPANY_ID_KEY);
  }

  clearCompany(): void {
    this.savedCompanyId = null;
    localStorage.removeItem(COMPANY_ID_KEY);
  }

  nextFromCompany(stepper: any): void {
    try {
      // If already have a saved company, skip straight to next step
      if (this.savedCompanyId) { stepper.next(); return; }

      const existingId = (this.companyForm.value.existingCompanyId ?? '').trim();

      if (existingId) {
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!guidRegex.test(existingId)) {
          this.snack.open('Please enter a valid Company ID (UUID format)', 'Close', { duration: 4000 });
          return;
        }
        this.savedCompanyId = existingId;
        localStorage.setItem(COMPANY_ID_KEY, existingId);
        stepper.next();
        return;
      }

      const name = (this.companyForm.value.companyName ?? '').trim();
      if (!name) {
        this.snack.open('Enter an existing Company ID or fill in a Company Name to create one', 'Close', { duration: 4000 });
        return;
      }

      this.loading = true;
      this.jobService.createCompany({
        name,
        industry: this.companyForm.value.industry || undefined,
        location: this.companyForm.value.companyLocation || undefined,
        website: this.companyForm.value.website || undefined
      }).subscribe({
        next: res => {
          this.loading = false;
          const companyId = (res.data as any)?.companyId ?? (res.data as any)?.id;
          if (companyId) {
            this.savedCompanyId = companyId;
            localStorage.setItem(COMPANY_ID_KEY, companyId);
            this.snack.open('Company created!', 'OK', { duration: 3000 });
            stepper.next();
          } else {
            console.error('createCompany response missing ID:', res);
            this.snack.open('Company created but ID not returned', 'Close', { duration: 4000 });
          }
        },
        error: err => {
          this.loading = false;
          console.error('createCompany error:', err);
          this.snack.open(err.error?.message ?? err.error?.error ?? 'Failed to create company', 'Close', { duration: 4000 });
        }
      });
    } catch (e) {
      console.error('nextFromCompany exception:', e);
      this.snack.open('Unexpected error — check console', 'Close', { duration: 4000 });
    }
  }

  submit(): void {
    if (this.basicForm.invalid || this.detailsForm.invalid) {
      this.snack.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }
    if (!this.savedCompanyId) {
      this.snack.open('Company ID is missing — go back to step 1', 'Close', { duration: 4000 });
      return;
    }

    this.loading = true;
    const payload = {
      companyId: this.savedCompanyId,
      title: this.basicForm.value.title,
      jobType: this.basicForm.value.jobType,
      location: this.basicForm.value.location,
      description: this.detailsForm.value.description,
      salaryMin: this.detailsForm.value.salaryMin || undefined,
      salaryMax: this.detailsForm.value.salaryMax || undefined
    };

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
