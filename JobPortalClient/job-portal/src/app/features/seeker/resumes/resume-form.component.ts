import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResumeService } from '../../../core/services/resume.service';
import { AuthService } from '../../../core/services/auth.service';

const STEPS = ['Personal Info', 'Education', 'Experience', 'Skills', 'Projects', 'Preview'];
const TEMPLATES = [
  { id: 'classic',  label: 'Classic',     desc: 'Traditional professional layout', icon: 'article' },
  { id: 'modern',   label: 'Modern',      desc: 'Clean sidebar with accent colors', icon: 'view_sidebar' },
  { id: 'creative', label: 'Creative',    desc: 'Bold design for creative roles',   icon: 'brush' },
  { id: 'ats',      label: 'ATS-Friendly',desc: 'Optimized for keyword scanning',   icon: 'fact_check' },
];

@Component({
  selector: 'app-resume-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatCheckboxModule,
    MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="builder-shell">

      <!-- ── Stepper Header ── -->
      <div class="builder-header">
        <div class="builder-header-inner">
          <a routerLink="/seeker/resumes" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <div class="builder-title-group">
            <h2>{{ isEdit ? 'Edit Resume' : 'Build Your Resume' }}</h2>
            <p>{{ steps[currentStep] }} · Step {{ currentStep + 1 }} of {{ steps.length }}</p>
          </div>

          <!-- progress -->
          <div class="step-progress">
            <div class="progress-track">
              <div class="progress-fill" [style.width]="((currentStep + 1) / steps.length * 100) + '%'"></div>
            </div>
            <span class="progress-label">{{ Math.round((currentStep + 1) / steps.length * 100) }}%</span>
          </div>

          <button class="save-draft-btn" (click)="save(true)" [disabled]="loading">
            <mat-icon>save</mat-icon> Save Draft
          </button>
        </div>

        <!-- ── Step tabs ── -->
        <div class="step-tabs">
          <button
            *ngFor="let step of steps; let i = index"
            class="step-tab"
            [class.step-tab-done]="i < currentStep"
            [class.step-tab-active]="i === currentStep"
            (click)="goToStep(i)">
            <span class="step-tab-num">
              <mat-icon class="step-done-icon" *ngIf="i < currentStep">check</mat-icon>
              <span *ngIf="i >= currentStep">{{ i + 1 }}</span>
            </span>
            <span class="step-tab-label">{{ step }}</span>
          </button>
        </div>
      </div>

      <!-- ── Body ── -->
      <div class="builder-body">

        <!-- ── LEFT: Form ── -->
        <div class="builder-form-pane">
          <form [formGroup]="form">

            <!-- ── STEP 0: Personal Info ── -->
            <div *ngIf="currentStep === 0" class="step-pane">
              <div class="step-intro">
                <div class="step-icon-wrap"><mat-icon>person</mat-icon></div>
                <div>
                  <h3>Personal Information</h3>
                  <p>Start with the basics — your name, contact, and professional summary.</p>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="field-group">
                  <label class="field-label">Resume Title *</label>
                  <div class="field-wrap" [class.invalid]="isInvalid('title')">
                    <input class="field-input" placeholder="e.g. Senior Frontend Developer" formControlName="title">
                  </div>
                  <span class="field-hint">This won't appear on the resume — it's for your reference</span>
                </div>

                <div class="field-group">
                  <label class="field-label">Phone Number</label>
                  <div class="field-wrap">
                    <mat-icon class="field-icon">phone</mat-icon>
                    <input class="field-input" placeholder="+91 98765 43210" formControlName="phone">
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label">Location</label>
                  <div class="field-wrap">
                    <mat-icon class="field-icon">location_on</mat-icon>
                    <input class="field-input" placeholder="Bangalore, India" formControlName="location">
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label">LinkedIn URL</label>
                  <div class="field-wrap">
                    <mat-icon class="field-icon">link</mat-icon>
                    <input class="field-input" placeholder="linkedin.com/in/yourname" formControlName="linkedinUrl">
                  </div>
                </div>

                <div class="field-group field-group-full">
                  <label class="field-label">Professional Summary</label>
                  <div class="field-wrap field-wrap-textarea">
                    <textarea class="field-input field-textarea" rows="4"
                      placeholder="A results-driven software engineer with 5+ years building scalable web applications..."
                      formControlName="summary"></textarea>
                  </div>
                  <span class="field-hint">3-5 sentences · Focus on your value proposition · Use keywords from job descriptions</span>
                </div>
              </div>

              <!-- Template selection -->
              <div class="section-divider">
                <span>Resume Template</span>
              </div>
              <div class="template-grid">
                <div *ngFor="let tpl of templates" class="template-card"
                  [class.template-selected]="selectedTemplate === tpl.id"
                  (click)="selectedTemplate = tpl.id; form.patchValue({templateId: tpl.id})">
                  <div class="template-preview">
                    <mat-icon>{{ tpl.icon }}</mat-icon>
                  </div>
                  <div class="template-info">
                    <div class="template-name">{{ tpl.label }}</div>
                    <div class="template-desc">{{ tpl.desc }}</div>
                  </div>
                  <mat-icon class="template-check" *ngIf="selectedTemplate === tpl.id">check_circle</mat-icon>
                </div>
              </div>
            </div>

            <!-- ── STEP 1: Education ── -->
            <div *ngIf="currentStep === 1" class="step-pane">
              <div class="step-intro">
                <div class="step-icon-wrap"><mat-icon>school</mat-icon></div>
                <div>
                  <h3>Education</h3>
                  <p>List your academic qualifications from most recent to oldest.</p>
                </div>
              </div>

              <div formArrayName="educations">
                <div *ngFor="let edu of eduArray.controls; let i = index" [formGroupName]="i" class="array-card">
                  <div class="array-card-header">
                    <mat-icon>school</mat-icon>
                    <span>Education {{ i + 1 }}</span>
                    <button type="button" class="remove-btn" (click)="removeEdu(i)"><mat-icon>delete_outline</mat-icon></button>
                  </div>
                  <div class="form-grid-2">
                    <div class="field-group field-group-full">
                      <label class="field-label">Institution *</label>
                      <div class="field-wrap"><input class="field-input" placeholder="IIT Delhi / Delhi University" formControlName="institution"></div>
                    </div>
                    <div class="field-group">
                      <label class="field-label">Degree *</label>
                      <div class="field-wrap"><input class="field-input" placeholder="B.Tech / MBA / M.Sc" formControlName="degree"></div>
                    </div>
                    <div class="field-group">
                      <label class="field-label">Field of Study</label>
                      <div class="field-wrap"><input class="field-input" placeholder="Computer Science" formControlName="fieldOfStudy"></div>
                    </div>
                    <div class="field-group">
                      <label class="field-label">Start Date</label>
                      <div class="field-wrap"><input class="field-input" type="month" formControlName="startDate"></div>
                    </div>
                    <div class="field-group">
                      <label class="field-label">End Date</label>
                      <div class="field-wrap"><input class="field-input" type="month" formControlName="endDate" placeholder="Leave blank if current"></div>
                    </div>
                  </div>
                </div>
              </div>

              <button type="button" class="add-section-btn" (click)="addEdu()">
                <mat-icon>add_circle_outline</mat-icon> Add Education
              </button>
              <div *ngIf="eduArray.length === 0" class="empty-section">
                <mat-icon>school</mat-icon>
                <p>No education added yet. Click the button above to add.</p>
              </div>
            </div>

            <!-- ── STEP 2: Experience ── -->
            <div *ngIf="currentStep === 2" class="step-pane">
              <div class="step-intro">
                <div class="step-icon-wrap"><mat-icon>work</mat-icon></div>
                <div>
                  <h3>Work Experience</h3>
                  <p>Add your work history. Focus on achievements and impact.</p>
                </div>
              </div>

              <div formArrayName="experiences">
                <div *ngFor="let exp of expArray.controls; let i = index" [formGroupName]="i" class="array-card">
                  <div class="array-card-header">
                    <mat-icon>work</mat-icon>
                    <span>Experience {{ i + 1 }}</span>
                    <button type="button" class="remove-btn" (click)="removeExp(i)"><mat-icon>delete_outline</mat-icon></button>
                  </div>
                  <div class="form-grid-2">
                    <div class="field-group">
                      <label class="field-label">Company *</label>
                      <div class="field-wrap"><input class="field-input" placeholder="Google / TCS / Startup Inc." formControlName="company"></div>
                    </div>
                    <div class="field-group">
                      <label class="field-label">Job Title *</label>
                      <div class="field-wrap"><input class="field-input" placeholder="Senior Software Engineer" formControlName="jobTitle"></div>
                    </div>
                    <div class="field-group">
                      <label class="field-label">Start Date</label>
                      <div class="field-wrap"><input class="field-input" type="month" formControlName="startDate"></div>
                    </div>
                    <div class="field-group">
                      <label class="field-label">End Date</label>
                      <div class="field-wrap">
                        <input class="field-input" type="month" formControlName="endDate" [disabled]="exp.get('isCurrentRole')?.value">
                      </div>
                    </div>
                    <div class="field-group field-group-full">
                      <label class="checkbox-label">
                        <input type="checkbox" formControlName="isCurrentRole" class="checkbox-input"> Currently working here
                      </label>
                    </div>
                    <div class="field-group field-group-full">
                      <label class="field-label">Key Responsibilities & Achievements</label>
                      <div class="field-wrap field-wrap-textarea">
                        <textarea class="field-input field-textarea" rows="3"
                          placeholder="• Led migration of monolith to microservices, reducing latency by 40%&#10;• Built real-time analytics dashboard used by 2M+ users"
                          formControlName="description"></textarea>
                      </div>
                      <span class="field-hint">Use bullet points. Quantify results where possible.</span>
                    </div>
                  </div>
                </div>
              </div>

              <button type="button" class="add-section-btn" (click)="addExp()">
                <mat-icon>add_circle_outline</mat-icon> Add Experience
              </button>
              <div *ngIf="expArray.length === 0" class="empty-section">
                <mat-icon>work</mat-icon>
                <p>No experience added. Click add for your first role. Freshers can skip this step.</p>
              </div>
            </div>

            <!-- ── STEP 3: Skills ── -->
            <div *ngIf="currentStep === 3" class="step-pane">
              <div class="step-intro">
                <div class="step-icon-wrap"><mat-icon>psychology</mat-icon></div>
                <div>
                  <h3>Skills</h3>
                  <p>List technical and soft skills relevant to your target role.</p>
                </div>
              </div>

              <!-- Quick add chips -->
              <div class="quick-skills">
                <p class="field-hint" style="margin-bottom:10px;">Quick add popular skills:</p>
                <div class="skill-suggestions">
                  <button *ngFor="let s of skillSuggestions" type="button" class="skill-suggest-btn"
                    (click)="addSkillByName(s)">+ {{ s }}</button>
                </div>
              </div>

              <div formArrayName="skills" class="skills-grid">
                <div *ngFor="let skill of skillArray.controls; let i = index" [formGroupName]="i" class="skill-item">
                  <div class="field-wrap skill-name-wrap">
                    <input class="field-input" placeholder="Skill name" formControlName="name">
                  </div>
                  <select class="skill-level-select" formControlName="level">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                  <button type="button" class="remove-btn" (click)="removeSkill(i)"><mat-icon>close</mat-icon></button>
                </div>
              </div>

              <button type="button" class="add-section-btn" (click)="addSkill()">
                <mat-icon>add_circle_outline</mat-icon> Add Skill
              </button>
              <div *ngIf="skillArray.length === 0" class="empty-section">
                <mat-icon>psychology</mat-icon>
                <p>No skills added yet. Add technical and soft skills relevant to your target role.</p>
              </div>
            </div>

            <!-- ── STEP 4: Projects ── -->
            <div *ngIf="currentStep === 4" class="step-pane">
              <div class="step-intro">
                <div class="step-icon-wrap"><mat-icon>code</mat-icon></div>
                <div>
                  <h3>Projects</h3>
                  <p>Showcase personal or work projects that demonstrate your skills.</p>
                </div>
              </div>

              <div formArrayName="projects">
                <div *ngFor="let proj of projArray.controls; let i = index" [formGroupName]="i" class="array-card">
                  <div class="array-card-header">
                    <mat-icon>code</mat-icon>
                    <span>Project {{ i + 1 }}</span>
                    <button type="button" class="remove-btn" (click)="removeProj(i)"><mat-icon>delete_outline</mat-icon></button>
                  </div>
                  <div class="form-grid-2">
                    <div class="field-group">
                      <label class="field-label">Project Name *</label>
                      <div class="field-wrap"><input class="field-input" placeholder="E-Commerce Platform" formControlName="name"></div>
                    </div>
                    <div class="field-group">
                      <label class="field-label">Live URL</label>
                      <div class="field-wrap">
                        <mat-icon class="field-icon">link</mat-icon>
                        <input class="field-input" placeholder="github.com/username/project" formControlName="url">
                      </div>
                    </div>
                    <div class="field-group field-group-full">
                      <label class="field-label">Description</label>
                      <div class="field-wrap field-wrap-textarea">
                        <textarea class="field-input field-textarea" rows="3"
                          placeholder="Built a full-stack e-commerce platform using React and Node.js with payment integration..."
                          formControlName="description"></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button type="button" class="add-section-btn" (click)="addProj()">
                <mat-icon>add_circle_outline</mat-icon> Add Project
              </button>
              <div *ngIf="projArray.length === 0" class="empty-section">
                <mat-icon>code</mat-icon>
                <p>No projects added yet. Showcase your best work here.</p>
              </div>
            </div>

            <!-- ── STEP 5: Preview ── -->
            <div *ngIf="currentStep === 5" class="step-pane">
              <div class="step-intro">
                <div class="step-icon-wrap step-icon-green"><mat-icon>visibility</mat-icon></div>
                <div>
                  <h3>Preview & Download</h3>
                  <p>Review your resume and download it as a PDF when ready.</p>
                </div>
              </div>

              <div class="preview-resume" id="resume-preview">
                <div class="preview-header">
                  <h1 class="preview-name">{{ (auth$ | async)?.displayName || (auth$ | async)?.email?.split('@')?.[0] || 'Your Name' }}</h1>
                  <div class="preview-contact">
                    <span *ngIf="form.value.location"><mat-icon>location_on</mat-icon> {{ form.value.location }}</span>
                    <span *ngIf="form.value.phone"><mat-icon>phone</mat-icon> {{ form.value.phone }}</span>
                    <span *ngIf="form.value.linkedinUrl"><mat-icon>link</mat-icon> {{ form.value.linkedinUrl }}</span>
                  </div>
                </div>

                <div class="preview-section" *ngIf="form.value.summary">
                  <div class="preview-section-title">Professional Summary</div>
                  <p class="preview-text">{{ form.value.summary }}</p>
                </div>

                <div class="preview-section" *ngIf="expArray.length > 0">
                  <div class="preview-section-title">Work Experience</div>
                  <div *ngFor="let exp of expArray.value" class="preview-item">
                    <div class="preview-item-header">
                      <strong>{{ exp.jobTitle }}</strong> · {{ exp.company }}
                      <span class="preview-date">{{ exp.startDate }} — {{ exp.isCurrentRole ? 'Present' : exp.endDate }}</span>
                    </div>
                    <p class="preview-text" *ngIf="exp.description">{{ exp.description }}</p>
                  </div>
                </div>

                <div class="preview-section" *ngIf="eduArray.length > 0">
                  <div class="preview-section-title">Education</div>
                  <div *ngFor="let edu of eduArray.value" class="preview-item">
                    <div class="preview-item-header">
                      <strong>{{ edu.degree }}</strong> {{ edu.fieldOfStudy ? '· ' + edu.fieldOfStudy : '' }}
                      <span class="preview-date">{{ edu.startDate }} — {{ edu.endDate || 'Present' }}</span>
                    </div>
                    <p class="preview-text">{{ edu.institution }}</p>
                  </div>
                </div>

                <div class="preview-section" *ngIf="skillArray.length > 0">
                  <div class="preview-section-title">Skills</div>
                  <div class="preview-skills">
                    <span *ngFor="let skill of skillArray.value" class="preview-skill-tag">
                      {{ skill.name }} <span *ngIf="skill.level" class="skill-level-tag">({{ skill.level }})</span>
                    </span>
                  </div>
                </div>

                <div class="preview-section" *ngIf="projArray.length > 0">
                  <div class="preview-section-title">Projects</div>
                  <div *ngFor="let proj of projArray.value" class="preview-item">
                    <div class="preview-item-header">
                      <strong>{{ proj.name }}</strong>
                      <span class="preview-link" *ngIf="proj.url">{{ proj.url }}</span>
                    </div>
                    <p class="preview-text" *ngIf="proj.description">{{ proj.description }}</p>
                  </div>
                </div>
              </div>

              <!-- Download actions -->
              <div class="preview-actions">
                <button class="download-pdf-btn" (click)="downloadPdf()" [disabled]="downloadingPdf">
                  <mat-spinner diameter="18" *ngIf="downloadingPdf"></mat-spinner>
                  <mat-icon *ngIf="!downloadingPdf">download</mat-icon>
                  {{ downloadingPdf ? 'Generating PDF...' : 'Download PDF' }}
                </button>
                <p class="preview-tip">
                  <mat-icon>info</mat-icon>
                  Save your resume first to generate a PDF with your chosen template.
                </p>
              </div>
            </div>

          </form>

          <!-- ── Navigation Buttons ── -->
          <div class="step-nav">
            <button class="nav-btn nav-btn-ghost" *ngIf="currentStep > 0" (click)="prevStep()">
              <mat-icon>arrow_back</mat-icon> Previous
            </button>
            <div class="nav-spacer"></div>
            <button class="nav-btn nav-btn-primary" *ngIf="currentStep < steps.length - 1" (click)="nextStep()">
              Next <mat-icon>arrow_forward</mat-icon>
            </button>
            <button class="nav-btn nav-btn-success" *ngIf="currentStep === steps.length - 1"
              (click)="save(false)" [disabled]="loading">
              <mat-spinner diameter="16" *ngIf="loading"></mat-spinner>
              <mat-icon *ngIf="!loading">check_circle</mat-icon>
              {{ loading ? 'Saving...' : 'Save Resume' }}
            </button>
          </div>
        </div>

        <!-- ── RIGHT: Tips panel ── -->
        <div class="builder-tips-pane">
          <div class="tips-card">
            <div class="tips-header">
              <mat-icon>lightbulb</mat-icon> Tips for {{ steps[currentStep] }}
            </div>
            <div class="tips-list">
              <div *ngFor="let tip of currentTips" class="tip-item">
                <mat-icon>check_circle</mat-icon>
                <span>{{ tip }}</span>
              </div>
            </div>
          </div>

          <div class="completion-card">
            <div class="completion-label">Resume Completeness</div>
            <div class="completion-bar-wrap">
              <div class="completion-bar">
                <div class="completion-fill" [style.width]="completeness + '%'"></div>
              </div>
              <span class="completion-pct">{{ completeness }}%</span>
            </div>
            <div class="completion-checks">
              <div class="comp-check" [class.done]="form.value.title">
                <mat-icon>{{ form.value.title ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                Resume title
              </div>
              <div class="comp-check" [class.done]="form.value.summary">
                <mat-icon>{{ form.value.summary ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                Summary added
              </div>
              <div class="comp-check" [class.done]="expArray.length > 0">
                <mat-icon>{{ expArray.length > 0 ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                Work experience
              </div>
              <div class="comp-check" [class.done]="skillArray.length >= 3">
                <mat-icon>{{ skillArray.length >= 3 ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                3+ skills added
              </div>
              <div class="comp-check" [class.done]="eduArray.length > 0">
                <mat-icon>{{ eduArray.length > 0 ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                Education added
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Shell ── */
    .builder-shell { background: #f8fafc; min-height: 100vh; }

    /* ── Header ── */
    .builder-header {
      background: #fff; border-bottom: 1px solid #e2e8f0;
      position: sticky; top: 64px; z-index: 50;
    }
    .builder-header-inner {
      max-width: 1280px; margin: 0 auto;
      padding: 12px 24px; display: flex; align-items: center; gap: 16px;
    }
    .back-btn {
      width: 36px; height: 36px; border-radius: 9px;
      background: #f1f5f9; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #475569; transition: all 0.15s; flex-shrink: 0;
    }
    .back-btn:hover { background: #e2e8f0; color: #0f172a; }
    .back-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .builder-title-group h2 { font-size: 1rem; font-weight: 800; color: #0f172a; }
    .builder-title-group p { font-size: 0.75rem; color: #64748b; }
    .step-progress { display: flex; align-items: center; gap: 8px; flex: 1; max-width: 200px; margin-left: auto; }
    .progress-track { flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #06b6d4); border-radius: 3px; transition: width 0.4s ease; }
    .progress-label { font-size: 0.75rem; font-weight: 700; color: #2563eb; white-space: nowrap; }
    .save-draft-btn {
      display: flex; align-items: center; gap: 6px;
      background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 9px;
      padding: 8px 14px; font-size: 0.8rem; font-weight: 600; color: #475569;
      cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif;
      flex-shrink: 0;
    }
    .save-draft-btn:hover { background: #e2e8f0; }
    .save-draft-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* ── Step Tabs ── */
    .step-tabs {
      display: flex; overflow-x: auto; padding: 0 24px;
      border-top: 1px solid #f1f5f9; scrollbar-width: none;
    }
    .step-tabs::-webkit-scrollbar { display: none; }
    .step-tab {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; border: none; background: none; cursor: pointer;
      color: #94a3b8; font-size: 0.82rem; font-weight: 500;
      border-bottom: 2px solid transparent; transition: all 0.15s;
      white-space: nowrap; font-family: 'Inter', sans-serif;
    }
    .step-tab:hover { color: #475569; }
    .step-tab-active { color: #2563eb !important; border-bottom-color: #2563eb; font-weight: 700; }
    .step-tab-done { color: #10b981 !important; }
    .step-tab-num {
      width: 22px; height: 22px; border-radius: 50%;
      background: #f1f5f9; display: flex; align-items: center; justify-content: center;
      font-size: 0.72rem; font-weight: 700; flex-shrink: 0;
    }
    .step-tab-active .step-tab-num { background: #eff6ff; color: #2563eb; }
    .step-tab-done .step-tab-num { background: #d1fae5; color: #10b981; }
    .step-done-icon { font-size: 13px; width: 13px; height: 13px; }

    /* ── Body ── */
    .builder-body {
      display: grid; grid-template-columns: 1fr 320px;
      gap: 24px; max-width: 1280px; margin: 0 auto;
      padding: 28px 24px;
    }

    /* ── Form pane ── */
    .builder-form-pane {
      background: #fff; border: 1px solid #e2e8f0;
      border-radius: 16px; overflow: hidden;
    }

    /* ── Step pane ── */
    .step-pane { padding: 28px; }
    .step-intro {
      display: flex; align-items: flex-start; gap: 16px;
      margin-bottom: 28px; padding-bottom: 24px;
      border-bottom: 1px solid #f1f5f9;
    }
    .step-intro h3 { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .step-intro p { font-size: 0.875rem; color: #64748b; }
    .step-icon-wrap {
      width: 44px; height: 44px; border-radius: 12px;
      background: #eff6ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .step-icon-wrap mat-icon { color: #2563eb; font-size: 22px; width: 22px; height: 22px; }
    .step-icon-green { background: #d1fae5; }
    .step-icon-green mat-icon { color: #10b981; }

    /* ── Form fields ── */
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field-group { display: flex; flex-direction: column; }
    .field-group-full { grid-column: span 2; }
    .field-label { font-size: 0.8rem; font-weight: 600; color: #374151; margin-bottom: 6px; }
    .field-wrap {
      display: flex; align-items: center;
      border: 1.5px solid #e2e8f0; border-radius: 9px;
      background: #f9fafb; transition: all 0.2s; overflow: hidden;
    }
    .field-wrap:focus-within { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
    .field-wrap.invalid { border-color: #ef4444; }
    .field-wrap-textarea { align-items: flex-start; }
    .field-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; padding: 0 10px; flex-shrink: 0; }
    .field-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 0.875rem; color: #0f172a; padding: 11px 12px;
      font-family: 'Inter', sans-serif; width: 100%;
    }
    .field-input::placeholder { color: #94a3b8; }
    .field-textarea { resize: vertical; }
    .field-hint { font-size: 0.73rem; color: #94a3b8; margin-top: 4px; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: #374151; cursor: pointer; }
    .checkbox-input { width: 16px; height: 16px; accent-color: #2563eb; }

    /* ── Section divider ── */
    .section-divider {
      display: flex; align-items: center; gap: 12px;
      margin: 24px 0 16px; color: #94a3b8; font-size: 0.78rem; font-weight: 600;
    }
    .section-divider::before, .section-divider::after {
      content: ''; flex: 1; height: 1px; background: #e2e8f0;
    }

    /* ── Templates ── */
    .template-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
    .template-card {
      display: flex; align-items: center; gap: 12px;
      padding: 14px; border: 2px solid #e2e8f0; border-radius: 12px;
      cursor: pointer; transition: all 0.2s; position: relative;
    }
    .template-card:hover { border-color: #93c5fd; background: #f8fafc; }
    .template-selected { border-color: #2563eb; background: #eff6ff; }
    .template-preview {
      width: 40px; height: 40px; border-radius: 8px;
      background: #f1f5f9; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .template-preview mat-icon { color: #2563eb; font-size: 20px; width: 20px; height: 20px; }
    .template-name { font-size: 0.875rem; font-weight: 700; color: #0f172a; }
    .template-desc { font-size: 0.72rem; color: #64748b; }
    .template-check { font-size: 18px; width: 18px; height: 18px; color: #2563eb; margin-left: auto; }

    /* ── Array cards ── */
    .array-card {
      border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 16px; margin-bottom: 16px; background: #f9fafb;
    }
    .array-card-header {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;
      font-weight: 700; font-size: 0.87rem; color: #374151;
    }
    .array-card-header mat-icon { font-size: 16px; width: 16px; height: 16px; color: #2563eb; }
    .array-card-header span { flex: 1; }
    .remove-btn {
      background: #fee2e2; border: none; border-radius: 7px;
      width: 28px; height: 28px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #ef4444; transition: background 0.15s;
    }
    .remove-btn:hover { background: #fca5a5; }
    .remove-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* ── Skills ── */
    .quick-skills { margin-bottom: 20px; }
    .skill-suggestions { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-suggest-btn {
      background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 100px;
      padding: 4px 12px; font-size: 0.78rem; color: #475569; cursor: pointer;
      transition: all 0.15s; font-family: 'Inter', sans-serif;
    }
    .skill-suggest-btn:hover { background: #eff6ff; border-color: #93c5fd; color: #2563eb; }
    .skills-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
    .skill-item { display: flex; align-items: center; gap: 10px; }
    .skill-name-wrap { flex: 1; }
    .skill-level-select {
      width: 130px; height: 42px; border: 1.5px solid #e2e8f0; border-radius: 9px;
      background: #f9fafb; padding: 0 10px; font-size: 0.82rem; color: #374151;
      font-family: 'Inter', sans-serif; outline: none; flex-shrink: 0;
    }

    /* ── Add btn ── */
    .add-section-btn {
      display: flex; align-items: center; gap: 8px;
      width: 100%; padding: 12px; border-radius: 10px;
      border: 2px dashed #d1d5db; background: #f9fafb;
      color: #64748b; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
      margin-top: 4px;
    }
    .add-section-btn:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
    .add-section-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ── Empty section ── */
    .empty-section {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px; color: #94a3b8; text-align: center; gap: 8px;
    }
    .empty-section mat-icon { font-size: 36px; width: 36px; height: 36px; opacity: 0.4; }
    .empty-section p { font-size: 0.875rem; }

    /* ── Preview ── */
    .preview-resume {
      background: #fff; border: 1px solid #e2e8f0;
      border-radius: 12px; padding: 32px; margin-bottom: 20px;
      font-family: 'Inter', sans-serif;
    }
    .preview-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #2563eb; }
    .preview-name { font-size: 1.75rem; font-weight: 900; color: #0f172a; margin-bottom: 8px; }
    .preview-contact { display: flex; gap: 16px; flex-wrap: wrap; }
    .preview-contact span { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #64748b; }
    .preview-contact mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .preview-section { margin-bottom: 20px; }
    .preview-section-title {
      font-size: 0.78rem; font-weight: 800; color: #2563eb;
      text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;
      padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;
    }
    .preview-item { margin-bottom: 12px; }
    .preview-item-header { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 0.875rem; }
    .preview-date { font-size: 0.75rem; color: #64748b; flex-shrink: 0; }
    .preview-link { font-size: 0.75rem; color: #2563eb; }
    .preview-text { font-size: 0.82rem; color: #374151; line-height: 1.6; margin-top: 4px; white-space: pre-line; }
    .preview-skills { display: flex; flex-wrap: wrap; gap: 8px; }
    .preview-skill-tag {
      background: #f1f5f9; color: #374151;
      padding: 3px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 500;
    }
    .skill-level-tag { color: #64748b; font-weight: 400; }

    /* Preview actions */
    .preview-actions { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 0 28px 28px; }
    .download-pdf-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; height: 52px; border-radius: 12px;
      background: linear-gradient(135deg, #2563eb, #06b6d4);
      color: #fff; border: none; font-size: 1rem; font-weight: 700;
      cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
      box-shadow: 0 4px 14px rgba(37,99,235,0.3);
    }
    .download-pdf-btn:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(37,99,235,0.45); transform: translateY(-1px); }
    .download-pdf-btn:disabled { opacity: 0.65; cursor: not-allowed; }
    .download-pdf-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .preview-tip { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #94a3b8; }
    .preview-tip mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* ── Step nav ── */
    .step-nav {
      display: flex; align-items: center; gap: 12px;
      padding: 20px 28px; border-top: 1px solid #f1f5f9;
    }
    .nav-spacer { flex: 1; }
    .nav-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 22px; border-radius: 10px;
      font-size: 0.9rem; font-weight: 700; cursor: pointer;
      transition: all 0.2s; font-family: 'Inter', sans-serif; border: none;
    }
    .nav-btn mat-icon { font-size: 17px; width: 17px; height: 17px; }
    .nav-btn-ghost { background: #f1f5f9; color: #475569; }
    .nav-btn-ghost:hover { background: #e2e8f0; }
    .nav-btn-primary { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
    .nav-btn-primary:hover { box-shadow: 0 6px 18px rgba(37,99,235,0.45); transform: translateY(-1px); }
    .nav-btn-success { background: linear-gradient(135deg, #10b981, #059669); color: #fff; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
    .nav-btn-success:hover { box-shadow: 0 6px 18px rgba(16,185,129,0.45); transform: translateY(-1px); }

    /* ── Tips pane ── */
    .builder-tips-pane { display: flex; flex-direction: column; gap: 16px; }
    .tips-card, .completion-card {
      background: #fff; border: 1px solid #e2e8f0;
      border-radius: 14px; padding: 20px;
    }
    .tips-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.9rem; font-weight: 700; color: #0f172a; margin-bottom: 16px;
    }
    .tips-header mat-icon { font-size: 18px; width: 18px; height: 18px; color: #f59e0b; }
    .tips-list { display: flex; flex-direction: column; gap: 10px; }
    .tip-item { display: flex; align-items: flex-start; gap: 8px; font-size: 0.8rem; color: #475569; line-height: 1.5; }
    .tip-item mat-icon { font-size: 14px; width: 14px; height: 14px; color: #10b981; margin-top: 1px; flex-shrink: 0; }

    /* Completion */
    .completion-label { font-size: 0.8rem; font-weight: 700; color: #374151; margin-bottom: 10px; }
    .completion-bar-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .completion-bar { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .completion-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #10b981); border-radius: 4px; transition: width 0.5s ease; }
    .completion-pct { font-size: 0.82rem; font-weight: 700; color: #2563eb; white-space: nowrap; }
    .completion-checks { display: flex; flex-direction: column; gap: 8px; }
    .comp-check {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.78rem; color: #94a3b8;
    }
    .comp-check mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .comp-check.done { color: #374151; }
    .comp-check.done mat-icon { color: #10b981; }

    @media (max-width: 900px) {
      .builder-body { grid-template-columns: 1fr; }
      .builder-tips-pane { order: -1; }
      .form-grid-2 { grid-template-columns: 1fr; }
      .field-group-full { grid-column: 1; }
      .template-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ResumeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private resumeService = inject(ResumeService);
  private authService = inject(AuthService);
  private snack = inject(MatSnackBar);

  Math = Math;
  steps = STEPS;
  templates = TEMPLATES;
  currentStep = 0;
  isEdit = false;
  resumeId: string | null = null;
  loading = false;
  downloadingPdf = false;
  selectedTemplate = 'classic';

  auth$ = this.authService.user$;

  form = this.fb.group({
    title: ['', Validators.required],
    summary: [''],
    phone: [''],
    location: [''],
    linkedinUrl: [''],
    templateId: ['classic'],
    experiences: this.fb.array([]),
    skills: this.fb.array([]),
    educations: this.fb.array([]),
    projects: this.fb.array([]),
  });

  get expArray() { return this.form.get('experiences') as FormArray; }
  get skillArray() { return this.form.get('skills') as FormArray; }
  get eduArray() { return this.form.get('educations') as FormArray; }
  get projArray() { return this.form.get('projects') as FormArray; }

  get completeness() {
    let score = 0;
    if (this.form.value.title) score += 20;
    if (this.form.value.summary) score += 20;
    if (this.expArray.length > 0) score += 20;
    if (this.skillArray.length >= 3) score += 20;
    if (this.eduArray.length > 0) score += 20;
    return score;
  }

  skillSuggestions = ['JavaScript', 'TypeScript', 'React', 'Angular', 'Node.js', 'Python', 'SQL', 'AWS', 'Docker', 'Git', 'Figma', 'Agile'];

  stepTips: string[][] = [
    ['Use a clear, role-specific resume title', 'Keep your summary to 3-5 sentences', 'Include keywords from job descriptions', 'Choose an ATS-friendly template for corporate roles'],
    ['List most recent education first', 'Include CGPA/percentage if above 7.5/70%', 'Add relevant certifications here', 'Online courses from Coursera, MIT count too!'],
    ['Use bullet points starting with action verbs', 'Quantify achievements (e.g. "increased by 40%")', 'Focus on impact, not just responsibilities', 'Include tech stack used in each role'],
    ['Include 10-15 relevant skills only', 'Mix technical and soft skills', 'Match keywords from job descriptions', 'Rate yourself honestly on proficiency'],
    ['Include only relevant, real projects', 'Add GitHub/live links for every project', 'Describe tech stack and your role', 'Quantify impact where possible (e.g. "5K users")'],
    ['Save before downloading to get the latest', 'Check for spelling errors', 'Keep resume to 1 page for less than 3 years exp', 'Use the ATS template for large company applications'],
  ];

  get currentTips() { return this.stepTips[this.currentStep] ?? []; }

  ngOnInit() {
    this.resumeId = this.route.snapshot.paramMap.get('id');
    if (this.resumeId && this.resumeId !== 'new') {
      this.isEdit = true;
      this.resumeService.getResume(this.resumeId).subscribe({
        next: res => { if (res.data) this.patchResume(res.data); }
      });
    }
  }

  isInvalid(field: string) {
    const c = this.form.get(field);
    return c?.invalid && c?.touched;
  }

  goToStep(step: number) { this.currentStep = step; }
  nextStep() { if (this.currentStep < this.steps.length - 1) this.currentStep++; }
  prevStep() { if (this.currentStep > 0) this.currentStep--; }

  addEdu() { this.eduArray.push(this.fb.group({ institution: [''], degree: [''], fieldOfStudy: [''], startDate: [''], endDate: [''] })); }
  removeEdu(i: number) { this.eduArray.removeAt(i); }
  addExp() {
    const grp = this.fb.group({ company: [''], jobTitle: [''], description: [''], startDate: [''], endDate: [''], isCurrentRole: [false] });
    // Reactively disable endDate when isCurrentRole is toggled
    grp.get('isCurrentRole')?.valueChanges.subscribe(isCurrent =>
      isCurrent ? grp.get('endDate')?.disable() : grp.get('endDate')?.enable());
    this.expArray.push(grp);
  }
  removeExp(i: number) { this.expArray.removeAt(i); }
  addSkill() { this.skillArray.push(this.fb.group({ name: [''], level: ['Intermediate'] })); }
  addSkillByName(name: string) { this.skillArray.push(this.fb.group({ name: [name], level: ['Intermediate'] })); }
  removeSkill(i: number) { this.skillArray.removeAt(i); }
  addProj() { this.projArray.push(this.fb.group({ name: [''], description: [''], url: [''] })); }
  removeProj(i: number) { this.projArray.removeAt(i); }

  patchResume(data: any) {
    this.form.patchValue({ title: data.title, summary: data.summary, templateId: data.templateId ?? 'classic' });
    this.selectedTemplate = data.templateId ?? 'classic';

    // Helper: convert ISO datetime string to YYYY-MM for <input type="month">
    const toMonth = (v: string | null | undefined): string => {
      if (!v) return '';
      return v.substring(0, 7); // "2020-01-01T..." → "2020-01"
    };

    data.educations?.forEach((e: any) =>
      this.eduArray.push(this.fb.group({
        institution: [e.institution ?? ''],
        degree: [e.degree ?? ''],
        fieldOfStudy: [e.fieldOfStudy ?? ''],
        startDate: [toMonth(e.startDate)],
        endDate: [toMonth(e.endDate)]
      })));

    data.experiences?.forEach((e: any) => {
      const grp = this.fb.group({
        company: [e.company ?? ''],
        jobTitle: [e.jobTitle ?? ''],
        description: [e.description ?? ''],
        startDate: [toMonth(e.startDate)],
        endDate: [toMonth(e.endDate)],
        isCurrentRole: [e.isCurrentRole ?? false]
      });
      // Reactively disable endDate when isCurrentRole is true
      if (e.isCurrentRole) grp.get('endDate')?.disable();
      grp.get('isCurrentRole')?.valueChanges.subscribe(isCurrent =>
        isCurrent ? grp.get('endDate')?.disable() : grp.get('endDate')?.enable());
      this.expArray.push(grp);
    });

    data.skills?.forEach((s: any) =>
      this.skillArray.push(this.fb.group({ name: [s.name ?? ''], level: [s.level ?? 'Intermediate'] })));

    data.projects?.forEach((p: any) =>
      this.projArray.push(this.fb.group({ name: [p.name ?? ''], description: [p.description ?? ''], url: [p.url ?? ''] })));
  }

  save(isDraft = false) {
    if (this.form.get('title')?.invalid) {
      this.snack.open('Please add a resume title first', 'Close', { duration: 3000 });
      this.currentStep = 0; return;
    }
    this.loading = true;

    // Use getRawValue() — not .value — so disabled controls (e.g. endDate when
    // isCurrentRole=true) are included in the payload instead of being stripped.
    const payload = this.form.getRawValue() as any;

    const req = this.isEdit
      ? this.resumeService.updateResume(this.resumeId!, payload)
      : this.resumeService.createResume(payload);

    req.subscribe({
      next: res => {
        this.loading = false;
        if (!this.isEdit && res.data?.resumeId) {
          this.resumeId = res.data.resumeId;  // backend returns { resumeId: '...' }
          this.isEdit = true;
        }
        this.snack.open(isDraft ? 'Draft saved!' : 'Resume saved successfully!', 'OK', { duration: 3000 });
        if (!isDraft) this.router.navigate(['/seeker/resumes']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message ?? err?.error?.errors?.[0] ?? 'Error saving resume. Please check your inputs.';
        this.snack.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  downloadPdf() {
    if (!this.resumeId) {
      this.snack.open('Please save the resume first', 'Close', { duration: 3000 });
      return;
    }
    this.downloadingPdf = true;
    this.resumeService.downloadPdf(this.resumeId).subscribe({
      next: blob => {
        this.downloadingPdf = false;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${this.form.value.title ?? 'resume'}.pdf`; a.click();
        URL.revokeObjectURL(url);
        this.snack.open('PDF downloaded!', 'OK', { duration: 3000 });
      },
      error: () => {
        this.downloadingPdf = false;
        this.snack.open('PDF generation failed. Make sure the resume is saved.', 'Close', { duration: 4000 });
      }
    });
  }
}
