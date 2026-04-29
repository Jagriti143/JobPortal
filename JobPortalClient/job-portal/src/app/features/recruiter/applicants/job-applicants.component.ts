import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApplicationService } from '../../../core/services/application.service';
import { ResumeService } from '../../../core/services/resume.service';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-job-applicants',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <div class="flex items-center gap-16">
          <a mat-icon-button routerLink="/recruiter/jobs"><mat-icon>arrow_back</mat-icon></a>
          <h1>Applicants</h1>
        </div>
        <div class="wallet-info" *ngIf="walletBalance !== null">
          <mat-icon>account_balance_wallet</mat-icon>
          <span>{{ walletBalance }} points</span>
        </div>
      </div>

      <!-- Cost legend -->
      <div class="cost-legend">
        <div class="cost-item"><mat-icon>visibility</mat-icon> View Resume = <strong>5 pts</strong></div>
        <div class="cost-item"><mat-icon>download</mat-icon> Download PDF = <strong>15 pts</strong></div>
        <div class="cost-item"><mat-icon>phone</mat-icon> Unlock Phone = <strong>10 pts</strong></div>
      </div>

      <div *ngIf="loading" class="loading-center"><mat-spinner></mat-spinner></div>

      <div *ngIf="!loading && applications.length === 0" class="empty-state">
        <mat-icon>people_outline</mat-icon>
        <h3>No applicants yet</h3>
        <p>Applications will appear here once candidates apply</p>
      </div>

      <div class="applicants-list" *ngIf="!loading && applications.length > 0">
        <div *ngFor="let app of applications" class="applicant-card">
          <div class="applicant-avatar">{{ app.jobSeekerEmail?.charAt(0)?.toUpperCase() ?? 'A' }}</div>

          <div class="applicant-info">
            <div class="applicant-email fw-600">{{ app.jobSeekerEmail || 'Applicant #' + (app.jobSeekerId | slice:0:8) }}</div>
            <div class="applicant-meta text-muted text-sm">
              Applied {{ app.appliedAt | date:'mediumDate' }}
            </div>

            <!-- Phone — shown only after unlock -->
            <div class="phone-row" *ngIf="app._phoneUnlocked">
              <mat-icon>phone</mat-icon>
              <span class="fw-600">{{ app._phone }}</span>
            </div>

            <!-- Cover letter preview -->            <div class="cover-preview text-sm text-muted" *ngIf="app.coverLetter && app._showCover">
              "{{ app.coverLetter }}"
            </div>
          </div>

          <div class="applicant-right">
            <span class="status-chip" [class]="'status-' + app.status?.toLowerCase()">{{ app.status }}</span>

            <div class="action-buttons">
              <!-- View resume (5 pts) -->
              <button mat-stroked-button class="action-btn view-btn"
                *ngIf="!app._resumeViewed"
                [disabled]="app._loading || !app.resumeId"
                [matTooltip]="app.resumeId ? 'View resume — 5 points' : 'Applicant did not attach a resume'"
                (click)="app.resumeId && viewResume(app)">
                <mat-icon>visibility</mat-icon> View (5 pts)
              </button>
              <button mat-stroked-button class="action-btn viewed-btn" disabled *ngIf="app._resumeViewed">
                <mat-icon>check_circle</mat-icon> Viewed
              </button>

              <!-- Download PDF (15 pts) -->
              <button mat-stroked-button class="action-btn download-btn"
                [disabled]="app._loading || !app.resumeId"
                [matTooltip]="app.resumeId ? 'Download PDF — 15 points' : 'No resume attached'"
                (click)="app.resumeId && downloadResume(app)">
                <mat-icon>download</mat-icon> PDF (15 pts)
              </button>

              <!-- Unlock phone (10 pts) -->
              <button mat-stroked-button class="action-btn phone-btn"
                *ngIf="!app._phoneUnlocked"
                [disabled]="app._loading"
                matTooltip="Unlock phone number — 10 points"
                (click)="unlockPhone(app)">
                <mat-icon>phone_locked</mat-icon> Phone (10 pts)
              </button>
              <div class="phone-unlocked-badge" *ngIf="app._phoneUnlocked">
                <mat-icon>phone</mat-icon> {{ app._phone }}
              </div>

              <!-- Cover letter toggle -->
              <button mat-icon-button *ngIf="app.coverLetter"
                (click)="app._showCover = !app._showCover"
                matTooltip="Toggle cover letter">
                <mat-icon>{{ app._showCover ? 'expand_less' : 'notes' }}</mat-icon>
              </button>

              <!-- Status actions -->
              <button mat-icon-button color="primary" matTooltip="Shortlist"
                *ngIf="app.status === 'Submitted' || app.status === 'Reviewed'"
                (click)="shortlist(app)">
                <mat-icon>star</mat-icon>
              </button>
              <button mat-icon-button color="warn" matTooltip="Reject"
                *ngIf="app.status !== 'Rejected' && app.status !== 'Withdrawn'"
                (click)="reject(app)">
                <mat-icon>cancel</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { font-size: 1.6rem; font-weight: 700; }
    .wallet-info { display: flex; align-items: center; gap: 6px; background: #eff6ff; color: #1976d2; padding: 8px 16px; border-radius: 20px; font-weight: 700; }
    .wallet-info mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .cost-legend { display: flex; gap: 20px; flex-wrap: wrap; background: #f9fafb; border-radius: 10px; padding: 12px 20px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
    .cost-item { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #374151; }
    .cost-item mat-icon { font-size: 16px; width: 16px; height: 16px; color: #6b7280; }

    .applicants-list { display: flex; flex-direction: column; gap: 12px; }
    .applicant-card { background: white; border-radius: 12px; padding: 18px 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); display: flex; align-items: flex-start; gap: 14px; border: 1px solid #e5e7eb; }
    .applicant-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #1565c0, #42a5f5); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
    .applicant-info { flex: 1; }
    .applicant-email { font-size: 0.9rem; margin-bottom: 2px; }
    .phone-row { display: flex; align-items: center; gap: 6px; margin-top: 6px; color: #16a34a; font-size: 0.875rem; }
    .phone-row mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .cover-preview { margin-top: 8px; background: #f9fafb; border-radius: 6px; padding: 8px 12px; font-style: italic; border-left: 3px solid #e5e7eb; }

    .applicant-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
    .action-buttons { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
    .action-btn { font-size: 0.78rem !important; height: 32px !important; border-radius: 6px !important; }
    .view-btn { color: #1976d2 !important; border-color: #1976d2 !important; }
    .download-btn { color: #7c3aed !important; border-color: #7c3aed !important; }
    .phone-btn { color: #16a34a !important; border-color: #16a34a !important; }

    .status-chip { padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; }
    .status-submitted  { background: #dbeafe; color: #1d4ed8; }
    .status-shortlisted{ background: #dcfce7; color: #15803d; }
    .status-rejected   { background: #fee2e2; color: #dc2626; }
    .status-reviewed   { background: #fef3c7; color: #b45309; }
    .status-withdrawn  { background: #f3f4f6; color: #6b7280; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { text-align: center; padding: 60px; color: #9ca3af; }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; display: block; margin: 0 auto 12px; opacity: 0.4; }
    .fw-600 { font-weight: 600; }
    .text-muted { color: #6b7280; }
    .text-sm { font-size: 0.8rem; }
    .page-wrap { max-width: 1100px; margin: 0 auto; padding: 28px 24px; }
    .viewed-btn { color: #16a34a !important; border-color: #16a34a !important; }
    .phone-unlocked-badge { display: flex; align-items: center; gap: 4px; background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }
    .phone-unlocked-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }
  `]
})
export class JobApplicantsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private appService = inject(ApplicationService);
  private resumeService = inject(ResumeService);
  private walletService = inject(WalletService);
  private snack = inject(MatSnackBar);

  applications: any[] = [];
  loading = false;
  walletBalance: number | null = null;

  ngOnInit(): void {
    const jobId = this.route.snapshot.paramMap.get('jobId')!;
    this.loading = true;
    this.appService.getJobApplicants(jobId).subscribe({
      next: res => { this.loading = false; this.applications = res.data ?? []; },
      error: () => { this.loading = false; }
    });
    this.walletService.getWalletBalance().subscribe({
      next: res => { this.walletBalance = res.data?.balance ?? 0; }
    });
  }

  viewResume(app: any): void {
    if (!app.resumeId) return;
    app._loading = true;
    this.walletService.deductResumeView(app.resumeId).subscribe({
      next: res => {
        this.walletBalance = res.data?.balance ?? this.walletBalance;
        // Points deducted — mark as viewed (no additional API call needed)
        app._loading = false;
        app._resumeViewed = true;
        const msg = res.data?.alreadyUnlocked ? 'Already unlocked — no charge' : 'Resume access granted — 5 points deducted';
        this.snack.open(msg, 'OK', { duration: 3000 });
        // Open PDF in new tab
        this.resumeService.downloadPdf(app.resumeId).subscribe({
          next: (blob: Blob) => {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 10000);
          }
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
    if (!app.resumeId) return;
    app._loading = true;
    // Deduct 15 points first
    this.walletService.deductResumeDownload(app.resumeId).subscribe({
      next: res => {
        this.walletBalance = res.data?.balance ?? this.walletBalance;
        // Then download PDF
        this.resumeService.downloadPdf(app.resumeId).subscribe({
          next: blob => {
            app._loading = false;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `applicant-resume-${app.resumeId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            this.snack.open('PDF downloaded — 15 points deducted', 'OK', { duration: 3000 });
          },
          error: err => {
            app._loading = false;
            this.snack.open(err.error?.message ?? 'Failed to download', 'Close', { duration: 4000 });
          }
        });
      },
      error: err => {
        app._loading = false;
        const msg = err.status === 402 ? 'Insufficient points to download PDF (need 15)' : (err.error?.message ?? 'Failed');
        this.snack.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  unlockPhone(app: any): void {
    app._loading = true;
    this.walletService.unlockContact(app.jobSeekerId).subscribe({
      next: res => {
        app._loading = false;
        app._phoneUnlocked = true;
        // Phone is stored in application — show it
        app._phone = app.phoneNumber || 'Contact via email';
        this.walletBalance = (this.walletBalance ?? 0) - 10;
        this.snack.open('Phone number unlocked — 10 points deducted', 'OK', { duration: 3000 });
      },
      error: err => {
        app._loading = false;
        const msg = err.status === 402 ? 'Insufficient points to unlock phone (need 10)' : (err.error?.message ?? 'Failed');
        this.snack.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  shortlist(app: any): void {
    const doShortlist = () => {
      this.appService.updateStatus(app.id, 'Shortlisted').subscribe({
        next: () => { app.status = 'Shortlisted'; this.snack.open('Shortlisted!', 'OK', { duration: 2000 }); },
        error: err => this.snack.open(err.error?.message ?? 'Failed', 'Close', { duration: 3000 })
      });
    };
    if (app.status === 'Submitted') {
      this.appService.updateStatus(app.id, 'Reviewed').subscribe({
        next: () => { app.status = 'Reviewed'; doShortlist(); },
        error: err => this.snack.open(err.error?.message ?? 'Failed', 'Close', { duration: 3000 })
      });
    } else doShortlist();
  }

  reject(app: any): void {
    this.appService.updateStatus(app.id, 'Rejected').subscribe({
      next: () => { app.status = 'Rejected'; this.snack.open('Rejected', 'OK', { duration: 2000 }); },
      error: err => this.snack.open(err.error?.message ?? 'Failed', 'Close', { duration: 3000 })
    });
  }
}
