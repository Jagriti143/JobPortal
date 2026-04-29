import { Component, inject, signal, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-shell">
      <div class="auth-left">
        <div class="auth-left-inner">
          <a routerLink="/" class="auth-logo">
            <div class="logo-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" fill="white" opacity="0.9"/><path d="M16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V7" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div>
            <span>Job<span class="logo-accent">Portal</span></span>
          </a>
          <div class="auth-left-content">
            <h1>Almost there!<br><span class="left-accent">Verify your email.</span></h1>
            <p>We've sent a 6-digit verification code to your registered email address. Enter it to activate your account.</p>
            <div class="info-cards">
              <div class="info-card"><mat-icon>schedule</mat-icon><div><div class="info-title">Code expires in 24 hours</div><div class="info-desc">Request a new one if it expires</div></div></div>
              <div class="info-card"><mat-icon>mark_email_read</mat-icon><div><div class="info-title">Check your inbox & spam</div><div class="info-desc">The email may take a minute to arrive</div></div></div>
              <div class="info-card"><mat-icon>lock</mat-icon><div><div class="info-title">Secure verification</div><div class="info-desc">Never share your code with anyone</div></div></div>
            </div>
          </div>
          <div class="auth-trust"><a routerLink="/auth/login" class="back-link"><mat-icon>arrow_back</mat-icon> Back to Sign In</a></div>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-form-wrap">
          <div *ngIf="!verified()" class="verify-form">
            <div class="form-header">
              <div class="verify-icon-wrap"><mat-icon>verified_user</mat-icon><div class="icon-ring"></div></div>
              <h2>Verify your email</h2>
              <p>Enter the 6-digit code we sent to your email</p>
            </div>
            <div class="otp-container">
              <input *ngFor="let d of digits; let i = index; trackBy: trackByIndex" #digitInput type="text" inputmode="numeric" maxlength="1" class="otp-input" [class.filled]="digits[i] !== ''" [class.error]="error()" [value]="digits[i]" (input)="onDigitInput($event, i)" (keydown)="onKeyDown($event, i)" (paste)="onPaste($event)" [attr.aria-label]="'Digit ' + (i + 1)" autocomplete="one-time-code" />
            </div>
            <span class="error-msg" *ngIf="error()"><mat-icon>error_outline</mat-icon> {{ error() }}</span>
            <button type="button" class="submit-btn" [disabled]="loading() || !isComplete()" (click)="verify()">
              <mat-spinner diameter="18" *ngIf="loading()"></mat-spinner>
              <mat-icon *ngIf="!loading()">check_circle</mat-icon>
              {{ loading() ? 'Verifying...' : 'Verify Email' }}
            </button>
            <div class="auth-switch">Already verified? <a routerLink="/auth/login" class="auth-switch-link">Sign in</a></div>
          </div>
          <div *ngIf="verified()" class="success-state">
            <div class="success-icon-wrap"><mat-icon>check_circle</mat-icon><div class="success-ring"></div><div class="success-ring ring-2"></div></div>
            <h2>Email Verified!</h2>
            <p>Your account is now active. Redirecting you to sign in...</p>
            <div class="redirect-bar"><div class="redirect-fill" [style.animation-duration]="'3s'"></div></div>
            <span class="redirect-text">Redirecting in {{ countdown() }}s</span>
            <a routerLink="/auth/login" class="manual-login-btn"><mat-icon>login</mat-icon> Sign in now</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse-ring { 0%{transform:scale(1);opacity:.5}100%{transform:scale(1.5);opacity:0} }
    @keyframes fill-bar { from{width:0}to{width:100%} }
    @keyframes pop-in { 0%{transform:scale(.8);opacity:0}50%{transform:scale(1.05)}100%{transform:scale(1);opacity:1} }
    @keyframes shake { 0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)} }
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
    .auth-left-content>p { color:rgba(255,255,255,.65);font-size:1rem;margin-bottom:32px;line-height:1.6 }
    .info-cards { display:flex;flex-direction:column;gap:12px }
    .info-card { display:flex;align-items:flex-start;gap:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px 16px }
    .info-card mat-icon { font-size:20px;width:20px;height:20px;color:#c5d8bc;margin-top:2px;flex-shrink:0 }
    .info-title { font-size:.85rem;font-weight:700;color:rgba(255,255,255,.9) }
    .info-desc { font-size:.75rem;color:rgba(255,255,255,.45);margin-top:2px }
    .back-link { display:flex;align-items:center;gap:6px;color:rgba(255,255,255,.5);font-size:.85rem;text-decoration:none;transition:color .15s }
    .back-link:hover { color:rgba(255,255,255,.85) }
    .back-link mat-icon { font-size:16px;width:16px;height:16px }
    .auth-right { width:540px;background:#fafaf8;display:flex;align-items:center;justify-content:center;padding:40px 32px }
    .auth-form-wrap { width:100%;max-width:440px }
    .form-header { text-align:center;margin-bottom:36px }
    .verify-icon-wrap { width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg,#f0f7ec,#e8ede4);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;position:relative }
    .verify-icon-wrap mat-icon { font-size:36px;width:36px;height:36px;color:#6b8660 }
    .icon-ring { position:absolute;inset:-6px;border-radius:24px;border:2px solid rgba(107,134,96,.2) }
    .form-header h2 { font-size:1.5rem;font-weight:400;color:#1a2e12;margin-bottom:8px;font-family:'DM Serif Display',serif }
    .form-header p { font-size:.875rem;color:#64748b;line-height:1.5 }
    .otp-container { display:flex;gap:10px;justify-content:center;margin-bottom:12px }
    .otp-input { width:52px;height:60px;border:2px solid #e8ede4;border-radius:12px;background:#f0f7ec;text-align:center;font-size:1.5rem;font-weight:800;color:#1a2e12;font-family:'Inter',monospace;outline:none;transition:all .2s;caret-color:#6b8660 }
    .otp-input:focus { border-color:#6b8660;background:#fff;box-shadow:0 0 0 3px rgba(107,134,96,.12) }
    .otp-input.filled { border-color:#6b8660;background:#f0f7ec }
    .otp-input.error { border-color:#dc2626;background:#fef2f2;animation:shake .4s ease-in-out }
    .error-msg { display:flex;align-items:center;justify-content:center;gap:6px;font-size:.8rem;color:#dc2626;margin-bottom:16px }
    .error-msg mat-icon { font-size:16px;width:16px;height:16px }
    .submit-btn { width:100%;height:52px;border-radius:12px;background:linear-gradient(135deg,#1a2e12,#2d4a22);color:#fff;border:none;font-size:.95rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:'Inter',sans-serif;transition:all .2s;box-shadow:0 4px 14px rgba(26,46,18,.25);margin-bottom:20px }
    .submit-btn:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 6px 20px rgba(26,46,18,.35) }
    .submit-btn:disabled { opacity:.55;cursor:not-allowed }
    .submit-btn mat-icon { font-size:18px;width:18px;height:18px }
    .auth-switch { text-align:center;font-size:.875rem;color:#64748b }
    .auth-switch-link { color:#2d4a22;font-weight:700;text-decoration:none }
    .auth-switch-link:hover { text-decoration:underline }
    .success-state { text-align:center;animation:pop-in .5s ease both }
    .success-icon-wrap { width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#d1fae5,#a7f3d0);display:flex;align-items:center;justify-content:center;margin:0 auto 24px;position:relative }
    .success-icon-wrap mat-icon { font-size:40px;width:40px;height:40px;color:#059669 }
    .success-ring { position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(5,150,105,.2);animation:pulse-ring 2s ease-out infinite }
    .ring-2 { animation-delay:1s }
    .success-state h2 { font-size:1.6rem;font-weight:400;color:#1a2e12;margin-bottom:10px;font-family:'DM Serif Display',serif }
    .success-state p { font-size:.9rem;color:#64748b;line-height:1.6;margin-bottom:28px }
    .redirect-bar { height:4px;background:#e8ede4;border-radius:2px;overflow:hidden;margin-bottom:8px }
    .redirect-fill { height:100%;background:linear-gradient(90deg,#6b8660,#8a9e80);border-radius:2px;animation:fill-bar 3s linear both }
    .redirect-text { font-size:.75rem;color:#94a3b8;display:block;margin-bottom:20px }
    .manual-login-btn { display:inline-flex;align-items:center;gap:6px;color:#2d4a22;font-size:.9rem;font-weight:700;text-decoration:none;padding:10px 20px;border-radius:10px;background:#f0f7ec;border:1px solid #e8ede4;transition:all .15s }
    .manual-login-btn:hover { background:#e8ede4 }
    .manual-login-btn mat-icon { font-size:18px;width:18px;height:18px }
    @media(max-width:900px){ .auth-left{display:none} .auth-right{width:100%} }
    @media(max-width:480px){ .auth-right{padding:24px 16px} .otp-input{width:44px;height:52px;font-size:1.25rem} .otp-container{gap:6px} }
  `]
})
export class VerifyEmailComponent implements AfterViewInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;
  digits: string[] = ['', '', '', '', '', ''];
  loading = signal(false); verified = signal(false); error = signal(''); countdown = signal(3);
  trackByIndex = (i: number) => i;
  ngAfterViewInit() { setTimeout(() => { const inputs = this.digitInputs?.toArray(); if (inputs?.length) inputs[0].nativeElement.focus(); }); }
  isComplete(): boolean { return this.digits.every(d => d !== ''); }
  onDigitInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement; const value = input.value.replace(/\D/g, '');
    if (value.length > 0) { this.digits[index] = value[0]; input.value = value[0]; this.error.set(''); if (index < 5) { const inputs = this.digitInputs.toArray(); inputs[index + 1].nativeElement.focus(); } } else { this.digits[index] = ''; }
  }
  onKeyDown(event: KeyboardEvent, index: number) {
    const inputs = this.digitInputs.toArray();
    if (event.key === 'Backspace') { if (this.digits[index] === '' && index > 0) { this.digits[index - 1] = ''; inputs[index - 1].nativeElement.value = ''; inputs[index - 1].nativeElement.focus(); event.preventDefault(); } else { this.digits[index] = ''; (event.target as HTMLInputElement).value = ''; } }
    if (event.key === 'ArrowLeft' && index > 0) inputs[index - 1].nativeElement.focus();
    if (event.key === 'ArrowRight' && index < 5) inputs[index + 1].nativeElement.focus();
    if (event.key === 'Enter' && this.isComplete()) this.verify();
  }
  onPaste(event: ClipboardEvent) {
    event.preventDefault(); const paste = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (!paste) return;
    const inputs = this.digitInputs.toArray(); for (let i = 0; i < 6; i++) { this.digits[i] = paste[i] || ''; if (inputs[i]) inputs[i].nativeElement.value = this.digits[i]; }
    const focusIdx = Math.min(paste.length, 5); inputs[focusIdx].nativeElement.focus(); this.error.set('');
  }
  verify() {
    if (!this.isComplete() || this.loading()) return;
    const token = this.digits.join(''); this.loading.set(true); this.error.set('');
    this.auth.verifyEmail(token).subscribe({
      next: (res) => { this.loading.set(false); if (res.success) { this.verified.set(true); this.snack.open('Email verified successfully!', 'OK', { duration: 3000 }); this.startCountdown(); } },
      error: (err) => { this.loading.set(false); this.error.set(err?.error?.message || 'Invalid or expired verification code. Please try again.'); }
    });
  }
  private startCountdown() { this.countdown.set(3); const interval = setInterval(() => { this.countdown.update(v => v - 1); if (this.countdown() <= 0) { clearInterval(interval); this.router.navigate(['/auth/login']); } }, 1000); }
}
