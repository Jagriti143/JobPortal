import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/payments`;

  getWalletBalance()   { return this.http.get<any>(`${this.base}/wallet/balance`); }
  getTransactions()    { return this.http.get<any>(`${this.base}/wallet/transactions`); }
  getConfig()          { return this.http.get<any>(`${this.base}/config`); }

  createOrder(amountInPaise: number) {
    return this.http.post<any>(`${this.base}/wallet/purchase`, { amountInPaise });
  }

  verifyPayment(orderId: string, paymentId: string, signature: string, amountInPaise: number) {
    return this.http.post<any>(`${this.base}/wallet/verify-payment`, { orderId, paymentId, signature, amountInPaise });
  }

  deductResumeView(resourceId: string)     { return this.http.post<any>(`${this.base}/wallet/deduct-resume-view`, { resourceId }); }
  deductResumeDownload(resourceId: string) { return this.http.post<any>(`${this.base}/wallet/deduct-resume-download`, { resourceId }); }
  checkUnlockStatus(resourceIds: string[]) { return this.http.post<any>(`${this.base}/wallet/unlock-status`, { resourceIds }); }
  unlockContact(jobSeekerId: string) {
    return this.http.post<any>(`${this.base}/wallet/unlock-contact`, { jobSeekerId });
  }
}
