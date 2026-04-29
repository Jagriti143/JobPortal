import { Component, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, MatRippleModule],
  template: `
    <header class="navbar" [class.scrolled]="scrolled()">
      <div class="nav-inner">

        <!-- Brand Logo -->
        <a routerLink="/" class="brand">
          <div class="brand-logo-wrap">
            <div class="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" fill="white" opacity="0.9"/>
                <path d="M16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V7" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="12" cy="14" r="2" fill="rgba(255,255,255,0.5)"/>
              </svg>
            </div>
          </div>
          <div class="brand-text">
            <span class="brand-name">Job<span class="brand-accent">Portal</span></span>
            <span class="brand-tag">Career Platform</span>
          </div>
        </a>

        <!-- Center Nav Links -->
        <nav class="nav-links">
          <a routerLink="/jobs" routerLinkActive="active" [routerLinkActiveOptions]="{exact:false}" class="nav-link">
            <mat-icon>explore</mat-icon> Explore Jobs
          </a>

          <ng-container *ngIf="auth.isLoggedIn">
            <a *ngIf="auth.role === 'JobSeeker'" routerLink="/seeker/dashboard" routerLinkActive="active" class="nav-link">
              <mat-icon>dashboard</mat-icon> Dashboard
            </a>
            <a *ngIf="auth.role === 'JobSeeker'" routerLink="/seeker/resumes" routerLinkActive="active" class="nav-link">
              <mat-icon>description</mat-icon> Resumes
            </a>
            <a *ngIf="auth.role === 'Recruiter'" routerLink="/recruiter/dashboard" routerLinkActive="active" class="nav-link">
              <mat-icon>business_center</mat-icon> Studio
            </a>
            <a *ngIf="auth.role === 'Admin'" routerLink="/admin/dashboard" routerLinkActive="active" class="nav-link">
              <mat-icon>admin_panel_settings</mat-icon> Admin
            </a>
          </ng-container>
        </nav>

        <div class="nav-spacer"></div>

        <!-- Right Actions -->
        <div class="nav-actions">
          <ng-container *ngIf="!auth.isLoggedIn">
            <a routerLink="/auth/login" class="nav-link sign-in-link">Sign In</a>
            <a routerLink="/auth/register" class="cta-btn" matRipple>
              <span class="cta-inner">
                Join Free <mat-icon>arrow_forward</mat-icon>
              </span>
            </a>
          </ng-container>

          <ng-container *ngIf="auth.isLoggedIn">
            <span class="role-badge role-{{ auth.role | lowercase }}">
              <span class="role-dot"></span>{{ auth.role }}
            </span>

            <button class="avatar-btn" [matMenuTriggerFor]="userMenu">
              <div class="nav-avatar">
                {{ (auth.user$ | async)?.email?.charAt(0)?.toUpperCase() ?? 'U' }}
              </div>
              <mat-icon class="chevron">expand_more</mat-icon>
            </button>

            <mat-menu #userMenu="matMenu" xPosition="before" class="user-dropdown">
              <div class="dropdown-header">
                <div class="dropdown-avatar">
                  {{ (auth.user$ | async)?.email?.charAt(0)?.toUpperCase() ?? 'U' }}
                </div>
                <div>
                  <div class="dropdown-name">
                    {{ (auth.user$ | async)?.displayName || (auth.user$ | async)?.email?.split('@')?.[0] }}
                  </div>
                  <div class="dropdown-email">{{ (auth.user$ | async)?.email }}</div>
                </div>
              </div>
              <mat-divider></mat-divider>
              <a mat-menu-item routerLink="/profile">
                <mat-icon>manage_accounts</mat-icon> My Profile
              </a>
              <a mat-menu-item *ngIf="auth.role === 'JobSeeker'" routerLink="/seeker/resumes">
                <mat-icon>description</mat-icon> My Resumes
              </a>
              <a mat-menu-item *ngIf="auth.role === 'Recruiter'" routerLink="/recruiter/wallet">
                <mat-icon>account_balance_wallet</mat-icon> Wallet
              </a>
              <mat-divider></mat-divider>
              <button mat-menu-item class="logout-item" (click)="auth.logout()">
                <mat-icon>logout</mat-icon> Sign Out
              </button>
            </mat-menu>
          </ng-container>
        </div>

        <!-- Mobile toggle -->
        <button class="mobile-toggle" (click)="mobileOpen.set(!mobileOpen())" [attr.aria-label]="mobileOpen() ? 'Close menu' : 'Open menu'">
          <mat-icon>{{ mobileOpen() ? 'close' : 'menu' }}</mat-icon>
        </button>
      </div>

      <!-- Mobile Drawer -->
      <div class="mobile-drawer" [class.open]="mobileOpen()">
        <div class="mobile-drawer-inner">
          <a routerLink="/jobs" class="mobile-link" (click)="mobileOpen.set(false)">
            <mat-icon>explore</mat-icon> Explore Jobs
          </a>
          <ng-container *ngIf="!auth.isLoggedIn">
            <a routerLink="/auth/login" class="mobile-link" (click)="mobileOpen.set(false)">
              <mat-icon>login</mat-icon> Sign In
            </a>
            <a routerLink="/auth/register" class="mobile-link mobile-cta" (click)="mobileOpen.set(false)">
              <mat-icon>rocket_launch</mat-icon> Join Free
            </a>
          </ng-container>
          <ng-container *ngIf="auth.isLoggedIn">
            <a *ngIf="auth.role === 'JobSeeker'" routerLink="/seeker/dashboard" class="mobile-link" (click)="mobileOpen.set(false)">
              <mat-icon>dashboard</mat-icon> Dashboard
            </a>
            <a *ngIf="auth.role === 'JobSeeker'" routerLink="/seeker/resumes" class="mobile-link" (click)="mobileOpen.set(false)">
              <mat-icon>description</mat-icon> My Resumes
            </a>
            <a *ngIf="auth.role === 'Recruiter'" routerLink="/recruiter/dashboard" class="mobile-link" (click)="mobileOpen.set(false)">
              <mat-icon>business_center</mat-icon> Recruiter Studio
            </a>
            <a *ngIf="auth.role === 'Recruiter'" routerLink="/recruiter/wallet" class="mobile-link" (click)="mobileOpen.set(false)">
              <mat-icon>account_balance_wallet</mat-icon> Wallet
            </a>
            <div class="mobile-sep"></div>
            <button class="mobile-link mobile-logout" (click)="auth.logout()">
              <mat-icon>logout</mat-icon> Sign Out
            </button>
          </ng-container>
        </div>
      </div>
    </header>
  `,
  styles: [`
    @keyframes gradient-border {
      0%, 100% { background-position: 0% 50%; }
      50%       { background-position: 100% 50%; }
    }

    /* ── Base ── */
    .navbar {
      position: sticky; top: 0; z-index: 200;
      background: rgba(250,250,248,0.85);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-bottom: 1px solid #e8ede4;
      transition: background 0.3s ease, box-shadow 0.3s ease;
    }
    .navbar.scrolled {
      background: rgba(250,250,248,0.97);
      box-shadow: 0 4px 24px rgba(26,46,18,0.08), 0 1px 0 rgba(107,134,96,0.15);
    }

    .nav-inner {
      max-width: 1280px; margin: 0 auto;
      padding: 0 24px; height: 70px;
      display: flex; align-items: center; gap: 8px;
    }

    /* ── Brand ── */
    .brand {
      display: flex; align-items: center; gap: 12px;
      text-decoration: none; flex-shrink: 0;
    }
    .brand-logo-wrap {
      position: relative; width: 42px; height: 42px;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-icon {
      width: 40px; height: 40px; border-radius: 11px;
      background: linear-gradient(135deg, #1a2e12, #6b8660);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(26,46,18,0.2);
      transition: box-shadow 0.3s ease, transform 0.3s ease;
    }
    .brand:hover .brand-icon {
      box-shadow: 0 6px 20px rgba(26,46,18,0.3);
      transform: scale(1.05);
    }
    .brand-text { display: flex; flex-direction: column; line-height: 1.15; }
    .brand-name {
      font-size: 1.1rem; font-weight: 800; color: #1a2e12;
      letter-spacing: -0.5px;
      font-family: 'DM Serif Display', serif;
    }
    .brand-accent { color: #6b8660; }
    .brand-tag {
      font-size: 0.57rem; font-weight: 600;
      color: #8a9e80; text-transform: uppercase; letter-spacing: 1.5px;
      font-family: 'Inter', sans-serif;
    }

    /* ── Nav Links ── */
    .nav-links {
      display: flex; align-items: center; gap: 2px; margin-left: 16px;
    }
    .nav-link {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 10px;
      font-size: 0.875rem; font-weight: 600; color: #64748b;
      text-decoration: none;
      transition: all 0.2s ease;
      white-space: nowrap; position: relative;
    }
    .nav-link mat-icon { font-size: 17px; width: 17px; height: 17px; }
    .nav-link:hover {
      color: #1a2e12;
      background: #f0f7ec;
      text-decoration: none;
    }
    .nav-link.active {
      color: #2d4a22;
      background: #f0f7ec;
    }
    .nav-link.active::after {
      content: '';
      position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 20px; height: 2px;
      background: linear-gradient(90deg, #2d4a22, #6b8660);
      border-radius: 2px;
      opacity: 0.8;
    }

    .nav-spacer { flex: 1; }
    .nav-actions { display: flex; align-items: center; gap: 10px; }

    /* Sign-in link */
    .sign-in-link {
      padding: 8px 14px; border-radius: 10px;
      font-size: 0.875rem; font-weight: 600;
      color: #64748b;
      text-decoration: none; transition: all 0.2s;
    }
    .sign-in-link:hover { color: #1a2e12; background: #f0f7ec; text-decoration: none; }

    /* CTA button */
    .cta-btn {
      display: inline-flex;
      padding: 2px; border-radius: 12px;
      background: linear-gradient(135deg, #1a2e12, #6b8660, #8a9e80);
      background-size: 200% 200%;
      animation: gradient-border 3s ease infinite;
      text-decoration: none; cursor: pointer;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      box-shadow: 0 4px 15px rgba(26,46,18,0.2);
    }
    .cta-btn:hover {
      box-shadow: 0 8px 25px rgba(26,46,18,0.3);
      transform: translateY(-1px);
      text-decoration: none;
    }
    .cta-inner {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 18px; border-radius: 10px;
      background: #fafaf8;
      color: #1a2e12; font-size: 0.875rem; font-weight: 700;
      transition: background 0.2s;
    }
    .cta-btn:hover .cta-inner { background: transparent; color: #fff; }
    .cta-inner mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Role badge */
    .role-badge {
      display: flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 20px;
      font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .role-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: 0.8; }
    .role-jobseeker { background: rgba(107,134,96,0.12); color: #6b8660; border: 1px solid rgba(107,134,96,0.2); }
    .role-recruiter  { background: rgba(16,163,74,0.08); color: #16a34a; border: 1px solid rgba(16,163,74,0.15); }
    .role-admin      { background: rgba(217,119,6,0.08); color: #d97706; border: 1px solid rgba(217,119,6,0.15); }

    /* Avatar */
    .avatar-btn {
      display: flex; align-items: center; gap: 4px;
      background: none; border: none; cursor: pointer;
      padding: 4px 8px; border-radius: 12px; transition: background 0.2s;
    }
    .avatar-btn:hover { background: #f0f7ec; }
    .nav-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #1a2e12, #6b8660);
      color: #fff; font-weight: 700; font-size: 0.9rem;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(26,46,18,0.2);
    }
    .chevron { font-size: 18px; width: 18px; height: 18px; color: #8a9e80; }

    /* Dropdown */
    .dropdown-header {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px 12px;
    }
    .dropdown-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #1a2e12, #6b8660);
      color: #fff; font-weight: 700; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .dropdown-name { font-weight: 700; font-size: 0.9rem; color: #1a2e12; }
    .dropdown-email { font-size: 0.78rem; color: #64748b; margin-top: 1px; }
    .logout-item { color: #dc2626 !important; }
    .logout-item mat-icon { color: #dc2626 !important; }

    /* Mobile toggle */
    .mobile-toggle {
      display: none; background: none; border: none; cursor: pointer;
      padding: 8px; border-radius: 10px; color: #1a2e12;
      transition: background 0.2s;
    }
    .mobile-toggle:hover { background: #f0f7ec; }

    /* Mobile Drawer */
    .mobile-drawer {
      display: none; background: rgba(250,250,248,0.98);
      border-top: 1px solid #e8ede4;
      overflow: hidden; max-height: 0;
      transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1);
    }
    .mobile-drawer.open { max-height: 600px; }
    .mobile-drawer-inner { padding: 10px 16px 24px; display: flex; flex-direction: column; gap: 2px; }
    .mobile-link {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; border-radius: 10px;
      font-size: 0.9rem; font-weight: 600; color: #3d5a30;
      text-decoration: none; background: none; border: none;
      cursor: pointer; width: 100%; text-align: left;
      transition: all 0.2s;
    }
    .mobile-link mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .mobile-link:hover { background: #f0f7ec; color: #1a2e12; text-decoration: none; }
    .mobile-cta { background: rgba(107,134,96,0.1); color: #2d4a22; margin-top: 4px; }
    .mobile-cta:hover { background: rgba(107,134,96,0.18); }
    .mobile-logout { color: #dc2626; }
    .mobile-sep { height: 1px; background: #e8ede4; margin: 6px 0; }

    /* Responsive */
    @media (max-width: 900px) { .nav-links { display: none; } }
    @media (max-width: 768px) {
      .nav-actions { display: none; }
      .mobile-toggle { display: flex; margin-left: auto; }
      .mobile-drawer { display: block; }
    }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
  scrolled = signal(false);
  mobileOpen = signal(false);

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 10); }
}
