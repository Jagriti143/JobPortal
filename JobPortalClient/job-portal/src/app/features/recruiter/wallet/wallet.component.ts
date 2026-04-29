import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WalletService } from '../../../core/services/wallet.service';
import { environment } from '../../../../environments/environment';

interface TopupOption { label: string; coins: number; paise: number; popular?: boolean; }

@Component({
  selector: 'app-recruiter-wallet',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="wallet-page">

      <!-- Balance hero -->
      <div class="balance-hero">
        <div class="balance-hero-inner">
          <div class="balance-icon"><mat-icon>account_balance_wallet</mat-icon></div>
          <div>
            <div class="balance-label">Available Balance</div>
            <div class="balance-value">{{ balance }} <span class="balance-unit">points</span></div>
            <div class="balance-sub">1 point = unlock 1 candidate contact</div>
          </div>
          <button mat-stroked-button class="refresh-btn" (click)="loadBalance()" [disabled]="loadingBalance">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </div>

      <div class="wallet-body">

        <!-- Top-up section -->
        <div class="section-card">
          <h2><mat-icon>add_card</mat-icon> Add Points</h2>
          <p class="text-muted">Choose a package to top up your wallet via Razorpay</p>

          <div class="topup-grid">
            <div *ngFor="let opt of topupOptions" class="topup-card"
              [class.selected]="selectedOption === opt"
              [class.popular]="opt.popular"
              (click)="selectedOption = opt">
              <div class="popular-badge" *ngIf="opt.popular">Most Popular</div>
              <div class="topup-coins">{{ opt.coins }}</div>
              <div class="topup-unit">Points</div>
              <div class="topup-price">₹{{ opt.coins }}</div>
            </div>
          </div>

          <div class="topup-action">
            <button mat-raised-button color="primary" class="pay-btn"
              [disabled]="!selectedOption || paying"
              (click)="initiatePayment()">
              <mat-spinner diameter="18" *ngIf="paying"></mat-spinner>
              <mat-icon *ngIf="!paying">payment</mat-icon>
              {{ paying ? 'Processing...' : 'Pay with Razorpay — ₹' + (selectedOption?.coins ?? 0) }}
            </button>
            <p class="text-muted text-sm mt-8">Secure payment via Razorpay. Points credited instantly after payment.</p>
          </div>
        </div>

        <!-- Transaction history -->
        <div class="section-card">
          <h2><mat-icon>receipt_long</mat-icon> Transaction History</h2>

          <div *ngIf="loadingTxns" class="loading-center"><mat-spinner diameter="32"></mat-spinner></div>

          <div *ngIf="!loadingTxns && transactions.length === 0" class="empty-state" style="padding:40px">
            <mat-icon>receipt_long</mat-icon>
            <h3>No transactions yet</h3>
            <p>Your top-ups and deductions will appear here</p>
          </div>

          <div class="txn-list" *ngIf="!loadingTxns && transactions.length > 0">
            <div *ngFor="let t of transactions" class="txn-row">
              <div class="txn-icon" [class.credit]="t.points > 0" [class.debit]="t.points < 0">
                <mat-icon>{{ t.points > 0 ? 'add_circle' : 'remove_circle' }}</mat-icon>
              </div>
              <div class="txn-info">
                <div class="txn-type fw-600">{{ t.type }}</div>
                <div class="txn-desc text-muted text-sm">{{ t.description || '—' }}</div>
                <div class="txn-date text-muted text-sm">{{ t.createdAt | date:'medium' }}</div>
              </div>
              <div class="txn-amount" [class.credit]="t.points > 0" [class.debit]="t.points < 0">
                {{ t.points > 0 ? '+' : '' }}{{ t.points }} pts
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .wallet-page { min-height: calc(100vh - 64px); background: #f8fafc; }

    /* Balance hero */
    .balance-hero { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: white; padding: 40px 32px; }
    .balance-hero-inner { max-width: 900px; margin: 0 auto; display: flex; align-items: center; gap: 24px; }
    .balance-icon { width: 72px; height: 72px; border-radius: 20px; background: rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .balance-icon mat-icon { font-size: 36px; width: 36px; height: 36px; color: #38bdf8; }
    .balance-label { font-size: 0.85rem; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .balance-value { font-size: 3rem; font-weight: 800; line-height: 1; }
    .balance-unit { font-size: 1.2rem; font-weight: 400; opacity: 0.7; }
    .balance-sub { font-size: 0.8rem; opacity: 0.6; margin-top: 6px; }
    .refresh-btn { margin-left: auto; color: rgba(255,255,255,0.7) !important; border-color: rgba(255,255,255,0.2) !important; }

    /* Body */
    .wallet-body { max-width: 900px; margin: 0 auto; padding: 28px 24px; display: flex; flex-direction: column; gap: 24px; }

    /* Section cards */
    .section-card { background: white; border-radius: 14px; padding: 28px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
    .section-card h2 { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; }
    .section-card h2 mat-icon { color: #1976d2; font-size: 20px; width: 20px; height: 20px; }

    /* Top-up grid */
    .topup-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; margin: 20px 0; }
    .topup-card { border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px 16px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; }
    .topup-card:hover { border-color: #1976d2; background: #eff6ff; }
    .topup-card.selected { border-color: #1976d2; background: #eff6ff; box-shadow: 0 0 0 3px rgba(25,118,210,0.15); }
    .topup-card.popular { border-color: #f59e0b; }
    .topup-card.popular.selected { border-color: #f59e0b; background: #fffbeb; box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }
    .popular-badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #f59e0b; color: white; font-size: 0.65rem; font-weight: 700; padding: 2px 10px; border-radius: 10px; white-space: nowrap; }
    .topup-coins { font-size: 2rem; font-weight: 800; color: #111827; }
    .topup-unit { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .topup-price { font-size: 1rem; font-weight: 700; color: #1976d2; }

    .topup-action { text-align: center; }
    .pay-btn { height: 52px; font-size: 1rem !important; font-weight: 700 !important; border-radius: 10px !important; padding: 0 32px !important; }

    /* Transactions */
    .txn-list { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
    .txn-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: #f9fafb; border-radius: 10px; }
    .txn-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .txn-icon.credit { background: #dcfce7; color: #16a34a; }
    .txn-icon.debit  { background: #fee2e2; color: #dc2626; }
    .txn-info { flex: 1; }
    .txn-type { font-size: 0.9rem; }
    .txn-amount { font-size: 1rem; font-weight: 700; }
    .txn-amount.credit { color: #16a34a; }
    .txn-amount.debit  { color: #dc2626; }

    /* Shared */
    .loading-center { display: flex; justify-content: center; padding: 40px; }
    .empty-state { text-align: center; color: #9ca3af; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; opacity: 0.4; }
    .empty-state h3 { font-size: 1rem; color: #6b7280; margin-bottom: 4px; }
    .fw-600 { font-weight: 600; }
    .text-muted { color: #6b7280; }
    .text-sm { font-size: 0.8rem; }
    .mt-8 { margin-top: 8px; }

    @media (max-width: 600px) {
      .balance-hero-inner { flex-direction: column; text-align: center; }
      .topup-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class RecruiterWalletComponent implements OnInit {
  private walletService = inject(WalletService);
  private snack = inject(MatSnackBar);

  balance = 0;
  transactions: any[] = [];
  loadingBalance = false;
  loadingTxns = false;
  paying = false;
  selectedOption: TopupOption | null = null;

  topupOptions: TopupOption[] = [
    { label: 'Starter',    coins: 100,  paise: 10000 },
    { label: 'Basic',      coins: 500,  paise: 50000, popular: true },
    { label: 'Pro',        coins: 1000, paise: 100000 },
    { label: 'Enterprise', coins: 5000, paise: 500000 },
  ];

  ngOnInit(): void {
    this.loadBalance();
    this.loadTransactions();
  }

  loadBalance(): void {
    this.loadingBalance = true;
    this.walletService.getWalletBalance().subscribe({
      next: res => { this.loadingBalance = false; this.balance = res.data?.balance ?? 0; },
      error: () => { this.loadingBalance = false; }
    });
  }

  loadTransactions(): void {
    this.loadingTxns = true;
    this.walletService.getTransactions().subscribe({
      next: res => { this.loadingTxns = false; this.transactions = res.data ?? []; },
      error: () => { this.loadingTxns = false; }
    });
  }

  initiatePayment(): void {
    if (!this.selectedOption) return;
    this.paying = true;
    this.createOrderAndOpen(environment.razorpayKeyId);
  }

  private createOrderAndOpen(razorpayKeyId: string): void {
    this.walletService.createOrder(this.selectedOption!.paise).subscribe({
      next: res => {
        this.paying = false;
        const { orderId, amount, currency } = res.data ?? {};
        if (!orderId) {
          this.snack.open('Failed to create payment order', 'Close', { duration: 4000 });
          return;
        }
        this.openRazorpay(razorpayKeyId, orderId, amount, currency ?? 'INR', this.selectedOption!.paise);
      },
      error: err => {
        this.paying = false;
        this.snack.open(err.error?.message ?? 'Failed to initiate payment', 'Close', { duration: 4000 });
      }
    });
  }

  private openRazorpay(keyId: string, orderId: string, amount: number, currency: string, amountInPaise: number): void {
    // amount from Razorpay order is already in paise — use it directly
    const finalAmount = amount || amountInPaise;

    console.log('Opening Razorpay:', { keyId, orderId, amount: finalAmount, currency });

    const options = {
      key: keyId,
      amount: finalAmount,
      currency: currency || 'INR',
      name: 'JobPortal',
      description: `Add ${this.selectedOption?.coins} points to wallet`,
      order_id: orderId,
      modal: {
        ondismiss: () => {
          this.snack.open('Payment cancelled', 'OK', { duration: 3000 });
        }
      },
      handler: (response: any) => {
        console.log('Razorpay success:', response);
        this.walletService.verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
          amountInPaise
        ).subscribe({
          next: res => {
            const pts = res.data?.pointsAdded ?? this.selectedOption?.coins;
            this.snack.open(`✓ ${pts} points added to your wallet!`, 'OK', { duration: 5000 });
            this.selectedOption = null;
            this.loadBalance();
            this.loadTransactions();
          },
          error: err => this.snack.open(err.error?.message ?? 'Payment verification failed', 'Close', { duration: 4000 })
        });
      },
      prefill: { name: 'Recruiter', email: '' },
      theme: { color: '#1976d2' }
    };

    const openCheckout = () => {
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        this.snack.open(`Payment failed: ${response.error.description}`, 'Close', { duration: 5000 });
      });
      rzp.open();
    };

    if ((window as any).Razorpay) {
      openCheckout();
    } else {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => openCheckout();
      script.onerror = () => this.snack.open('Failed to load Razorpay. Check your internet connection.', 'Close', { duration: 4000 });
      document.body.appendChild(script);
    }
  }
}
