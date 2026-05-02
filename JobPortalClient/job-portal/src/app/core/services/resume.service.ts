import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/resumes`;

  getTemplates()                    { return this.http.get<any>(`${this.base}/templates`); }
  getMyResumes()                    { return this.http.get<any>(`${this.base}/my`); }          // ✓ /resumes/my
  getResume(id: string)             { return this.http.get<any>(`${this.base}/${id}`); }
  createResume(req: any)            { return this.http.post<any>(this.base, req); }
  updateResume(id: string, req: any){ return this.http.put<any>(`${this.base}/${id}`, req); }
  deleteResume(id: string)          { return this.http.delete(`${this.base}/${id}`, { observe: 'response' }); }
  downloadPdf(id: string)           { return this.http.get(`${this.base}/${id}/pdf`, { responseType: 'blob' }); }
  unlockResume(id: string)          { return this.http.post<any>(`${this.base}/${id}/unlock`, {}); }
}
