import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { ResumeService } from '../../../core/services/resume.service';

@Component({
  selector: 'app-seeker-resumes',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatMenuModule],
  template: `
    <div class="page-wrap">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>My Resumes</h1>
          <p class="text-muted">Build, manage and download your professional resumes</p>
        </div>
        <a mat-raised-button color="primary" routerLink="/seeker/resumes/new">
          <mat-icon>add</mat-icon> Create Resume
        </a>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-center">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && resumes.length === 0" class="empty-state">
        <div class="empty-icon"><mat-icon>description</mat-icon></div>
        <h3>No resumes yet</h3>
        <p>Create your first resume to start applying for jobs</p>
        <a mat-raised-button color="primary" routerLink="/seeker/resumes/new">
          <mat-icon>add</mat-icon> Create Your First Resume
        </a>
      </div>

      <!-- Resume grid -->
      <div class="resume-grid" *ngIf="!loading && resumes.length > 0">

        <!-- Add new card -->
        <a routerLink="/seeker/resumes/new" class="add-card">
          <mat-icon>add_circle_outline</mat-icon>
          <span>Create New Resume</span>
        </a>

        <!-- Resume cards -->
        <div *ngFor="let resume of resumes" class="resume-card">
          <div class="resume-card-top">
            <div class="resume-icon">
              <mat-icon>description</mat-icon>
            </div>
            <button mat-icon-button class="more-btn" [matMenuTriggerFor]="resumeMenu"
              [matMenuTriggerData]="{resume: resume}" (click)="$event.stopPropagation()">
              <mat-icon>more_vert</mat-icon>
            </button>
          </div>

          <h3 class="resume-title">{{ resume.title }}</h3>
          <p class="resume-summary text-muted text-sm" *ngIf="resume.summary">
            {{ resume.summary | slice:0:90 }}{{ resume.summary?.length > 90 ? '...' : '' }}
          </p>
          <p class="text-muted text-sm" *ngIf="!resume.summary">No summary added</p>

          <div class="resume-tags">
            <span class="tag" *ngIf="resume.experiences?.length">
              <mat-icon>work</mat-icon>{{ resume.experiences.length }} exp
            </span>
            <span class="tag" *ngIf="resume.skills?.length">
              <mat-icon>psychology</mat-icon>{{ resume.skills.length }} skills
            </span>
            <span class="tag" *ngIf="resume.educations?.length">
              <mat-icon>school</mat-icon>{{ resume.educations.length }} edu
            </span>
            <span class="template-tag">{{ resume.templateId ?? 'Classic' }}</span>
          </div>

          <div class="resume-footer">
            <span class="updated-date text-muted text-sm">
              <mat-icon>update</mat-icon>
              {{ resume.updatedAt | date:'mediumDate' }}
            </span>
          </div>

          <div class="resume-actions">
            <a mat-stroked-button [routerLink]="['/seeker/resumes', resume.id, 'edit']" class="action-btn">
              <mat-icon>edit</mat-icon> Edit
            </a>
            <button mat-raised-button color="primary" class="action-btn"
              (click)="downloadPdf(resume)" [disabled]="resume._downloading">
              <mat-spinner diameter="16" *ngIf="resume._downloading"></mat-spinner>
              <mat-icon *ngIf="!resume._downloading">download</mat-icon>
              {{ resume._downloading ? 'Generating...' : 'Download PDF' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Context menu -->
      <mat-menu #resumeMenu="matMenu">
        <ng-template matMenuContent let-resume="resume">
          <a mat-menu-item [routerLink]="['/seeker/resumes', resume.id, 'edit']">
            <mat-icon>edit</mat-icon> Edit Resume
          </a>
          <button mat-menu-item (click)="downloadPdf(resume)">
            <mat-icon>download</mat-icon> Download PDF
          </button>
        </ng-template>
      </mat-menu>
    </div>
  `,
  styles: [`
    .page-wrap { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .page-header h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: 4px; }

    /* Grid */
    .resume-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

    /* Add card */
    .add-card {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px; min-height: 260px; border: 2px dashed #d1d5db; border-radius: 14px;
      color: #9ca3af; text-decoration: none; cursor: pointer; transition: all 0.2s;
      background: white;
    }
    .add-card:hover { border-color: #1976d2; color: #1976d2; text-decoration: none; background: #eff6ff; }
    .add-card mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .add-card span { font-weight: 600; font-size: 0.9rem; }

    /* Resume card */
    .resume-card {
      background: white; border-radius: 14px; padding: 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07); border: 1px solid #e5e7eb;
      display: flex; flex-direction: column; gap: 10px;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .resume-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.1); transform: translateY(-2px); }

    .resume-card-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .resume-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      display: flex; align-items: center; justify-content: center;
    }
    .resume-icon mat-icon { color: #1976d2; font-size: 24px; width: 24px; height: 24px; }
    .more-btn { color: #9ca3af; }

    .resume-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
    .resume-summary { margin: 0; line-height: 1.5; }

    /* Tags */
    .resume-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag {
      display: flex; align-items: center; gap: 3px;
      background: #f3f4f6; color: #374151;
      padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 500;
    }
    .tag mat-icon { font-size: 12px; width: 12px; height: 12px; }
    .template-tag {
      background: #eff6ff; color: #1976d2;
      padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;
      margin-left: auto;
    }

    /* Footer */
    .resume-footer { display: flex; align-items: center; }
    .updated-date { display: flex; align-items: center; gap: 4px; }
    .updated-date mat-icon { font-size: 13px; width: 13px; height: 13px; }

    /* Actions */
    .resume-actions { display: flex; gap: 8px; margin-top: 4px; }
    .action-btn { flex: 1; font-size: 0.82rem !important; }

    /* States */
    .loading-center { display: flex; justify-content: center; padding: 80px; }
    .empty-state { text-align: center; padding: 80px 24px; }
    .empty-icon { width: 80px; height: 80px; border-radius: 20px; background: #eff6ff; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
    .empty-icon mat-icon { font-size: 40px; width: 40px; height: 40px; color: #1976d2; }
    .empty-state h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; }
    .empty-state p { color: #6b7280; margin-bottom: 24px; }

    .text-muted { color: #6b7280; }
    .text-sm { font-size: 0.8rem; }

    @media (max-width: 600px) {
      .resume-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 16px; }
    }
  `]
})
export class SeekerResumesComponent implements OnInit {
  private resumeService = inject(ResumeService);
  private snack = inject(MatSnackBar);

  resumes: any[] = [];
  loading = false;

  ngOnInit(): void {
    this.loading = true;
    this.resumeService.getMyResumes().subscribe({
      next: res => {
        this.loading = false;
        this.resumes = res.data ?? [];
      },
      error: err => {
        this.loading = false;
        this.snack.open(err.error?.message ?? 'Failed to load resumes', 'Close', { duration: 4000 });
      }
    });
  }

  downloadPdf(resume: any): void {
    resume._downloading = true;
    this.resumeService.downloadPdf(resume.id).subscribe({
      next: blob => {
        resume._downloading = false;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${resume.title ?? 'resume'}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.snack.open('PDF downloaded!', 'OK', { duration: 3000 });
      },
      error: err => {
        resume._downloading = false;
        this.snack.open(
          err.status === 404 ? 'PDF generation not available for this resume' : 'Failed to download PDF',
          'Close', { duration: 4000 }
        );
      }
    });
  }
}
