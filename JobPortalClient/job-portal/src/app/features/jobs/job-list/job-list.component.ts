import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { JobService } from '../../../core/services/job.service';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatInputModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatPaginatorModule],
  template: `
    <div class="jobs-layout page-wrap">

      <!-- Filters sidebar -->
      <aside class="filters-sidebar card">
        <div class="sidebar-header">
          <h3>Filters</h3>
          <button mat-button color="primary" (click)="clearFilters()">Clear</button>
        </div>

        <form [formGroup]="filterForm" class="filter-form">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Keywords</mat-label>
            <input matInput formControlName="q" placeholder="Title, skills...">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Location</mat-label>
            <input matInput formControlName="location" placeholder="City, remote...">
            <mat-icon matPrefix>location_on</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Job Type</mat-label>
            <mat-select formControlName="jobType">
              <mat-option value="">All Types</mat-option>
              <mat-option value="FullTime">Full Time</mat-option>
              <mat-option value="PartTime">Part Time</mat-option>
              <mat-option value="Contract">Contract</mat-option>
              <mat-option value="Remote">Remote</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="salary-row">
            <mat-form-field appearance="outline">
              <mat-label>Min ₹</mat-label>
              <input matInput formControlName="salaryMin" type="number" min="0">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Max ₹</mat-label>
              <input matInput formControlName="salaryMax" type="number" min="0">
            </mat-form-field>
          </div>

          <button mat-raised-button color="primary" class="w-full" type="button" (click)="search()">
            <mat-icon>search</mat-icon> Search
          </button>
        </form>
      </aside>

      <!-- Results -->
      <div class="jobs-content">
        <div class="results-header">
          <h2>{{ totalJobs }} Job{{ totalJobs !== 1 ? 's' : '' }} Found</h2>
          <span class="text-muted text-sm" *ngIf="activeQuery">
            Results for "<strong>{{ activeQuery }}</strong>"
          </span>
        </div>

        <!-- Loading -->
        <div class="loading-center" *ngIf="loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="!loading && jobs.length === 0">
          <mat-icon>search_off</mat-icon>
          <h3>No jobs found</h3>
          <p>Try different keywords or clear the filters</p>
          <button mat-stroked-button (click)="clearFilters()">Clear Filters</button>
        </div>

        <!-- Job cards -->
        <div class="job-card card" *ngFor="let job of jobs" [routerLink]="['/jobs', job.id]">
          <div class="jc-header">
            <div class="company-logo">{{ job.title?.charAt(0) ?? 'J' }}</div>
            <div class="jc-info">
              <h3>{{ job.title }}</h3>
              <p class="text-muted text-sm">
                {{ job.companyName || 'Company' }} &nbsp;·&nbsp;
                <mat-icon inline>location_on</mat-icon> {{ job.location }}
              </p>
            </div>
            <span class="job-type-badge">{{ job.jobType }}</span>
          </div>

          <p class="jc-desc text-muted">{{ job.description | slice:0:140 }}{{ job.description?.length > 140 ? '...' : '' }}</p>

          <div class="jc-footer">
            <span class="salary-tag" *ngIf="job.salaryMin">
              <mat-icon inline>payments</mat-icon>
              ₹{{ job.salaryMin | number }} – ₹{{ job.salaryMax | number }}
            </span>
            <span class="text-muted text-sm">{{ job.createdAt | date:'mediumDate' }}</span>
          </div>
        </div>

        <!-- Pagination -->
        <mat-paginator *ngIf="totalJobs > pageSize"
          [length]="totalJobs"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPage($event)"
          class="mt-16">
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .jobs-layout { display:flex;gap:24px;min-height:80vh;padding:28px 0 }
    .filters-sidebar { width:280px;min-width:280px;align-self:flex-start;position:sticky;top:80px;padding:20px;background:#fff;border:1px solid #e8ede4;border-radius:16px;box-shadow:0 2px 8px rgba(26,46,18,.04) }
    .sidebar-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid #f0f7ec }
    .sidebar-header h3 { font-size:1rem;font-weight:800;color:#1a2e12;margin:0;font-family:'DM Serif Display',serif }
    .filter-form { display:flex;flex-direction:column;gap:14px }
    .salary-row { display:grid;grid-template-columns:1fr 1fr;gap:10px }
    .jobs-content { flex:1;display:flex;flex-direction:column;gap:0;min-width:0 }
    .results-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px }
    .results-header h2 { font-size:1.1rem;font-weight:400;color:#1a2e12;margin:0;font-family:'DM Serif Display',serif }
    .job-card { cursor:pointer;padding:0;background:#fff;border:1.5px solid #e8ede4;border-radius:14px;box-shadow:0 1px 4px rgba(26,46,18,.04);transition:all .2s ease;overflow:hidden }
    .job-card:hover { border-color:#c5d8bc;box-shadow:0 8px 24px rgba(26,46,18,.08);transform:translateY(-2px) }
    .company-logo { width:50px;height:50px;border-radius:12px;background:linear-gradient(135deg,#f0f7ec,#e8ede4);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.25rem;color:#6b8660;flex-shrink:0;border:1px solid #e8ede4 }
    .jc-info { flex:1;min-width:0 }
    .job-type-badge { background:#f0f7ec;color:#2d4a22;padding:4px 10px;border-radius:6px;font-size:.72rem;font-weight:700;white-space:nowrap;flex-shrink:0 }
    .jc-desc { font-size:.82rem;line-height:1.6;color:#3d5a30;padding:0 20px;margin:10px 0 }
    .jc-footer { display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f0f7ec;padding:12px 20px;background:#fafaf8;gap:12px;flex-wrap:wrap }
    .salary-tag { display:flex;align-items:center;gap:4px;font-weight:700;font-size:.85rem;color:#1a2e12 }
    .salary-tag mat-icon { font-size:14px;width:14px;height:14px;color:#6b8660 }
    .loading-center { display:flex;justify-content:center;padding:80px }
    .empty-state { text-align:center;padding:80px 32px }
    .empty-state h3 { font-size:1.25rem;font-weight:400;color:#1a2e12;font-family:'DM Serif Display',serif;margin-bottom:8px }
    .empty-state p { color:#64748b;margin-bottom:20px }
    mat-icon[inline] { font-size:14px;width:14px;height:14px;vertical-align:text-bottom }
    @media(max-width:900px){ .jobs-layout{flex-direction:column} .filters-sidebar{width:100%;position:static;min-width:unset} }
  `]
})
export class JobListComponent implements OnInit {
  private jobService = inject(JobService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  jobs: any[] = [];
  totalJobs = 0;
  loading = false;
  activeQuery = '';
  currentPage = 1;
  pageSize = 20;

  filterForm = this.fb.group({
    q: [''], location: [''], jobType: [''], salaryMin: [null as number | null], salaryMax: [null as number | null]
  });

  ngOnInit(): void {
    // Pick up query params from home page search
    this.route.queryParams.subscribe(params => {
      if (params['q']) this.filterForm.patchValue({ q: params['q'] });
      if (params['location']) this.filterForm.patchValue({ location: params['location'] });
      this.search();
    });

    // Auto-search on keyword/location change with debounce
    this.filterForm.get('q')?.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1; this.search();
    });
    this.filterForm.get('location')?.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1; this.search();
    });
  }

  search(): void {
    this.loading = true;
    this.jobs = [];
    const v = this.filterForm.value;
    this.activeQuery = v.q || '';

    // Build clean params — only include non-empty values
    const params: any = { page: this.currentPage, limit: this.pageSize };
    if (v.q?.trim())        params.q        = v.q.trim();
    if (v.location?.trim()) params.location = v.location.trim();
    if (v.jobType)          params.jobType  = v.jobType;
    if (v.salaryMin != null && v.salaryMin > 0) params.salaryMin = v.salaryMin;
    if (v.salaryMax != null && v.salaryMax > 0) params.salaryMax = v.salaryMax;

    this.jobService.searchJobs(params).subscribe({
      next: res => {
        this.loading = false;
        // Response shape: { success, data: { total, jobs: [...] } }
        const data = (res as any)?.data;
        if (data?.jobs && Array.isArray(data.jobs)) {
          this.jobs = data.jobs;
          this.totalJobs = data.total ?? data.jobs.length;
        } else if (Array.isArray(data)) {
          this.jobs = data;
          this.totalJobs = data.length;
        } else {
          this.jobs = [];
          this.totalJobs = 0;
        }
      },
      error: () => { this.loading = false; }
    });
  }

  clearFilters(): void {
    this.filterForm.reset({ q: '', location: '', jobType: '', salaryMin: null, salaryMax: null });
    this.currentPage = 1;
    this.activeQuery = '';
    this.search();
  }

  onPage(e: PageEvent): void {
    this.currentPage = e.pageIndex + 1;
    this.pageSize = e.pageSize;
    this.search();
  }
}
