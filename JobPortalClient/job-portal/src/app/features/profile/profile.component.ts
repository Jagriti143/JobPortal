import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page-wrap-sm">
      <div class="card profile-card text-center">
        <div class="avatar">
          <mat-icon>person</mat-icon>
        </div>
        <h1>{{ (auth.user$ | async)?.displayName || 'Corporate User' }}</h1>
        <p class="text-muted">{{ (auth.user$ | async)?.email }}</p>
        
        <div class="role-badge mt-16 mb-24">
          <span class="chip status-approved">{{ auth.role }}</span>
        </div>

        <div class="info-details">
          <div class="info-row">
            <span>Account Verified</span>
            <strong>{{ (auth.user$ | async)?.emailVerified ? 'Yes' : 'No' }}</strong>
          </div>
          <div class="info-row">
            <span>Member Since</span>
            <strong>Recently</strong>
          </div>
        </div>

        <div class="mt-24">
          <button mat-raised-button color="primary">Edit Profile Information</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-card { padding:48px;border-top:4px solid #6b8660 }
    .avatar { width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,#1a2e12,#6b8660);color:white;display:flex;align-items:center;justify-content:center;margin:0 auto 24px }
    .avatar mat-icon { font-size:48px;width:48px;height:48px }
    h1 { font-size:2rem;margin-bottom:4px;font-family:'DM Serif Display',serif;font-weight:400;color:#1a2e12 }
    .info-details { max-width:400px;margin:0 auto;background:#f0f7ec;border-radius:8px;padding:16px;text-align:left }
    .info-row { display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #e8ede4 }
    .info-row:last-child { border-bottom:none }
  `]
})
export class ProfileComponent {
  auth = inject(AuthService);
}
