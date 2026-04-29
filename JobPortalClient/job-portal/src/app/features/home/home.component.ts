import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <!-- ── Hero Section ── -->
    <div class="hero">
      <div class="hero-bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="hero-inner">
        <div class="hero-content">
          <h1 class="hero-title">
            Finding the<br>job beyond<br><span class="title-accent">borders</span>
          </h1>
          <p class="hero-sub">
            Discover jobs you love, research the fastest-growing companies,
            and start your career journey.
          </p>

          <!-- Search Bar -->
          <div class="search-bar">
            <div class="search-field">
              <mat-icon>search</mat-icon>
              <input type="text" #searchInput placeholder="Search by company or role..." />
            </div>
            <div class="search-divider"></div>
            <div class="search-field location-field">
              <span>Location</span>
              <mat-icon class="dropdown-icon">expand_more</mat-icon>
            </div>
            <button class="search-btn" [routerLink]="['/jobs']" [queryParams]="{q: searchInput.value}">
              Search
            </button>
          </div>
        </div>

        <div class="hero-image-area">
          <img src="images/hero-professional.png" alt="Professional" class="hero-img" />

          <!-- Floating Cards -->
          <div class="float-card card-designer">
            <div class="fc-icon designer-icon">
              <mat-icon>brush</mat-icon>
            </div>
            <span class="fc-label">UI Designer</span>
          </div>

          <div class="float-card card-manager">
            <div class="fc-icon manager-icon">
              <mat-icon>manage_accounts</mat-icon>
            </div>
            <span class="fc-label">Manager</span>
          </div>

          <div class="float-card card-salary">
            <div class="salary-header">
              <mat-icon class="salary-icon">work</mat-icon>
              <span>Monthly Salary</span>
            </div>
            <div class="salary-range">$ 2,500 – $ 3,500</div>
            <div class="salary-slider">
              <div class="slider-track"></div>
              <div class="slider-fill"></div>
              <div class="slider-thumb thumb-left"></div>
              <div class="slider-thumb thumb-right"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Company Logos Strip ── -->
    <div class="logos-strip">
      <div class="logos-inner">
        <div *ngFor="let c of companies" class="company-logo">
          <span class="logo-text" [ngClass]="c.class">{{ c.name }}</span>
        </div>
      </div>
    </div>

    <!-- ── Latest Jobs Section ── -->
    <div class="jobs-section">
      <div class="jobs-header">
        <h2>Latest Jobs Opportunity</h2>
        <p>Find a job you love, research the fastest-growing companies</p>
      </div>

      <div class="jobs-layout">
        <div class="jobs-sidebar">
          <a *ngFor="let cat of categories"
             [routerLink]="['/jobs']" [queryParams]="{q: cat}"
             class="cat-link"
             [class.active]="cat === activeCategory"
             (mouseenter)="activeCategory = cat">
            {{ cat }}
          </a>
        </div>

        <div class="jobs-grid">
          <a *ngFor="let job of featuredJobs"
             [routerLink]="['/jobs']" [queryParams]="{q: job.title}"
             class="job-card">
            <div class="job-card-logo" [style.background]="job.logoBg">
              <span [style.color]="job.logoColor" class="job-logo-letter">{{ job.logoIcon }}</span>
            </div>
            <h3 class="job-title">{{ job.title }}</h3>
            <p class="job-company">{{ job.company }}</p>
          </a>
        </div>
      </div>
    </div>

    <!-- ── How It Works ── -->
    <div class="how-section">
      <div class="how-inner">
        <div class="how-header">
          <p class="section-eyebrow">Simple Process</p>
          <h2>How It Works</h2>
          <p class="section-desc">Three steps to your next big opportunity</p>
        </div>
        <div class="steps-row">
          <div class="step-card" *ngFor="let s of steps; let i = index">
            <div class="step-num">{{ (i + 1).toString().padStart(2, '0') }}</div>
            <div class="step-icon-wrap"><mat-icon>{{ s.icon }}</mat-icon></div>
            <h3>{{ s.title }}</h3>
            <p>{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── CTA Banner ── -->
    <div class="cta-section">
      <div class="cta-banner">
        <div class="cta-glow"></div>
        <div class="cta-content">
          <h2>Land your dream job <span class="cta-accent">today</span></h2>
          <p>Join thousands of professionals who found their next opportunity on JobPortal.</p>
          <div class="cta-btns">
            <a routerLink="/auth/register" class="cta-primary">
              <mat-icon>rocket_launch</mat-icon> Get Started Free
            </a>
            <a routerLink="/jobs" class="cta-secondary">
              Browse Jobs <mat-icon>arrow_forward</mat-icon>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700;800&display=swap');

    :host { display: block; background: #fafaf8; }

    /* ── Hero ── */
    .hero {
      position: relative; overflow: hidden;
      min-height: 88vh; display: flex; align-items: center;
      background: linear-gradient(160deg, #c5cfc0 0%, #a8b8a0 25%, #8a9e80 50%, #6b8660 75%, #4a6840 100%);
      padding: 0;
    }
    .hero-bg-shapes { position: absolute; inset: 0; pointer-events: none; }
    .shape {
      position: absolute; border-radius: 50%; opacity: 0.12;
    }
    .shape-1 {
      width: 500px; height: 500px; top: -150px; right: 10%;
      background: radial-gradient(circle, #b8d4a0, transparent 70%);
    }
    .shape-2 {
      width: 300px; height: 300px; bottom: 10%; left: 5%;
      background: radial-gradient(circle, #d4e8b0, transparent 70%);
    }
    .shape-3 {
      width: 200px; height: 600px; right: 35%; top: 0;
      background: linear-gradient(180deg, rgba(180,210,140,0.3), transparent);
      border-radius: 0 0 50% 50%; transform: rotate(10deg);
    }

    .hero-inner {
      max-width: 1200px; width: 100%; margin: 0 auto;
      display: flex; align-items: center; gap: 40px;
      padding: 100px 48px 80px; position: relative; z-index: 2;
    }
    .hero-content { flex: 1; min-width: 0; }
    .hero-title {
      font-family: 'DM Serif Display', serif;
      font-size: clamp(2.8rem, 5vw, 4.2rem);
      font-weight: 400; line-height: 1.1;
      color: #1a2e12; letter-spacing: -1px;
      margin-bottom: 20px;
    }
    .title-accent { color: #2d4a22; }
    .hero-sub {
      font-size: 1rem; color: #3d5a30; max-width: 420px;
      line-height: 1.7; margin-bottom: 32px; font-weight: 400;
    }

    /* Search bar */
    .search-bar {
      display: flex; align-items: center;
      background: #fff; border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      overflow: hidden; max-width: 520px;
    }
    .search-field {
      display: flex; align-items: center; gap: 10px;
      flex: 1; padding: 16px 18px;
    }
    .search-field mat-icon { color: #8a9e80; font-size: 20px; width: 20px; height: 20px; }
    .search-field input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 0.9rem; color: #1a2e12; font-family: 'Inter', sans-serif;
    }
    .search-field input::placeholder { color: #94a3b8; }
    .search-divider { width: 1px; height: 28px; background: #e2e8f0; flex-shrink: 0; }
    .location-field {
      cursor: pointer; gap: 6px; flex: 0 0 auto; padding-right: 8px;
      font-size: 0.9rem; color: #1a2e12; font-weight: 500;
    }
    .dropdown-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; color: #64748b !important; }
    .search-btn {
      background: #1a2e12; color: #fff; border: none;
      padding: 16px 28px; font-size: 0.9rem; font-weight: 700;
      cursor: pointer; font-family: 'Inter', sans-serif;
      white-space: nowrap; transition: background 0.2s;
    }
    .search-btn:hover { background: #2d4a22; }

    /* Hero image area */
    .hero-image-area {
      flex: 0 0 420px; position: relative; height: 500px;
    }
    .hero-img {
      width: 100%; height: 100%; object-fit: contain; object-position: bottom;
      position: relative; z-index: 1; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.15));
    }

    /* Floating cards */
    .float-card {
      position: absolute; z-index: 3;
      background: #fff; border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      animation: float-anim 5s ease-in-out infinite;
    }
    @keyframes float-anim {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .card-designer {
      top: 25%; left: -30px;
      display: flex; align-items: center; gap: 10px;
      padding: 12px 18px; animation-delay: 0s;
    }
    .card-manager {
      top: 8%; right: -10px;
      display: flex; align-items: center; gap: 10px;
      padding: 12px 18px; animation-delay: 1.5s;
    }
    .card-salary {
      bottom: 15%; right: -40px;
      padding: 16px 20px; min-width: 220px; animation-delay: 3s;
    }
    .fc-icon {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .designer-icon { background: #eff6ff; }
    .designer-icon mat-icon { color: #3b82f6; font-size: 18px; width: 18px; height: 18px; }
    .manager-icon { background: #f0fdf4; }
    .manager-icon mat-icon { color: #16a34a; font-size: 18px; width: 18px; height: 18px; }
    .fc-label { font-size: 0.82rem; font-weight: 600; color: #1e293b; }

    .salary-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
      font-size: 0.75rem; color: #64748b; font-weight: 500;
    }
    .salary-icon { font-size: 16px !important; width: 16px !important; height: 16px !important; color: #8a9e80 !important; }
    .salary-range {
      font-size: 1.3rem; font-weight: 800; color: #1a2e12;
      font-family: 'Inter', sans-serif; margin-bottom: 12px;
    }
    .salary-slider { position: relative; height: 6px; background: #c5e8b0; border-radius: 3px; }
    .slider-fill {
      position: absolute; left: 25%; right: 30%; top: 0; bottom: 0;
      background: #6b8660; border-radius: 3px;
    }
    .slider-thumb {
      position: absolute; top: 50%; width: 16px; height: 16px;
      background: #fff; border: 2px solid #6b8660; border-radius: 50%;
      transform: translate(-50%, -50%); box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .thumb-left { left: 25%; }
    .thumb-right { left: 70%; }

    /* ── Company Logos ── */
    .logos-strip {
      background: #1a2e12; padding: 28px 48px;
      border-radius: 20px; margin: -40px 48px 0;
      position: relative; z-index: 5;
    }
    .logos-inner {
      max-width: 1000px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-around; gap: 32px;
      flex-wrap: wrap;
    }
    .company-logo { display: flex; align-items: center; }
    .logo-text {
      font-size: 1.6rem; font-weight: 800; color: #fff;
      font-family: 'Inter', sans-serif; letter-spacing: -0.5px; opacity: 0.85;
    }
    .logo-stripe { font-style: italic; }
    .logo-adobe { font-weight: 700; letter-spacing: 1px; }
    .logo-google { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: 1.7rem; }
    .logo-microsoft { font-weight: 600; font-size: 1.4rem; letter-spacing: 0.5px; }

    /* ── Latest Jobs ── */
    .jobs-section {
      max-width: 1200px; margin: 0 auto;
      padding: 80px 48px 60px;
    }
    .jobs-header { text-align: center; margin-bottom: 48px; }
    .jobs-header h2 {
      font-family: 'DM Serif Display', serif;
      font-size: 2.2rem; font-weight: 400; color: #1a2e12; margin-bottom: 10px;
    }
    .jobs-header p { color: #64748b; font-size: 0.95rem; }

    .jobs-layout { display: flex; gap: 48px; }
    .jobs-sidebar {
      flex: 0 0 180px; display: flex; flex-direction: column; gap: 4px;
      padding-top: 8px;
    }
    .cat-link {
      padding: 10px 16px; border-radius: 10px;
      font-size: 0.88rem; color: #64748b; font-weight: 500;
      text-decoration: none; transition: all 0.2s; cursor: pointer;
    }
    .cat-link:hover, .cat-link.active {
      color: #1a2e12; font-weight: 700; background: #f0f7ec;
    }

    .jobs-grid {
      flex: 1; display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
    }
    .job-card {
      background: #fff; border-radius: 16px; padding: 24px 20px;
      text-align: center; text-decoration: none; color: inherit;
      border: 1px solid #e8ede4; transition: all 0.25s;
      display: flex; flex-direction: column; align-items: center;
    }
    .job-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 36px rgba(26,46,18,0.12);
      border-color: #c5d8bc; text-decoration: none;
    }
    .job-card-logo {
      width: 52px; height: 52px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 16px; font-size: 1.2rem; font-weight: 800;
    }
    .job-logo-letter { font-family: 'Inter', sans-serif; }
    .job-title { font-size: 0.9rem; font-weight: 700; color: #1a2e12; margin-bottom: 4px; }
    .job-company { font-size: 0.78rem; color: #94a3b8; }

    /* ── How It Works ── */
    .how-section {
      background: linear-gradient(180deg, #f0f7ec 0%, #fafaf8 100%);
      padding: 80px 0; border-top: 1px solid #e8ede4;
    }
    .how-inner { max-width: 1200px; margin: 0 auto; padding: 0 48px; }
    .how-header { text-align: center; margin-bottom: 48px; }
    .section-eyebrow {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 2px; color: #6b8660; margin-bottom: 8px;
    }
    .how-header h2 {
      font-family: 'DM Serif Display', serif;
      font-size: 2.2rem; font-weight: 400; color: #1a2e12;
    }
    .section-desc { font-size: 0.95rem; color: #64748b; margin-top: 8px; }

    .steps-row {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;
    }
    .step-card {
      padding: 36px 28px; border-radius: 20px;
      background: #fff; border: 1px solid #e8ede4;
      transition: all 0.25s;
    }
    .step-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 16px 40px rgba(26,46,18,0.1);
      border-color: #c5d8bc;
    }
    .step-num {
      font-size: 3rem; font-weight: 800; line-height: 1;
      color: #c5d8bc; margin-bottom: 12px;
      font-family: 'Inter', sans-serif;
    }
    .step-icon-wrap mat-icon {
      font-size: 28px; width: 28px; height: 28px;
      color: #6b8660; margin-bottom: 14px;
    }
    .step-card h3 { font-size: 1.1rem; font-weight: 700; color: #1a2e12; margin-bottom: 8px; }
    .step-card p { font-size: 0.88rem; color: #64748b; line-height: 1.65; }

    /* ── CTA ── */
    .cta-section { max-width: 1200px; margin: 0 auto; padding: 0 48px 80px; }
    .cta-banner {
      position: relative; overflow: hidden;
      border-radius: 24px; padding: 72px 48px;
      background: linear-gradient(135deg, #1a2e12, #2d4a22, #3d5a30);
      text-align: center;
    }
    .cta-glow {
      position: absolute; width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(107,134,96,0.4), transparent);
      top: -100px; right: -80px; filter: blur(60px); pointer-events: none;
    }
    .cta-content { position: relative; z-index: 2; }
    .cta-content h2 {
      font-family: 'DM Serif Display', serif;
      font-size: 2.4rem; color: #fff; margin-bottom: 12px; font-weight: 400;
    }
    .cta-accent {
      background: linear-gradient(135deg, #a8d890, #c5e8b0);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .cta-content > p { color: rgba(255,255,255,0.65); font-size: 1rem; margin-bottom: 32px; }
    .cta-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
    .cta-primary {
      display: flex; align-items: center; gap: 8px;
      padding: 14px 32px; border-radius: 12px;
      background: #fff; color: #1a2e12;
      font-size: 0.95rem; font-weight: 700; text-decoration: none;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2); transition: all 0.2s;
    }
    .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); text-decoration: none; }
    .cta-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .cta-secondary {
      display: flex; align-items: center; gap: 8px;
      padding: 14px 32px; border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.2); color: #fff;
      font-size: 0.95rem; font-weight: 700; text-decoration: none;
      transition: all 0.2s;
    }
    .cta-secondary:hover { background: rgba(255,255,255,0.08); text-decoration: none; }
    .cta-secondary mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .hero-inner { flex-direction: column; padding: 100px 24px 60px; }
      .hero-image-area { flex: 0 0 auto; width: 100%; max-width: 350px; height: 400px; }
      .card-designer { left: 0; }
      .card-salary { right: 0; }
      .logos-strip { margin: -30px 16px 0; padding: 20px 24px; border-radius: 14px; }
      .logo-text { font-size: 1.2rem; }
      .jobs-section { padding: 60px 24px 40px; }
      .jobs-layout { flex-direction: column; gap: 24px; }
      .jobs-sidebar { flex-direction: row; overflow-x: auto; flex: none; gap: 0; }
      .how-inner { padding: 0 24px; }
      .cta-section { padding: 0 24px 60px; }
      .cta-banner { padding: 48px 24px; }
    }
    @media (max-width: 600px) {
      .hero-title { font-size: 2.4rem; }
      .search-bar { flex-wrap: wrap; }
      .location-field { display: none; }
      .search-divider { display: none; }
      .hero-image-area { height: 300px; max-width: 280px; }
      .float-card { display: none; }
      .jobs-grid { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class HomeComponent {
  companies = [
    { name: 'stripe', class: 'logo-stripe' },
    { name: 'Adobe', class: 'logo-adobe' },
    { name: 'Google', class: 'logo-google' },
    { name: 'Microsoft', class: 'logo-microsoft' },
  ];

  categories = ['Art & Design', 'Marketing', 'Technology', 'Finance', 'Healthcare', 'Sales'];
  activeCategory = 'Art & Design';

  featuredJobs = [
    { title: 'User Interface Designer', company: 'Grab', logoIcon: 'G', logoBg: '#e8f5e9', logoColor: '#2e7d32' },
    { title: 'Product Design Lead', company: 'Google', logoIcon: 'G', logoBg: '#e3f2fd', logoColor: '#1565c0' },
    { title: 'Product Designer', company: 'Amazon', logoIcon: 'a', logoBg: '#fff3e0', logoColor: '#e65100' },
    { title: 'UX Researcher', company: 'Microsoft', logoIcon: 'M', logoBg: '#e8eaf6', logoColor: '#283593' },
    { title: 'Frontend Engineer', company: 'Stripe', logoIcon: 'S', logoBg: '#ede7f6', logoColor: '#4527a0' },
    { title: 'Visual Designer', company: 'Figma', logoIcon: 'F', logoBg: '#fce4ec', logoColor: '#c62828' },
  ];

  steps = [
    { icon: 'person_add', title: 'Create Your Profile', desc: 'Sign up in seconds. Build a compelling profile that gets noticed by top recruiters worldwide.' },
    { icon: 'search', title: 'Discover Opportunities', desc: 'Use our smart search to browse thousands of curated job listings that match your ambitions.' },
    { icon: 'send', title: 'Apply & Get Hired', desc: 'One-click apply with your tailored resume. Track all applications live from your dashboard.' },
  ];
}
