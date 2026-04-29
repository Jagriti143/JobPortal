import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-shell">
      <div class="auth-left">
        <div class="auth-left-inner">
          <a routerLink="/" class="auth-logo">
            <div class="logo-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" fill="white" opacity="0.9"/><path d="M16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V7" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div>
            <span>Job<span class="logo-accent">Portal</span></span>
          </a>
          <div class="auth-left-content">
            <h1>Password reset<br><span class="left-accent">made easy.</span></h1>
            <p>We'll send a secure reset link to your email. Usually arrives within 2 minutes.</p>
            <div class="security-note"><mat-icon>security</mat-icon><span>All reset links expire after 15 minutes for your security.</span></div>
          </div>
          <div class="back-to-login"><a routerLink="/auth/login" class="back-link"><mat-icon>arrow_back</mat-icon> Back to Sign In</a></div>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-form-wrap">
          <div *ngIf="!sent()">
            <div class="form-header">
              <div class="reset-icon"><mat-icon>lock_reset</mat-icon></div>
              <h2>Forgot your password?</h2>
              <p>Enter your email address and we'll send you a link to reset your password.</p>
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
              <button type="submit" class="submit-btn" [disabled]="loading() || form.invalid">
                <mat-spinner diameter="18" *ngIf="loading()"></mat-spinner>
                <mat-icon *ngIf="!loading()">send</mat-icon>
                {{ loading() ? 'Sending...' : 'Send Reset Link' }}
              </button>
            </form>
            <div class="auth-switch">Remember your password? <a routerLink="/auth/login" class="auth-switch-link">Sign in</a></div>
          </div>
          <div *ngIf="sent()" class="success-state">
            <div class="success-icon"><mat-icon>mark_email_read</mat-icon></div>
            <h2>Check your inbox!</h2>
            <p>We've sent a password reset link to <strong>{{ sentEmail() }}</strong>.</p>
            <div class="success-tips">
              <div class="success-tip"><mat-icon>schedule</mat-icon> Link expires in 15 minutes</div>
              <div class="success-tip"><mat-icon>folder</mat-icon> Check your spam folder too</div>
            </div>
            <button class="resend-btn" (click)="resend()" [disabled]="resendCooldown() > 0">{{ resendCooldown() > 0 ? 'Resend in ' + resendCooldown() + 's' : 'Resend Email' }}</button>
            <a routerLink="/auth/login" class="back-to-login-btn"><mat-icon>arrow_back</mat-icon> Back to Sign In</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-shell { display:flex;min-height:100vh }
    .auth-left { flex:1;display:flex;background:linear-gradient(155deg,#1a2e12 0%,#2d4a22 40%,#1a2e12 100%);position:relative;overflow:hidden }
    .auth-left::before { content:'';position:absolute;inset:0;background-image:radial-gradient(ellipse at 50% 50%,rgba(107,134,96,.15) 0%,transparent 60%) }
    .auth-left-inner { position:relative;z-index:1;padding:40px;display:flex;flex-direction:column;justify-content:space-between;width:100% }
    .auth-logo { display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff;font-weight:800;font-size:1rem }
    .logo-icon { width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#6b8660,#8a9e80);display:flex;align-items:center;justify-content:center }
    .logo-accent { color:#c5d8bc }
    .auth-left-content { flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0 }
    .auth-left-content h1 { font-size:2.2rem;font-weight:400;color:#fff;letter-spacing:-1px;line-height:1.15;margin-bottom:16px;font-family:'DM Serif Display',serif }
    .left-accent { background:linear-gradient(135deg,#c5d8bc,#a8d890);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text }
    .auth-left-content p { color:rgba(255,255,255,.65);font-size:1rem;margin-bottom:24px;line-height:1.6 }
    .security-note { display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:12px 16px;font-size:.8rem;color:rgba(255,255,255,.7) }
    .security-note mat-icon { font-size:18px;width:18px;height:18px;color:#c5d8bc;flex-shrink:0 }
    .back-link { display:flex;align-items:center;gap:6px;color:rgba(255,255,255,.5);font-size:.85rem;text-decoration:none;transition:color .15s }
    .back-link:hover { color:rgba(255,255,255,.85);text-decoration:none }
    .back-link mat-icon { font-size:16px;width:16px;height:16px }
    .auth-right { width:520px;background:#fafaf8;display:flex;align-items:center;justify-content:center;padding:40px 32px }
    .auth-form-wrap { width:100%;max-width:420px }
    .form-header { text-align:center;margin-bottom:32px }
    .reset-icon { width:64px;height:64px;border-radius:18px;background:#f0f7ec;display:flex;align-items:center;justify-content:center;margin:0 auto 20px }
    .reset-icon mat-icon { font-size:32px;width:32px;height:32px;color:#6b8660 }
    .form-header h2 { font-size:1.5rem;font-weight:400;color:#1a2e12;margin-bottom:8px;font-family:'DM Serif Display',serif }
    .form-header p { font-size:.875rem;color:#64748b;line-height:1.6 }
    .field-group { margin-bottom:20px }
    .field-label { display:block;font-size:.8rem;font-weight:600;color:#3d5a30;margin-bottom:6px }
    .field-wrap { display:flex;align-items:center;border:1.5px solid #e8ede4;border-radius:10px;background:#f0f7ec;transition:all .2s;overflow:hidden }
    .field-wrap:focus-within { border-color:#6b8660;background:#fff;box-shadow:0 0 0 3px rgba(107,134,96,.1) }
    .field-wrap.field-error { border-color:#dc2626 }
    .field-icon { font-size:18px;width:18px;height:18px;color:#8a9e80;padding:0 12px;flex-shrink:0 }
    .field-input { flex:1;border:none;outline:none;background:transparent;font-size:.9rem;color:#1a2e12;padding:13px 12px 13px 0;font-family:'Inter',sans-serif }
    .field-input::placeholder { color:#94a3b8 }
    .error-msg { display:block;font-size:.75rem;color:#dc2626;margin-top:4px }
    .submit-btn { width:100%;height:50px;border-radius:12px;background:linear-gradient(135deg,#1a2e12,#2d4a22);color:#fff;border:none;font-size:.95rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:'Inter',sans-serif;transition:all .2s;box-shadow:0 4px 14px rgba(26,46,18,.25);margin-bottom:20px }
    .submit-btn:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 6px 20px rgba(26,46,18,.35) }
    .submit-btn:disabled { opacity:.65;cursor:not-allowed }
    .submit-btn mat-icon { font-size:18px;width:18px;height:18px }
    .auth-switch { text-align:center;font-size:.875rem;color:#64748b }
    .auth-switch-link { color:#2d4a22;font-weight:700;text-decoration:none }
    .auth-switch-link:hover { text-decoration:underline }
    .success-state { text-align:center }
    .success-icon { width:72px;height:72px;border-radius:20px;background:#d1fae5;display:flex;align-items:center;justify-content:center;margin:0 auto 20px }
    .success-icon mat-icon { font-size:36px;width:36px;height:36px;color:#16a34a }
    .success-state h2 { font-size:1.5rem;font-weight:400;color:#1a2e12;margin-bottom:10px;font-family:'DM Serif Display',serif }
    .success-state p { font-size:.9rem;color:#64748b;line-height:1.6;margin-bottom:24px }
    .success-tips { display:flex;flex-direction:column;gap:8px;margin-bottom:24px }
    .success-tip { display:flex;align-items:center;gap:8px;background:#f0f7ec;border:1px solid #e8ede4;border-radius:9px;padding:10px 14px;font-size:.8rem;color:#3d5a30 }
    .success-tip mat-icon { font-size:16px;width:16px;height:16px;color:#6b8660 }
    .resend-btn { width:100%;height:44px;border-radius:10px;background:#f0f7ec;border:1px solid #e8ede4;color:#3d5a30;font-size:.875rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:background .15s;margin-bottom:12px }
    .resend-btn:hover:not(:disabled) { background:#e8ede4 }
    .resend-btn:disabled { opacity:.5;cursor:not-allowed }
    .back-to-login-btn { display:flex;align-items:center;justify-content:center;gap:6px;color:#2d4a22;font-size:.875rem;font-weight:600;text-decoration:none;width:100% }
    .back-to-login-btn:hover { text-decoration:underline }
    .back-to-login-btn mat-icon { font-size:16px;width:16px;height:16px }
    @media(max-width:900px){ .auth-left{display:none} .auth-right{width:100%} }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  loading = signal(false); sent = signal(false); sentEmail = signal(''); resendCooldown = signal(0);
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    setTimeout(() => { this.loading.set(false); this.sentEmail.set(this.form.value.email ?? ''); this.sent.set(true); this.startCooldown(); }, 1500);
  }
  resend() { this.submit(); }
  startCooldown() { this.resendCooldown.set(60); const interval = setInterval(() => { this.resendCooldown.update(v => v - 1); if (this.resendCooldown() <= 0) clearInterval(interval); }, 1000); }
}
