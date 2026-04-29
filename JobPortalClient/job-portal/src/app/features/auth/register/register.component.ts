import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatButtonModule,
    MatIconModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-shell">
      <div class="auth-left">
        <div class="auth-left-inner">
          <a routerLink="/" class="auth-logo">
            <div class="logo-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" fill="white" opacity="0.9"/><path d="M16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V7" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div>
            <span>Job<span class="logo-accent">Portal</span></span>
          </a>
          <div class="auth-left-content">
            <h1>Start your journey<br><span class="left-accent">today.</span></h1>
            <p>Join 50,000+ professionals and companies who trust JobPortal to make great career connections happen.</p>
            <div class="stats-grid">
              <div *ngFor="let stat of stats" class="stat-box">
                <div class="stat-val">{{ stat.value }}</div>
                <div class="stat-lbl">{{ stat.label }}</div>
              </div>
            </div>
          </div>
          <div class="auth-trust">
            <div class="trust-label">Trusted by companies like</div>
            <div class="trust-logos"><div *ngFor="let c of companies" class="trust-logo">{{ c }}</div></div>
          </div>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-form-wrap">
          <div class="form-header">
            <h2>Create your account</h2>
            <p>Get started in under 2 minutes</p>
          </div>
          <div class="role-selector">
            <button type="button" class="role-btn" [class.active]="selectedRole() === 'JobSeeker'" (click)="selectRole('JobSeeker')">
              <div class="role-btn-icon seeker-icon"><mat-icon>person_search</mat-icon></div>
              <div class="role-btn-text"><div class="role-btn-title">Job Seeker</div><div class="role-btn-desc">Find & apply for jobs</div></div>
              <mat-icon class="role-check" *ngIf="selectedRole() === 'JobSeeker'">check_circle</mat-icon>
            </button>
            <button type="button" class="role-btn" [class.active]="selectedRole() === 'Recruiter'" (click)="selectRole('Recruiter')">
              <div class="role-btn-icon recruiter-icon"><mat-icon>business_center</mat-icon></div>
              <div class="role-btn-text"><div class="role-btn-title">Recruiter</div><div class="role-btn-desc">Post jobs & hire talent</div></div>
              <mat-icon class="role-check" *ngIf="selectedRole() === 'Recruiter'">check_circle</mat-icon>
            </button>
          </div>
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="field-group">
              <label class="field-label">Email address</label>
              <div class="field-wrap" [class.field-error]="form.get('email')?.invalid && form.get('email')?.touched">
                <mat-icon class="field-icon">email</mat-icon>
                <input type="email" placeholder="you@company.com" formControlName="email" class="field-input" autocomplete="email">
              </div>
              <span class="error-msg" *ngIf="form.get('email')?.hasError('required') && form.get('email')?.touched">Email is required</span>
              <span class="error-msg" *ngIf="form.get('email')?.hasError('email') && form.get('email')?.touched">Enter a valid email</span>
            </div>
            <div class="field-group">
              <label class="field-label">Password</label>
              <div class="field-wrap" [class.field-error]="form.get('password')?.invalid && form.get('password')?.touched">
                <mat-icon class="field-icon">lock</mat-icon>
                <input [type]="showPwd ? 'text' : 'password'" placeholder="Min 6 characters" formControlName="password" class="field-input" autocomplete="new-password">
                <button type="button" class="pwd-toggle" (click)="showPwd = !showPwd"><mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon></button>
              </div>
              <span class="error-msg" *ngIf="form.get('password')?.hasError('required') && form.get('password')?.touched">Password is required</span>
              <span class="error-msg" *ngIf="form.get('password')?.hasError('minlength') && form.get('password')?.touched">Minimum 6 characters required</span>
            </div>
            <p class="terms-text">By creating an account, you agree to our <a href="#" class="terms-link">Terms of Service</a> and <a href="#" class="terms-link">Privacy Policy</a>.</p>
            <button type="submit" class="submit-btn" [disabled]="loading || form.invalid">
              <mat-spinner diameter="18" *ngIf="loading"></mat-spinner>
              <mat-icon *ngIf="!loading">rocket_launch</mat-icon>
              {{ loading ? 'Creating account...' : 'Create Free Account' }}
            </button>
          </form>
          <div class="auth-switch">Already have an account? <a routerLink="/auth/login" class="auth-switch-link">Sign in</a></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-shell { display:flex;min-height:100vh }
    .auth-left { flex:1;display:flex;background:linear-gradient(155deg,#1a2e12 0%,#2d4a22 40%,#1a2e12 100%);position:relative;overflow:hidden }
    .auth-left::before { content:'';position:absolute;inset:0;background-image:radial-gradient(ellipse at 80% 20%,rgba(197,216,188,.15) 0%,transparent 50%),radial-gradient(ellipse at 20% 80%,rgba(138,158,128,.1) 0%,transparent 50%) }
    .auth-left-inner { position:relative;z-index:1;padding:40px;display:flex;flex-direction:column;justify-content:space-between;width:100% }
    .auth-logo { display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff;font-weight:800;font-size:1rem }
    .logo-icon { width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#6b8660,#8a9e80);display:flex;align-items:center;justify-content:center }
    .logo-accent { color:#c5d8bc }
    .auth-left-content { flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0 }
    .auth-left-content h1 { font-size:2.4rem;font-weight:400;color:#fff;letter-spacing:-1px;line-height:1.15;margin-bottom:16px;font-family:'DM Serif Display',serif }
    .left-accent { background:linear-gradient(135deg,#c5d8bc,#a8d890);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text }
    .auth-left-content p { color:rgba(255,255,255,.65);font-size:1rem;margin-bottom:32px;line-height:1.6 }
    .stats-grid { display:grid;grid-template-columns:1fr 1fr;gap:12px }
    .stat-box { background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:16px;text-align:center }
    .stat-val { font-size:1.5rem;font-weight:800;color:#c5d8bc;font-family:'DM Serif Display',serif }
    .stat-lbl { font-size:.75rem;color:rgba(255,255,255,.55);margin-top:3px }
    .auth-trust {}
    .trust-label { font-size:.75rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px }
    .trust-logos { display:flex;gap:10px;flex-wrap:wrap }
    .trust-logo { background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);padding:5px 12px;border-radius:8px;font-size:.78rem;font-weight:600 }
    .auth-right { width:540px;background:#fafaf8;display:flex;align-items:center;justify-content:center;padding:40px 32px }
    .auth-form-wrap { width:100%;max-width:440px }
    .form-header { margin-bottom:28px }
    .form-header h2 { font-size:1.75rem;font-weight:400;color:#1a2e12;margin-bottom:6px;font-family:'DM Serif Display',serif }
    .form-header p { color:#64748b;font-size:.9rem }
    .role-selector { display:flex;flex-direction:column;gap:10px;margin-bottom:24px }
    .role-btn { display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:12px;border:2px solid #e8ede4;background:#fff;cursor:pointer;transition:all .2s;text-align:left;font-family:'Inter',sans-serif }
    .role-btn:hover { border-color:#c5d8bc;background:#f0f7ec }
    .role-btn.active { border-color:#6b8660;background:#f0f7ec }
    .role-btn-icon { width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0 }
    .seeker-icon { background:#f0f7ec }
    .seeker-icon mat-icon { color:#6b8660;font-size:20px;width:20px;height:20px }
    .recruiter-icon { background:#f0fdf4 }
    .recruiter-icon mat-icon { color:#16a34a;font-size:20px;width:20px;height:20px }
    .role-btn-text { flex:1 }
    .role-btn-title { font-size:.9rem;font-weight:700;color:#1a2e12 }
    .role-btn-desc { font-size:.78rem;color:#64748b;margin-top:1px }
    .role-check { font-size:20px;width:20px;height:20px;color:#6b8660 }
    .field-group { margin-bottom:18px }
    .field-label { display:block;font-size:.8rem;font-weight:600;color:#3d5a30;margin-bottom:6px }
    .field-wrap { display:flex;align-items:center;border:1.5px solid #e8ede4;border-radius:10px;background:#f0f7ec;transition:all .2s;overflow:hidden }
    .field-wrap:focus-within { border-color:#6b8660;background:#fff;box-shadow:0 0 0 3px rgba(107,134,96,.1) }
    .field-wrap.field-error { border-color:#dc2626 }
    .field-icon { font-size:18px;width:18px;height:18px;color:#8a9e80;padding:0 12px;flex-shrink:0 }
    .field-input { flex:1;border:none;outline:none;background:transparent;font-size:.9rem;color:#1a2e12;padding:13px 12px 13px 0;font-family:'Inter',sans-serif }
    .field-input::placeholder { color:#94a3b8 }
    .pwd-toggle { background:none;border:none;cursor:pointer;padding:0 12px;color:#8a9e80;display:flex;align-items:center }
    .pwd-toggle mat-icon { font-size:18px;width:18px;height:18px }
    .error-msg { display:block;font-size:.75rem;color:#dc2626;margin-top:4px }
    .terms-text { font-size:.78rem;color:#94a3b8;margin-bottom:16px;line-height:1.5 }
    .terms-link { color:#6b8660;text-decoration:none }
    .terms-link:hover { text-decoration:underline }
    .submit-btn { width:100%;height:50px;border-radius:12px;background:linear-gradient(135deg,#1a2e12,#2d4a22);color:#fff;border:none;font-size:.95rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:'Inter',sans-serif;transition:all .2s;box-shadow:0 4px 14px rgba(26,46,18,.25);margin-bottom:20px }
    .submit-btn:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 6px 20px rgba(26,46,18,.35) }
    .submit-btn:disabled { opacity:.65;cursor:not-allowed }
    .submit-btn mat-icon { font-size:18px;width:18px;height:18px }
    .auth-switch { text-align:center;font-size:.875rem;color:#64748b }
    .auth-switch-link { color:#2d4a22;font-weight:700;text-decoration:none }
    .auth-switch-link:hover { text-decoration:underline }
    @media(max-width:900px){ .auth-left{display:none} .auth-right{width:100%} }
    @media(max-width:480px){ .auth-right{padding:24px 16px} }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  loading = false; showPwd = false;
  selectedRole = signal<'JobSeeker' | 'Recruiter'>('JobSeeker');
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(6)]], role: ['JobSeeker', Validators.required] });
  stats = [{ value: '50K+', label: 'Professionals' },{ value: '10K+', label: 'Live Jobs' },{ value: '500+', label: 'Companies' },{ value: '95%', label: 'Placed' }];
  companies = ['Google', 'Stripe', 'Zomato', 'Swiggy'];
  selectRole(role: 'JobSeeker' | 'Recruiter') { this.selectedRole.set(role); this.form.patchValue({ role }); }
  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.auth.register(this.form.value as any).subscribe({
      next: res => { this.loading = false; if (res.success) { this.snack.open('Account created! Please verify your email.', 'OK', { duration: 4000 }); this.router.navigate(['/auth/verify-email']); } },
      error: err => { this.loading = false; this.snack.open(err.error?.message ?? 'Registration failed', 'Close', { duration: 4000 }); }
    });
  }
}
