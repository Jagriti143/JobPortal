import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { ApplicationService } from '../../../core/services/application.service';

@Component({
  selector: 'app-seeker-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="seeker-shell">

      <!-- â”€â”€ Sidebar â”€â”€ -->
      <aside class="seeker-sidebar">
        <div class="sidebar-top">
          <a routerLink="/" class="sidebar-logo">
            <div class="sidebar-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" fill="white" opacity="0.9"/>
                <path d="M16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V7" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="sidebar-logo-text">JobPortal</span>
          </a>

          <!-- User info -->
          <div class="sidebar-user">
            <div class="sidebar-avatar">
              {{ (auth.user$ | async)?.email?.charAt(0)?.toUpperCase() ?? 'U' }}
            </div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">{{ (auth.user$ | async)?.displayName || ((auth.user$ | async)?.email?.split('@')?.[0]) }}</div>
              <div class="sidebar-user-role">
                <span class="role-dot"></span> Job Seeker
              </div>
            </div>
          </div>
        </div>

        <!-- Nav -->
        <nav class="sidebar-nav">
          <div class="sidebar-section-label">Main</div>
          <button class="sidebar-item" [class.sidebar-active]="activeTab === 'overview'" (click)="activeTab = 'overview'">
            <mat-icon>dashboard</mat-icon> <span>Overview</span>
          </button>
          <button class="sidebar-item" [class.sidebar-active]="activeTab === 'applications'" (click)="activeTab = 'applications'">
            <mat-icon>send</mat-icon> <span>My Applications</span>
            <span class="sidebar-badge" *ngIf="applications.length > 0">{{ applications.length }}</span>
          </button>
          <button class="sidebar-item" [class.sidebar-active]="activeTab === 'saved'" (click)="activeTab = 'saved'">
            <mat-icon>bookmark</mat-icon> <span>Saved Jobs</span>
          </button>

          <div class="sidebar-section-label">Tools</div>
          <a class="sidebar-item" routerLink="/seeker/resumes">
            <mat-icon>description</mat-icon> <span>My Resumes</span>
          </a>
          <a class="sidebar-item" routerLink="/jobs">
            <mat-icon>search</mat-icon> <span>Find Jobs</span>
          </a>
          <a class="sidebar-item" routerLink="/profile">
            <mat-icon>manage_accounts</mat-icon> <span>Profile</span>
          </a>
        </nav>

        <div class="sidebar-bottom">
          <a class="sidebar-item sidebar-logout" routerLink="/auth/login" (click)="auth.logout()">
            <mat-icon>logout</mat-icon> <span>Sign Out</span>
          </a>
        </div>
      </aside>

      <!-- â”€â”€ Main â”€â”€ -->
      <main class="seeker-main">

        <!-- Top bar -->
        <div class="seeker-topbar">
          <div>
            <h1 class="topbar-title">
              Good {{ getGreeting() }}, {{ (auth.user$ | async)?.displayName || 'there' }}! ðŸ‘‹
            </h1>
            <p class="topbar-sub">Here's what's happening with your job search today.</p>
          </div>
          <div class="topbar-actions">
            <a routerLink="/jobs" class="topbar-btn topbar-btn-ghost">
              <mat-icon>search</mat-icon> Browse Jobs
            </a>
            <a routerLink="/seeker/resumes/new" class="topbar-btn topbar-btn-primary">
              <mat-icon>add</mat-icon> New Resume
            </a>
          </div>
        </div>

        <!-- â”€â”€ Stats cards â”€â”€ -->
        <div class="stats-grid">
          <div *ngFor="let stat of statsCards" class="stat-card stat-card-dark">
            <div class="stat-icon-wrap" [style.background]="stat.bg">
              <mat-icon [style.color]="stat.color">{{ stat.icon }}</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-trend" [class.stat-up]="stat.trendUp">
                <mat-icon>{{ stat.trendUp ? 'trending_up' : 'trending_flat' }}</mat-icon>
                {{ stat.trend }}
              </div>
            </div>
          </div>
        </div>

        <!-- â”€â”€ OVERVIEW TAB â”€â”€ -->
        <div *ngIf="activeTab === 'overview'">
          <!-- Application Pipeline -->
          <div class="content-card">
            <div class="content-card-header">
              <h3><mat-icon>timeline</mat-icon> Application Pipeline</h3>
              <button class="view-all-link" (click)="activeTab = 'applications'">View all â†’</button>
            </div>
            <div class="pipeline">
              <div *ngFor="let stage of pipeline; let last = last" class="pipeline-item">
                <div class="pipeline-stage">
                  <div class="pipeline-count" [style.color]="stage.color">{{ stage.count }}</div>
                  <div class="pipeline-label">{{ stage.label }}</div>
                  <div class="pipeline-bar" [style.background]="stage.color + '22'">
                    <div class="pipeline-fill" [style.background]="stage.color" [style.width]="(stage.count / 10 * 100) + '%'"></div>
                  </div>
                </div>
                <mat-icon class="pipeline-arrow" *ngIf="!last">chevron_right</mat-icon>
              </div>
            </div>
          </div>

          <!-- Recommended Jobs -->
          <div class="content-card">
            <div class="content-card-header">
              <h3><mat-icon>auto_awesome</mat-icon> Recommended Jobs</h3>
              <a routerLink="/jobs" class="view-all-link">View all â†’</a>
            </div>
            <div class="job-recommendations">
              <div *ngFor="let job of recommendedJobs" class="rec-job-card">
                <div class="rec-job-logo">{{ job.company.charAt(0) }}</div>
                <div class="rec-job-info">
                  <div class="rec-job-title">{{ job.title }}</div>
                  <div class="rec-job-meta">
                    <span>{{ job.company }}</span>
                    <span class="dot">Â·</span>
                    <span>{{ job.location }}</span>
                    <span class="dot">Â·</span>
                    <span>{{ job.salary }}</span>
                  </div>
                  <div class="rec-job-tags">
                    <span class="tag-chip" *ngFor="let tag of job.tags">{{ tag }}</span>
                  </div>
                </div>
                <div class="rec-job-right">
                  <span class="match-badge">{{ job.match }}% match</span>
                  <a routerLink="/jobs" class="apply-btn">Apply <mat-icon>arrow_forward</mat-icon></a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- â”€â”€ APPLICATIONS TAB â”€â”€ -->
        <div *ngIf="activeTab === 'applications'">
          <div class="content-card">
            <div class="content-card-header">
              <h3><mat-icon>send</mat-icon> My Applications</h3>
              <div class="tab-filters">
                <button class="tab-filter" [class.active]="appFilter === ''" (click)="filterApps('')">All</button>
                <button class="tab-filter" [class.active]="appFilter === 'Submitted'" (click)="filterApps('Submitted')">Submitted</button>
                <button class="tab-filter" [class.active]="appFilter === 'Shortlisted'" (click)="filterApps('Shortlisted')">Shortlisted</button>
                <button class="tab-filter" [class.active]="appFilter === 'Rejected'" (click)="filterApps('Rejected')">Rejected</button>
              </div>
            </div>

            <div *ngIf="loading" class="loading-center">
              <mat-spinner diameter="36" color="accent"></mat-spinner>
            </div>

            <div *ngIf="!loading && filteredApps().length === 0" class="empty-block">
              <div class="empty-icon-wrap">
                <mat-icon>send</mat-icon>
              </div>
              <h4>No applications yet</h4>
              <p>Start applying to jobs to track your progress here</p>
              <a routerLink="/jobs" class="topbar-btn topbar-btn-primary" style="display:inline-flex; margin-top:16px; width:auto;">
                <mat-icon>search</mat-icon> Find Jobs to Apply
              </a>
            </div>

            <div class="app-list" *ngIf="!loading && filteredApps().length > 0">
              <div *ngFor="let app of filteredApps()" class="app-row">
                <div class="app-logo">{{ (app.job?.title || 'J').charAt(0) }}</div>
                <div class="app-info">
                  <div class="app-title">{{ app.job?.title || 'Position #' + app.jobId?.slice(0,8) }}</div>
                  <div class="app-meta">
                    <mat-icon>schedule</mat-icon>
                    Applied {{ app.appliedAt | date:'mediumDate' }}
                  </div>
                </div>
                <div class="app-status">
                  <span class="status-pill" [class]="getStatusClass(app.status)">
                    <span class="status-dot"></span>
                    {{ app.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- â”€â”€ SAVED TAB â”€â”€ -->
        <div *ngIf="activeTab === 'saved'">
          <div class="content-card">
            <div class="content-card-header">
              <h3><mat-icon>bookmark</mat-icon> Saved Jobs</h3>
            </div>
            <div class="empty-block">
              <div class="empty-icon-wrap">
                <mat-icon>bookmark_border</mat-icon>
              </div>
              <h4>No saved jobs yet</h4>
              <p>Browse jobs and save the ones you're interested in</p>
              <a routerLink="/jobs" class="topbar-btn topbar-btn-primary" style="display:inline-flex; margin-top:16px; width:auto;">
                <mat-icon>search</mat-icon> Browse Jobs
              </a>
            </div>
          </div>
        </div>

      </main>
    </div>
  `,
  styles: [`
    .seeker-shell { display:flex;min-height:calc(100vh - 70px);background:#fafaf8 }
    .seeker-sidebar { width:256px;min-width:256px;background:#1a2e12;border-right:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;position:sticky;top:70px;height:calc(100vh - 70px);overflow-y:auto }
    .sidebar-top { padding:20px 16px;border-bottom:1px solid rgba(255,255,255,.08) }
    .sidebar-logo { display:flex;align-items:center;gap:8px;text-decoration:none;margin-bottom:20px }
    .sidebar-logo-icon { width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#6b8660,#8a9e80);display:flex;align-items:center;justify-content:center }
    .sidebar-logo-text { font-weight:800;color:#fff;font-size:.9rem }
    .sidebar-user { display:flex;align-items:center;gap:10px }
    .sidebar-avatar { width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#6b8660,#8a9e80);color:#fff;font-weight:700;font-size:.9rem;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
    .sidebar-user-name { font-size:.85rem;font-weight:700;color:#f1f5f9 }
    .sidebar-user-role { display:flex;align-items:center;gap:5px;font-size:.72rem;color:rgba(255,255,255,.5);margin-top:2px }
    .role-dot { width:5px;height:5px;border-radius:50%;background:#8a9e80 }
    .sidebar-nav { flex:1;padding:12px 10px;display:flex;flex-direction:column;gap:2px }
    .sidebar-section-label { font-size:.65rem;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1px;padding:12px 10px 4px }
    .sidebar-item { display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:9px;background:none;border:none;cursor:pointer;color:rgba(255,255,255,.55);font-size:.875rem;font-weight:500;text-decoration:none;transition:all .15s;position:relative;text-align:left;width:100%;font-family:'Inter',sans-serif }
    .sidebar-item mat-icon { font-size:18px;width:18px;height:18px;flex-shrink:0 }
    .sidebar-item span { flex:1 }
    .sidebar-item:hover { background:rgba(255,255,255,.08);color:#e2e8f0;text-decoration:none }
    .sidebar-active { background:rgba(107,134,96,.25)!important;color:#c5d8bc!important;border-right:3px solid #8a9e80 }
    .sidebar-badge { background:#dc2626;color:#fff;padding:1px 6px;border-radius:10px;font-size:.65rem;font-weight:700 }
    .sidebar-bottom { padding:10px;border-top:1px solid rgba(255,255,255,.08) }
    .sidebar-logout { color:rgba(255,255,255,.5)!important }
    .sidebar-logout:hover { color:#ef4444!important;background:rgba(239,68,68,.08)!important }
    .seeker-main { flex:1;overflow-x:hidden }
    .seeker-topbar { display:flex;justify-content:space-between;align-items:flex-start;padding:28px 32px 0;gap:16px;flex-wrap:wrap }
    .topbar-title { font-size:1.5rem;font-weight:400;color:#1a2e12;margin-bottom:4px;font-family:'DM Serif Display',serif }
    .topbar-sub { color:#64748b;font-size:.875rem }
    .topbar-actions { display:flex;gap:10px }
    .topbar-btn { display:flex;align-items:center;gap:6px;padding:9px 18px;border-radius:9px;font-size:.875rem;font-weight:600;text-decoration:none;transition:all .2s;cursor:pointer;border:none;font-family:'Inter',sans-serif }
    .topbar-btn mat-icon { font-size:16px;width:16px;height:16px }
    .topbar-btn-ghost { background:#f0f7ec;border:1px solid #e8ede4;color:#3d5a30 }
    .topbar-btn-ghost:hover { background:#e8ede4;text-decoration:none;color:#1a2e12 }
    .topbar-btn-primary { background:linear-gradient(135deg,#1a2e12,#2d4a22);color:#fff;box-shadow:0 4px 12px rgba(26,46,18,.2) }
    .topbar-btn-primary:hover { box-shadow:0 6px 18px rgba(26,46,18,.35);transform:translateY(-1px);text-decoration:none;color:#fff }
    .stats-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;padding:24px 32px 0 }
    .stat-card-dark { background:#fff;border:1px solid #e8ede4;border-radius:14px;padding:20px;display:flex;align-items:center;gap:16px;transition:border-color .2s;box-shadow:0 1px 4px rgba(26,46,18,.04) }
    .stat-card-dark:hover { border-color:#c5d8bc }
    .stat-icon-wrap { width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
    .stat-icon-wrap mat-icon { font-size:22px;width:22px;height:22px }
    .stat-number { font-size:1.75rem;font-weight:800;color:#1a2e12;line-height:1;font-family:'DM Serif Display',serif }
    .stat-label { font-size:.75rem;color:#64748b;margin-top:3px }
    .stat-trend { display:flex;align-items:center;gap:3px;font-size:.72rem;color:#64748b;margin-top:5px }
    .stat-trend mat-icon { font-size:13px;width:13px;height:13px }
    .stat-up { color:#16a34a }
    .content-card { background:#fff;border:1px solid #e8ede4;border-radius:16px;margin:20px 32px 0;overflow:hidden;box-shadow:0 1px 4px rgba(26,46,18,.04) }
    .content-card-header { display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #f0f7ec }
    .content-card-header h3 { display:flex;align-items:center;gap:8px;font-size:1rem;font-weight:400;color:#1a2e12;margin:0;font-family:'DM Serif Display',serif }
    .content-card-header h3 mat-icon { font-size:18px;width:18px;height:18px;color:#6b8660 }
    .view-all-link { color:#6b8660;font-size:.82rem;font-weight:600;background:none;border:none;cursor:pointer;text-decoration:none }
    .pipeline { display:flex;align-items:center;padding:20px;gap:4px;flex-wrap:wrap }
    .pipeline-item { display:flex;align-items:center;gap:4px }
    .pipeline-stage { text-align:center;min-width:90px }
    .pipeline-count { font-size:1.5rem;font-weight:800;font-family:'DM Serif Display',serif;margin-bottom:4px }
    .pipeline-label { font-size:.7rem;color:#64748b;margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:.4px }
    .pipeline-bar { height:4px;border-radius:2px;overflow:hidden }
    .pipeline-fill { height:100%;border-radius:2px;transition:width .6s ease }
    .pipeline-arrow { font-size:16px;width:16px;height:16px;color:#c5d8bc;margin-top:-16px }
    .job-recommendations { display:flex;flex-direction:column }
    .rec-job-card { display:flex;align-items:flex-start;gap:14px;padding:16px 20px;border-bottom:1px solid #f0f7ec;transition:background .15s }
    .rec-job-card:last-child { border-bottom:none }
    .rec-job-card:hover { background:#f0f7ec }
    .rec-job-logo { width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#1a2e12,#6b8660);color:#fff;font-weight:700;font-size:1.1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
    .rec-job-info { flex:1 }
    .rec-job-title { font-size:.95rem;font-weight:700;color:#1a2e12;margin-bottom:4px }
    .rec-job-meta { display:flex;align-items:center;gap:6px;font-size:.78rem;color:#64748b;margin-bottom:8px }
    .dot { color:#c5d8bc }
    .rec-job-tags { display:flex;gap:6px;flex-wrap:wrap }
    .tag-chip { background:#f0f7ec;color:#3d5a30;padding:2px 8px;border-radius:6px;font-size:.72rem;font-weight:500;border:1px solid #e8ede4 }
    .rec-job-right { display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0 }
    .match-badge { background:rgba(22,163,74,.1);color:#16a34a;padding:2px 10px;border-radius:100px;font-size:.72rem;font-weight:700 }
    .apply-btn { display:flex;align-items:center;gap:4px;background:rgba(26,46,18,.08);color:#2d4a22;padding:6px 12px;border-radius:8px;font-size:.78rem;font-weight:600;text-decoration:none;transition:all .15s }
    .apply-btn mat-icon { font-size:14px;width:14px;height:14px }
    .apply-btn:hover { background:rgba(26,46,18,.15);color:#1a2e12;text-decoration:none }
    .tab-filters { display:flex;gap:6px }
    .tab-filter { padding:5px 12px;border-radius:7px;border:none;background:#f0f7ec;color:#64748b;font-size:.78rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s }
    .tab-filter:hover { background:#e8ede4;color:#3d5a30 }
    .tab-filter.active { background:rgba(107,134,96,.15);color:#2d4a22 }
    .app-list { display:flex;flex-direction:column }
    .app-row { display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:1px solid #f0f7ec;transition:background .15s }
    .app-row:last-child { border-bottom:none }
    .app-row:hover { background:#f0f7ec }
    .app-logo { width:40px;height:40px;border-radius:10px;background:#f0f7ec;color:#6b8660;font-weight:700;font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid #e8ede4 }
    .app-info { flex:1 }
    .app-title { font-size:.9rem;font-weight:600;color:#1a2e12 }
    .app-meta { display:flex;align-items:center;gap:4px;font-size:.75rem;color:#64748b;margin-top:2px }
    .app-meta mat-icon { font-size:13px;width:13px;height:13px }
    .status-pill { display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:100px;font-size:.72rem;font-weight:700 }
    .status-dot { width:6px;height:6px;border-radius:50%;background:currentColor }
    .status-submitted { background:rgba(37,99,235,.08);color:#2563eb }
    .status-shortlisted { background:rgba(22,163,74,.08);color:#16a34a }
    .status-reviewed { background:rgba(217,119,6,.08);color:#d97706 }
    .status-rejected { background:rgba(220,38,38,.08);color:#dc2626 }
    .status-withdrawn { background:rgba(100,116,139,.08);color:#94a3b8 }
    .empty-block { display:flex;flex-direction:column;align-items:center;text-align:center;padding:60px 32px }
    .empty-icon-wrap { width:72px;height:72px;border-radius:18px;background:#f0f7ec;border:1px solid #e8ede4;display:flex;align-items:center;justify-content:center;margin-bottom:16px }
    .empty-icon-wrap mat-icon { font-size:36px;width:36px;height:36px;color:#6b8660 }
    .empty-block h4 { font-size:1.1rem;font-weight:700;color:#1a2e12;margin-bottom:8px }
    .empty-block p { color:#64748b;font-size:.875rem }
    .loading-center { display:flex;justify-content:center;padding:60px }
    @media(max-width:900px){ .seeker-sidebar{display:none} .stats-grid{grid-template-columns:repeat(2,1fr);padding:16px} .seeker-topbar{padding:20px 16px 0;flex-direction:column} .content-card{margin:16px} }
  `]
})
export class SeekerDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private appService = inject(ApplicationService);

  activeTab = 'overview';
  applications: any[] = [];
  loading = false;
  appFilter = '';

  statsCards = [
    { label: 'Applications Sent', value: '0', icon: 'send', bg: 'rgba(107,134,96,0.12)', color: '#6b8660', trend: 'This month', trendUp: true },
    { label: 'Interview Calls', value: '0', icon: 'call', bg: 'rgba(22,163,74,0.1)', color: '#16a34a', trend: 'Active', trendUp: true },
    { label: 'Shortlisted', value: '0', icon: 'star', bg: 'rgba(217,119,6,0.1)', color: '#d97706', trend: 'Pending review', trendUp: false },
    { label: 'Offers Received', value: '0', icon: 'celebration', bg: 'rgba(45,74,34,0.1)', color: '#2d4a22', trend: 'Lifetime', trendUp: true },
  ];

  pipeline = [
    { label: 'Applied', count: 0, color: '#6b8660' },
    { label: 'Reviewed', count: 0, color: '#d97706' },
    { label: 'Shortlisted', count: 0, color: '#16a34a' },
    { label: 'Interview', count: 0, color: '#2d4a22' },
    { label: 'Offered', count: 0, color: '#059669' },
  ];

  recommendedJobs = [
    { title: 'Senior Frontend Engineer', company: 'Razorpay', location: 'Bangalore / Remote', salary: 'â‚¹25-40L', match: 95, tags: ['React', 'TypeScript', 'Node.js'] },
    { title: 'Product Designer', company: 'Swiggy', location: 'Bangalore', salary: 'â‚¹18-28L', match: 88, tags: ['Figma', 'UX Research', 'Prototyping'] },
    { title: 'Backend Developer', company: 'Zepto', location: 'Mumbai', salary: 'â‚¹20-35L', match: 82, tags: ['Go', 'Microservices', 'AWS'] },
  ];

  ngOnInit() {
    this.loading = true;
    this.appService.getMyApplications().subscribe({
      next: res => {
        this.loading = false;
        this.applications = res.data ?? [];
        this.updateStats();
        this.updatePipeline();
      },
      error: () => { this.loading = false; }
    });
  }

  filteredApps() {
    return this.appFilter
      ? this.applications.filter(a => a.status === this.appFilter)
      : this.applications;
  }

  filterApps(filter: string) { this.appFilter = filter; }

  updateStats() {
    this.statsCards[0].value = this.applications.length.toString();
    this.statsCards[1].value = '0';
    this.statsCards[2].value = this.applications.filter(a => a.status === 'Shortlisted').length.toString();
  }

  updatePipeline() {
    this.pipeline[0].count = this.applications.filter(a => a.status === 'Submitted').length;
    this.pipeline[1].count = this.applications.filter(a => a.status === 'Reviewed').length;
    this.pipeline[2].count = this.applications.filter(a => a.status === 'Shortlisted').length;
  }

  getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  getStatusClass(status: string) {
    const map: Record<string, string> = {
      'Submitted': 'status-submitted',
      'Reviewed': 'status-reviewed',
      'Shortlisted': 'status-shortlisted',
      'Rejected': 'status-rejected',
      'Withdrawn': 'status-withdrawn',
    };
    return map[status] ?? 'status-withdrawn';
  }
}
