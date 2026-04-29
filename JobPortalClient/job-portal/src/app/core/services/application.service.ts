import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/applications`;

  // POST /applications  — backend expects { jobId, coverLetter, email }
  applyForJob(jobId: string, coverLetter: string, email: string, phoneNumber: string, resumeId: string) {
    return this.http.post<any>(this.base, { jobId, coverLetter, email, phoneNumber, resumeId });
  }

  getMyApplications()                        { return this.http.get<any>(`${this.base}/my`); }
  getJobApplicants(jobId: string)             { return this.http.get<any>(`${this.base}/job/${jobId}`); }
  getApplication(id: string)                 { return this.http.get<any>(`${this.base}/${id}`); }
  updateStatus(id: string, newStatus: string){ return this.http.patch<any>(`${this.base}/${id}/status`, { newStatus }); }
  shortlist(id: string)                      { return this.http.patch<any>(`${this.base}/${id}/shortlist`, {}); }
  withdraw(id: string)                       { return this.http.delete<any>(`${this.base}/${id}`); }
}
