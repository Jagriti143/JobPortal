import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin`;

  // Users
  getUsers()                        { return this.http.get<any>(`${this.base}/users`); }
  deleteUser(id: string)            { return this.http.delete<any>(`${this.base}/users/${id}`); }
  updateUserRole(id: string, role: string) { return this.http.put<any>(`${this.base}/users/${id}/role`, { role }); }

  // Job moderation
  getModerationQueue()              { return this.http.get<any>(`${this.base}/jobs/moderation-queue`); }
  approveJob(id: string)            { return this.http.post<any>(`${this.base}/jobs/${id}/approve`, {}); }
  flagJob(id: string)               { return this.http.post<any>(`${this.base}/jobs/${id}/flag`, {}); }

  // Audit & reports
  getAuditLogs()                    { return this.http.get<any>(`${this.base}/audit-logs`); }
  getRevenueReport()                { return this.http.get<any>(`${this.base}/reports/revenue`); }
  getTransactionReport()            { return this.http.get<any>(`${this.base}/reports/transactions`); }
}
