import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTabsModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule, MatTableModule, MatMenuModule, MatDividerModule],
  template: `
    <div class="admin-layout">

      <!-- Sidebar -->
      <aside class="admin-sidebar">
        <div class="sidebar-brand">
          <mat-icon>admin_panel_settings</mat-icon>
          <span>Admin Panel</span>
        </div>
        <nav>
          <button class="sidebar-item" [class.active]="activeTab() === 'moderation'" (click)="activeTab.set('moderation')">
            <mat-icon>fact_check</mat-icon> Job Moderation
            <span class="badge" *ngIf="queue.length > 0">{{ queue.length }}</span>
          </button>
          <button class="sidebar-item" [class.active]="activeTab() === 'users'" (click)="activeTab.set('users')">
            <mat-icon>people</mat-icon> Users
          </button>
          <button class="sidebar-item" [class.active]="activeTab() === 'logs'" (click)="activeTab.set('logs')">
            <mat-icon>history</mat-icon> Audit Logs
          </button>
        </nav>
      </aside>

      <!-- Main content -->
      <main class="admin-main">

        <!-- Stats row -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon pending"><mat-icon>pending_actions</mat-icon></div>
            <div class="stat-value">{{ queue.length }}</div>
            <div class="stat-label">Pending Jobs</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon users"><mat-icon>people</mat-icon></div>
            <div class="stat-value">{{ users.length }}</div>
            <div class="stat-label">Total Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon logs"><mat-icon>receipt_long</mat-icon></div>
            <div class="stat-value">{{ logs.length }}</div>
            <div class="stat-label">Audit Events</div>
          </div>
        </div>

        <!-- ── JOB MODERATION ── -->
        <div *ngIf="activeTab() === 'moderation'">
          <div class="section-header">
            <h2><mat-icon>fact_check</mat-icon> Job Moderation Queue</h2>
            <button class="refresh-btn" (click)="loadQueue()">
              <mat-icon>refresh</mat-icon> Refresh
            </button>
          </div>

          <div *ngIf="loadingQueue" class="loading-center"><mat-spinner diameter="36"></mat-spinner></div>

          <div *ngIf="!loadingQueue && queue.length === 0" class="empty-state">
            <mat-icon>check_circle</mat-icon>
            <h3>All clear!</h3>
            <p>No jobs pending moderation</p>
          </div>

          <div class="job-queue" *ngIf="!loadingQueue && queue.length > 0">
            <div *ngFor="let job of queue" class="queue-card">
              <div class="queue-card-header">
                <div class="queue-job-icon">{{ job.title?.charAt(0) ?? 'J' }}</div>
                <div class="queue-job-info">
                  <h3>{{ job.title }}</h3>
                  <div class="queue-meta">
                    <span><mat-icon>location_on</mat-icon>{{ job.location }}</span>
                    <span><mat-icon>work</mat-icon>{{ job.jobType }}</span>
                    <span *ngIf="job.salaryMin"><mat-icon>payments</mat-icon>₹{{ job.salaryMin | number }} – ₹{{ job.salaryMax | number }}</span>
                    <span><mat-icon>schedule</mat-icon>{{ job.createdAt | date:'mediumDate' }}</span>
                  </div>
                </div>
                <span class="status-chip pending">Pending Review</span>
              </div>

              <p class="queue-desc">{{ job.description | slice:0:200 }}{{ job.description?.length > 200 ? '...' : '' }}</p>

              <div class="queue-actions">
                <button class="approve-btn" (click)="approveJob(job)" [disabled]="job._loading">
                  <mat-spinner diameter="16" *ngIf="job._loading === 'approve'"></mat-spinner>
                  <mat-icon *ngIf="job._loading !== 'approve'">check_circle</mat-icon>
                  Approve
                </button>
                <button class="flag-btn" (click)="flagJob(job)" [disabled]="job._loading">
                  <mat-spinner diameter="16" *ngIf="job._loading === 'flag'"></mat-spinner>
                  <mat-icon *ngIf="job._loading !== 'flag'">flag</mat-icon>
                  Flag / Reject
                </button>
                <span class="job-id">ID: {{ job.id | slice:0:12 }}...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── USERS ── -->
        <div *ngIf="activeTab() === 'users'">
          <div class="section-header">
            <h2><mat-icon>people</mat-icon> User Management</h2>
            <button mat-stroked-button (click)="loadUsers()">
              <mat-icon>refresh</mat-icon> Refresh
            </button>
          </div>

          <div *ngIf="loadingUsers" class="loading-center"><mat-spinner diameter="36"></mat-spinner></div>

          <div class="users-table-wrap" *ngIf="!loadingUsers">
            <table mat-table [dataSource]="users" class="users-table">
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>User</th>
                <td mat-cell *matCellDef="let u">
                  <div class="user-cell">
                    <div class="user-avatar">{{ u.email?.charAt(0)?.toUpperCase() }}</div>
                    <div>
                      <div class="fw-600">{{ u.email }}</div>
                      <div class="text-muted text-sm">{{ u.id | slice:0:16 }}...</div>
                    </div>
                  </div>
                </td>
              </ng-container>
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let u">
                  <span class="role-chip" [class]="'role-' + u.role?.toLowerCase()">{{ u.role }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="verified">
                <th mat-header-cell *matHeaderCellDef>Email Verified</th>
                <td mat-cell *matCellDef="let u">
                  <mat-icon [style.color]="u.emailVerified ? '#16a34a' : '#dc2626'">
                    {{ u.emailVerified ? 'verified' : 'cancel' }}
                  </mat-icon>
                </td>
              </ng-container>
              <ng-container matColumnDef="joined">
                <th mat-header-cell *matHeaderCellDef>Joined</th>
                <td mat-cell *matCellDef="let u">{{ u.createdAt | date:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let u">
                  <button mat-icon-button [matMenuTriggerFor]="userMenu" [matMenuTriggerData]="{user: u}">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="userCols"></tr>
              <tr mat-row *matRowDef="let row; columns: userCols;"></tr>
            </table>
            <p *ngIf="users.length === 0" class="empty-msg">No users found.</p>
          </div>

          <mat-menu #userMenu="matMenu">
            <ng-template matMenuContent let-user="user">
              <button mat-menu-item (click)="setRole(user, 'JobSeeker')"><mat-icon>person</mat-icon> Set as JobSeeker</button>
              <button mat-menu-item (click)="setRole(user, 'Recruiter')"><mat-icon>business_center</mat-icon> Set as Recruiter</button>
              <button mat-menu-item (click)="setRole(user, 'Admin')"><mat-icon>admin_panel_settings</mat-icon> Set as Admin</button>
              <mat-divider></mat-divider>
              <button mat-menu-item class="delete-item" (click)="deleteUser(user)">
                <mat-icon color="warn">delete</mat-icon> Delete User
              </button>
            </ng-template>
          </mat-menu>
        </div>

        <!-- ── AUDIT LOGS ── -->
        <div *ngIf="activeTab() === 'logs'">
          <div class="section-header">
            <h2><mat-icon>history</mat-icon> Audit Logs</h2>
            <button mat-stroked-button (click)="loadLogs()">
              <mat-icon>refresh</mat-icon> Refresh
            </button>
          </div>

          <div *ngIf="loadingLogs" class="loading-center"><mat-spinner diameter="36"></mat-spinner></div>

          <div class="logs-list" *ngIf="!loadingLogs">
            <div *ngFor="let log of logs" class="log-row">
              <div class="log-icon"><mat-icon>history</mat-icon></div>
              <div class="log-body">
                <div class="log-action">{{ log.action }}</div>
                <div class="log-meta text-muted text-sm">
                  {{ log.targetType }} · {{ log.createdAt | date:'medium' }}
                </div>
              </div>
              <span class="log-target text-muted text-sm">{{ log.targetId | slice:0:12 }}...</span>
            </div>
            <p *ngIf="logs.length === 0" class="empty-msg">No audit logs yet.</p>
          </div>
        </div>

      </main>
    </div>
  `,
  styles: [`
    /* Layout */
    .admin-layout { display: flex; min-height: calc(100vh - 64px); }

    /* Sidebar */
    .admin-sidebar {
      width: 240px; min-width: 240px;
      background: #0f172a; color: white;
      display: flex; flex-direction: column;
    }
    .sidebar-brand {
      display: flex; align-items: center; gap: 10px;
      padding: 22px 20px 18px;
      font-size: 1rem; font-weight: 800; color: #f1f5f9;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      letter-spacing: -0.3px;
    }
    .sidebar-brand mat-icon { color: #60a5fa; font-size: 22px; width: 22px; height: 22px; }
    .sidebar-item {
      display: flex; align-items: center; gap: 10px;
      width: 100%; padding: 11px 20px; background: none; border: none;
      color: #94a3b8; font-size: 0.875rem; font-weight: 500;
      cursor: pointer; text-align: left;
      transition: all 0.15s; position: relative;
      font-family: 'Inter', sans-serif;
    }
    .sidebar-item mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .sidebar-item:hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }
    .sidebar-item.active {
      background: rgba(96,165,250,0.12); color: #60a5fa;
      border-right: 3px solid #60a5fa;
    }
    .badge {
      margin-left: auto; background: #ef4444; color: white;
      border-radius: 10px; padding: 1px 7px; font-size: 0.68rem; font-weight: 700;
    }

    /* Main */
    .admin-main { flex: 1; padding: 28px 32px; background: #f8fafc; overflow-x: hidden; }

    /* Stats */
    .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 28px; }
    .stat-card {
      background: white; border-radius: 14px; padding: 20px 22px;
      display: flex; align-items: center; gap: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      transition: box-shadow 0.2s;
    }
    .stat-card:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
    .stat-icon { width: 50px; height: 50px; border-radius: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .stat-icon.pending  { background: #fef3c7; }
    .stat-icon.pending mat-icon  { color: #d97706; }
    .stat-icon.users    { background: #dbeafe; }
    .stat-icon.users mat-icon    { color: #2563eb; }
    .stat-icon.logs     { background: #dcfce7; }
    .stat-icon.logs mat-icon     { color: #16a34a; }
    .stat-text { }
    .stat-value { font-size: 2rem; font-weight: 800; color: #0f172a; line-height: 1; font-family: 'Inter Tight', sans-serif; }
    .stat-label { font-size: 0.78rem; color: #64748b; margin-top: 3px; font-weight: 500; }

    /* Section header */
    .section-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px; padding-bottom: 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    .section-header h2 {
      display: flex; align-items: center; gap: 8px;
      font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0;
    }
    .section-header h2 mat-icon { color: #2563eb; font-size: 20px; width: 20px; height: 20px; }
    .refresh-btn {
      display: flex; align-items: center; gap: 6px;
      background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 9px;
      padding: 8px 14px; font-size: 0.8rem; font-weight: 600; color: #475569;
      cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s;
    }
    .refresh-btn:hover { background: #e2e8f0; }
    .refresh-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Job queue */
    .job-queue { display: flex; flex-direction: column; gap: 16px; }
    .queue-card {
      background: white; border-radius: 14px; padding: 20px 22px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
      border-left: 4px solid #f59e0b;
      transition: box-shadow 0.2s;
    }
    .queue-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
    .queue-card-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 12px; }
    .queue-job-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: linear-gradient(135deg, #1d4ed8, #06b6d4);
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1.2rem; flex-shrink: 0;
    }
    .queue-job-info { flex: 1; }
    .queue-job-info h3 { font-size: 1.05rem; font-weight: 800; margin-bottom: 6px; color: #0f172a; }
    .queue-meta { display: flex; flex-wrap: wrap; gap: 12px; }
    .queue-meta span { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: #64748b; }
    .queue-meta mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .queue-desc {
      color: #334155; font-size: 0.875rem; line-height: 1.6; margin-bottom: 16px;
      background: #f8fafc; border-radius: 9px; padding: 12px 14px;
      border: 1px solid #f1f5f9;
    }
    .queue-actions { display: flex; align-items: center; gap: 10px; }
    .approve-btn {
      display: flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #10b981, #059669); color: #fff;
      border: none; border-radius: 9px; padding: 9px 18px;
      font-size: 0.85rem; font-weight: 700; cursor: pointer;
      font-family: 'Inter', sans-serif; transition: all 0.2s;
      box-shadow: 0 3px 10px rgba(16,185,129,0.3);
    }
    .approve-btn:hover { box-shadow: 0 5px 15px rgba(16,185,129,0.45); transform: translateY(-1px); }
    .approve-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .flag-btn {
      display: flex; align-items: center; gap: 6px;
      background: #fff; border: 1.5px solid #ef4444; border-radius: 9px;
      padding: 9px 18px; font-size: 0.85rem; font-weight: 700;
      color: #ef4444; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;
    }
    .flag-btn:hover { background: #fee2e2; }
    .flag-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .approve-btn mat-icon, .flag-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .job-id { margin-left: auto; font-size: 0.72rem; color: #94a3b8; }
    .status-chip { padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
    .status-chip.pending { background: #fef3c7; color: #d97706; margin-left: auto; }

    /* Users table */
    .users-table-wrap {
      background: white; border-radius: 14px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .users-table { width: 100%; }
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #1d4ed8, #06b6d4);
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
    }
    .user-email { font-size: 0.875rem; font-weight: 600; color: #0f172a; }
    .user-id-sub { font-size: 0.72rem; color: #94a3b8; margin-top: 1px; }
    .role-chip { padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .role-jobseeker { background: #dbeafe; color: #1d4ed8; }
    .role-recruiter  { background: #dcfce7; color: #15803d; }
    .role-admin      { background: #fef3c7; color: #b45309; }
    .delete-item { color: #ef4444 !important; }

    /* Logs */
    .logs-list { display: flex; flex-direction: column; gap: 8px; }
    .log-row {
      display: flex; align-items: center; gap: 14px;
      background: white; border-radius: 11px; padding: 14px 18px;
      border: 1px solid #e2e8f0; transition: border-color 0.15s;
    }
    .log-row:hover { border-color: #93c5fd; }
    .log-icon {
      width: 36px; height: 36px; border-radius: 9px;
      background: #f1f5f9; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .log-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: #64748b; }
    .log-body { flex: 1; }
    .log-action { font-weight: 700; font-size: 0.88rem; color: #0f172a; }
    .log-meta { font-size: 0.75rem; color: #64748b; margin-top: 2px; }
    .log-target { font-size: 0.72rem; color: #94a3b8; }

    /* States */
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { text-align: center; padding: 60px; }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; display: block; margin: 0 auto 12px; color: #94a3b8; opacity: 0.5; }
    .empty-state h3 { font-size: 1.1rem; color: #475569; margin-bottom: 6px; }
    .empty-state p { color: #94a3b8; }
    .empty-msg { text-align: center; color: #94a3b8; padding: 32px; }
    .fw-600 { font-weight: 600; }

    @media (max-width: 768px) {
      .admin-sidebar { display: none; }
      .stats-row { grid-template-columns: 1fr; }
      .admin-main { padding: 16px; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private snack = inject(MatSnackBar);

  activeTab = signal<'moderation' | 'users' | 'logs'>('moderation');

  queue: any[] = [];
  users: any[] = [];
  logs: any[] = [];

  loadingQueue = false;
  loadingUsers = false;
  loadingLogs = false;

  userCols = ['email', 'role', 'verified', 'joined', 'actions'];

  ngOnInit(): void {
    this.loadQueue();
    this.loadUsers();
    this.loadLogs();
  }

  loadQueue(): void {
    this.loadingQueue = true;
    this.adminService.getModerationQueue().subscribe({
      next: res => { this.loadingQueue = false; this.queue = res.data ?? []; },
      error: () => { this.loadingQueue = false; }
    });
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.adminService.getUsers().subscribe({
      next: res => { this.loadingUsers = false; this.users = res.data ?? []; },
      error: () => { this.loadingUsers = false; }
    });
  }

  loadLogs(): void {
    this.loadingLogs = true;
    this.adminService.getAuditLogs().subscribe({
      next: res => { this.loadingLogs = false; this.logs = res.data ?? []; },
      error: () => { this.loadingLogs = false; }
    });
  }

  approveJob(job: any): void {
    job._loading = 'approve';
    this.adminService.approveJob(job.id).subscribe({
      next: () => {
        this.queue = this.queue.filter(j => j.id !== job.id);
        this.snack.open(`"${job.title}" approved — now live`, 'OK', { duration: 4000 });
      },
      error: err => {
        job._loading = null;
        this.snack.open(err.error?.message ?? 'Failed to approve', 'Close', { duration: 3000 });
      }
    });
  }

  flagJob(job: any): void {
    job._loading = 'flag';
    this.adminService.flagJob(job.id).subscribe({
      next: () => {
        this.queue = this.queue.filter(j => j.id !== job.id);
        this.snack.open(`"${job.title}" flagged and removed`, 'OK', { duration: 4000 });
      },
      error: err => {
        job._loading = null;
        this.snack.open(err.error?.message ?? 'Failed to flag', 'Close', { duration: 3000 });
      }
    });
  }

  setRole(user: any, role: string): void {
    this.adminService.updateUserRole(user.id, role).subscribe({
      next: () => {
        user.role = role;
        this.snack.open(`${user.email} is now ${role}`, 'OK', { duration: 3000 });
      },
      error: err => this.snack.open(err.error?.message ?? 'Failed', 'Close', { duration: 3000 })
    });
  }

  deleteUser(user: any): void {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.snack.open('User deleted', 'OK', { duration: 3000 });
      },
      error: err => this.snack.open(err.error?.message ?? 'Failed', 'Close', { duration: 3000 })
    });
  }
}
