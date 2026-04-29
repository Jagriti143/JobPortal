import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiResponse, Company, Job, JobSearchParams } from '../models/index';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class JobService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/jobs`;

  searchJobs(p: JobSearchParams) {
    let params = new HttpParams();
    Object.entries(p).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });
    if(!p.page) params = params.set('page', '1');
    if(!p.limit) params = params.set('limit', '20');
    return this.http.get<ApiResponse<any>>(`${this.base}/search`, { params });
  }

  getJob(id: string) { return this.http.get<ApiResponse<Job>>(`${this.base}/${id}`); }
  getJobsByCompany(companyId: string) { return this.http.get<ApiResponse<Job[]>>(`${this.base}/company/${companyId}`); }
  createJob(req: any) { return this.http.post<ApiResponse<any>>(this.base, req); }
  updateJob(id: string, req: any) { return this.http.put<ApiResponse<any>>(`${this.base}/${id}`, req); }
  deleteJob(id: string) { return this.http.delete<ApiResponse<any>>(`${this.base}/${id}`); }

  // Companies
  createCompany(req: any) { return this.http.post<ApiResponse<Company>>(`${environment.apiUrl}/companies`, req); }
  getCompany(id: string) { return this.http.get<ApiResponse<Company>>(`${environment.apiUrl}/companies/${id}`); }
}
