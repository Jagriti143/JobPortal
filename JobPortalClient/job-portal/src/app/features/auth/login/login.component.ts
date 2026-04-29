import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-shell">
      <div class="auth-left">
        <div class="auth-left-blob b1"></div>
        <div class="auth-left-blob b2"></div>
        <a routerLink="/" class="auth-logo">
          <div class="logo-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" fill="white" opacity="0.9"/><path d="M16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V7" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div>
          <span>Job<span class="logo-accent">Portal</span></span>
        </a>
        <div class="auth-left-content">
          <h1>Find work that<br><span class="gradient-text">moves you forward.</span></h1>
          <p>Access thousands of top-tier opportunities and build the career you deserve.</p>
          <div class="left-features">
            <div *ngFor="let f of leftFeatures" class="left-feature">
              <div class="lf-icon"><mat-icon>{{ f.icon }}</mat-icon></div>
              <div><div class="lf-title">{{ f.title }}</div><div class="lf-desc">{{ f.desc }}</div></div>
            </div>
          </div>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-form-wrap animate-scale-in">
          <div class="form-header text-center">
            <h2>Welcome back</h2>
            <p class="text-sub mt-8">Sign in to continue to JobPortal</p>
          </div>
          <form [formGroup]="form" (ngSubmit)="login()" class="auth-form">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Email address</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              <mat-icon matSuffix>mail_outline</mat-icon>
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Enter a valid email</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPw ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
              <button type="button" mat-icon-button matSuffix (click)="showPw = !showPw"><mat-icon>{{ showPw ? 'visibility' : 'visibility_off' }}</mat-icon></button>
              <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
            </mat-form-field>
            <div class="form-row flex justify-between items-center">
              <a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
            </div>
            <button mat-raised-button color="primary" class="submit-btn w-full" type="submit" [disabled]="loading || form.invalid">
              <mat-spinner *ngIf="loading" diameter="20" class="btn-spinner"></mat-spinner>
              <span *ngIf="!loading">Sign In Securely</span>
            </button>
            <div *ngIf="error" class="error-alert"><mat-icon>error_outline</mat-icon> {{ error }}</div>
            <p class="form-footer text-center">Don't have an account? <a routerLink="/auth/register" class="register-link">Create one</a></p>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes blob-morph { 0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%} }
    .auth-shell { min-height:100vh;display:flex }
    .auth-left { flex:1;position:relative;overflow:hidden;background:linear-gradient(135deg,#1a2e12,#2d4a22,#3d5a30);display:flex;flex-direction:column;justify-content:center;padding:48px 56px }
    .auth-left-blob { position:absolute;pointer-events:none;filter:blur(80px);opacity:.2;animation:blob-morph 12s ease-in-out infinite }
    .b1 { width:500px;height:500px;background:radial-gradient(circle,#8a9e80,transparent);top:-150px;left:-150px }
    .b2 { width:400px;height:400px;background:radial-gradient(circle,#c5d8bc,transparent);bottom:-100px;right:-100px;animation-delay:-6s }
    .auth-logo { display:flex;align-items:center;gap:10px;text-decoration:none;margin-bottom:64px;position:relative;z-index:2 }
    .logo-icon { width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#6b8660,#8a9e80);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.2) }
    .auth-logo span { font-size:1.25rem;font-weight:800;color:#fff;font-family:'DM Serif Display',serif }
    .logo-accent { color:#c5d8bc }
    .auth-left-content { position:relative;z-index:2 }
    .auth-left-content h1 { font-family:'DM Serif Display',serif;font-size:2.6rem;line-height:1.1;margin-bottom:16px;color:#fff;font-weight:400 }
    .gradient-text { background:linear-gradient(135deg,#c5d8bc,#a8d890);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text }
    .auth-left-content p { font-size:1rem;color:rgba(255,255,255,.6);margin-bottom:40px;line-height:1.7 }
    .left-features { display:flex;flex-direction:column;gap:20px }
    .left-feature { display:flex;align-items:flex-start;gap:14px }
    .lf-icon { width:44px;height:44px;border-radius:12px;background:rgba(197,216,188,.15);border:1px solid rgba(197,216,188,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0 }
    .lf-icon mat-icon { color:#c5d8bc;font-size:22px;width:22px;height:22px }
    .lf-title { font-size:.9rem;font-weight:700;color:#fff;margin-bottom:2px }
    .lf-desc { font-size:.8rem;color:rgba(255,255,255,.5) }
    .auth-right { width:480px;background:#fafaf8;border-left:1px solid #e8ede4;display:flex;align-items:center;justify-content:center;padding:48px 40px }
    .auth-form-wrap { width:100% }
    .form-header h2 { font-family:'DM Serif Display',serif;font-size:1.9rem;font-weight:400;color:#1a2e12 }
    .auth-form { display:flex;flex-direction:column;gap:8px;margin-top:32px }
    .form-row { margin-bottom:8px }
    .forgot-link { font-size:.82rem;color:#6b8660;text-decoration:none }
    .forgot-link:hover { text-decoration:underline }
    .submit-btn { height:52px!important;font-size:1rem!important;margin-top:8px }
    .btn-spinner { display:inline-block }
    .error-alert { display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:10px;background:rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.15);color:#dc2626;font-size:.875rem;font-weight:500 }
    .error-alert mat-icon { font-size:18px;width:18px;height:18px }
    .form-footer { font-size:.875rem;color:#64748b;margin-top:16px }
    .register-link { color:#2d4a22;font-weight:700;text-decoration:none }
    .register-link:hover { text-decoration:underline }
    @media(max-width:900px){ .auth-left{display:none} .auth-right{width:100%;border:none} }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);
  loading = false; error = ''; showPw = false;
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  leftFeatures = [
    { icon: 'search', title: 'Smart Job Discovery', desc: 'AI-powered search across 10,000+ live openings.' },
    { icon: 'description', title: 'Resume Builder', desc: 'Create ATS-friendly resumes that stand out.' },
    { icon: 'track_changes', title: 'Real-time Tracking', desc: 'Monitor every application status in one dashboard.' },
  ];
  login() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => { this.loading = false; const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/'; this.router.navigateByUrl(returnUrl); },
      error: err => { this.loading = false; this.error = err?.error?.message || 'Login failed. Please check your credentials.'; }
    });
  }
}
