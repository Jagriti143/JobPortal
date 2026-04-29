# Job Portal & Resume Builder — Backend Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Infrastructure Setup](#4-infrastructure-setup)
5. [Running the Services](#5-running-the-services)
6. [Swagger Testing Guide](#6-swagger-testing-guide)
7. [Service Reference](#7-service-reference)
8. [Database Reference](#8-database-reference)
9. [Security Model](#9-security-model)
10. [Inter-Service Communication](#10-inter-service-communication)
11. [Running Tests](#11-running-tests)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Project Overview

This is the backend for a Job Portal & Resume Builder platform built as a .NET 10 microservices system.

### Three User Roles
- **JobSeeker** — registers, builds a resume, searches and applies for jobs, tracks application status
- **Recruiter** — posts jobs, reviews applicants, views resumes (costs points), unlocks contact details (costs points)
- **Admin** — moderates job listings, manages users, views audit logs and revenue reports

### Key Technologies
- Runtime: .NET 10 / ASP.NET Core
- Database: SQL Server (ROY\SQLEXPRESS, Windows Auth)
- Cache / Session: Redis 7
- Search: Elasticsearch 8
- Message Bus: RabbitMQ 3
- PDF Generation: QuestPDF
- Payment: Razorpay TEST API
- Email: SendGrid (placeholder in dev)
- Auth: JWT RS256 (RSA key pair, auto-generated on first run)

---

## 2. Architecture

```
Client Apps (deferred)
        |
        v
  ApiGateway :5000          <-- Ocelot, JWT RS256 validation, rate limiting
        |
  +-----------+-----------+-----------+-----------+-----------+
  |           |           |           |           |           |
:5001      :5002       :5003       :5004       :5005       :5006
Identity  JobCatalog  Application  Resume    Payment     Admin
Service    Service     Service    Service    Service    Service
  |           |           |           |           |           |
IdentityDb  JobDb    ApplicationDb ResumeDb  PaymentDb  AdminDb
  |           |                               |           |
Redis       Elasticsearch               (reads PaymentDb, IdentityDb, JobDb)
            RabbitMQ (publisher)
```

Each service owns its own SQL Server database. No shared databases. Services communicate via:
- HTTP (ResumeService → PaymentService for points deduction)
- HTTP (AdminService reads IdentityDb, JobDb, PaymentDb directly via separate DbContexts)
- RabbitMQ events (ApplicationService publishes status change events)

---

## 3. Prerequisites

Install all of the following before running the project.

### Required Software
| Software | Version | Download |
|---|---|---|
| .NET SDK | 10.x | https://dotnet.microsoft.com/download |
| SQL Server Express | 2022 | https://www.microsoft.com/en-us/sql-server/sql-server-downloads |
| SSMS | Latest | https://aka.ms/ssmsfullsetup |
| Redis | 7.x | https://github.com/microsoftarchive/redis/releases (Windows) |
| Elasticsearch | 8.x | https://www.elastic.co/downloads/elasticsearch |
| RabbitMQ | 3.x | https://www.rabbitmq.com/install-windows.html |
| Erlang (for RabbitMQ) | 26.x | https://www.erlang.org/downloads |

### Optional (for payment testing)
- Razorpay TEST account: https://dashboard.razorpay.com (free signup)
- ngrok (to receive Razorpay webhooks locally): https://ngrok.com

### Verify installations
```powershell
dotnet --version          # should show 10.x
redisr         # should return PONG
# Elasticsearch: open http://localhost:9200 in browser — should return JSON
# RabbitMQ: open http://localhost:15672 (guest/guest)
```

---

## 4. Infrastructure Setup

### Step 1 — Start Redis
```powershell
# If installed as a service, it starts automatically.
# To start manually:
redis-server
```

### Step 2 — Start Elasticsearch
```powershell
# Navigate to your Elasticsearch install folder, e.g.:
cd "C:\elasticsearch-8.x.x\bin"
.\elasticsearch.bat
# Wait for "started" message. Verify: http://localhost:9200
```

### Step 3 — Start RabbitMQ
```powershell
# If installed as a service, it starts automatically.
# Management UI: http://localhost:15672  (login: guest / guest)
# To start manually:
cd "C:\Program Files\RabbitMQ Server\rabbitmq_server-x.x.x\sbin"
.\rabbitmq-server.bat
```

### Step 4 — SQL Server databases
The databases are created automatically when you run each service for the first time (EF Core migrations run on startup via `dotnet ef database update`, which was already executed during setup).

All 6 databases already exist on `ROY\SQLEXPRESS`:
- IdentityDb, JobDb, ApplicationDb, ResumeDb, PaymentDb, AdminDb

To verify in SSMS: connect to `ROY\SQLEXPRESS` with Windows Authentication and check Object Explorer.

### Step 5 — Razorpay TEST keys (optional, for payment flow)
1. Sign up at https://dashboard.razorpay.com
2. Go to Settings → API Keys → Generate Test Key
3. Open `JobPortalSystem/PaymentService/appsettings.json`
4. Replace the placeholder values:
```json
"Razorpay": {
  "KeyId": "rzp_test_YOUR_KEY_ID",
  "KeySecret": "YOUR_KEY_SECRET",
  "WebhookSecret": "YOUR_WEBHOOK_SECRET"
}
```

---

## 5. Running the Services

### IMPORTANT: Start order matters
IdentityService must start first. All other services fetch the RSA public key from IdentityService on startup for JWT validation. If IdentityService is not running when another service starts, that service will log a warning and JWT validation will not work until it is restarted.

### Recommended startup order
1. IdentityService (port 5001)
2. PaymentService (port 5005)
3. JobCatalogService (port 5002)
4. ApplicationService (port 5003)
5. ResumeService (port 5004)
6. AdminService (port 5006)
7. ApiGateway (port 5000)

### Option A — Run each service in a separate terminal

Open 7 terminal windows in VS Code (`Ctrl+Shift+`` ` then split). In each terminal:

```powershell
# Terminal 1 — IdentityService
dotnet run --project JobPortalSystem/IdentityService

# Terminal 2 — PaymentService
dotnet run --project JobPortalSystem/PaymentService

# Terminal 3 — JobCatalogService
dotnet run --project JobPortalSystem/JobCatalogService

# Terminal 4 — ApplicationService
dotnet run --project JobPortalSystem/ApplicationService

# Terminal 5 — ResumeService
dotnet run --project JobPortalSystem/ResumeService

# Terminal 6 — AdminService
dotnet run --project JobPortalSystem/AdminService

# Terminal 7 — ApiGateway
dotnet run --project JobPortalSystem/ApiGateway
```

### Option B — Run from Visual Studio
Open `JobPortalSystem/JobPortalSystem.slnx` in Visual Studio. Right-click the solution → Properties → Multiple Startup Projects. Set all 7 projects to "Start". Click the green play button.

### Verify all services are running
Open these URLs in your browser — each should show a Swagger UI:

| Service | Direct URL | Via Gateway |
|---|---|---|
| IdentityService | http://localhost:5001/swagger | http://localhost:5000/swagger |
| JobCatalogService | http://localhost:5002/swagger | — |
| ApplicationService | http://localhost:5003/swagger | — |
| ResumeService | http://localhost:5004/swagger | — |
| PaymentService | http://localhost:5005/swagger | — |
| AdminService | http://localhost:5006/swagger | — |
| ApiGateway | http://localhost:5000/swagger | — |

### RSA Key Generation
On first run of IdentityService, it auto-generates an RSA 2048-bit key pair and saves:
- `JobPortalSystem/IdentityService/keys/private.pem`
- `JobPortalSystem/IdentityService/keys/public.pem`

These files are created automatically. Do not delete them while services are running.

---

## 6. Swagger Testing Guide

This is the step-by-step guide to test every feature of the system using Swagger UI. Use the direct service URLs (e.g., http://localhost:5001/swagger) for testing — the gateway adds an extra layer that can complicate debugging.

---

### Step 1 — Register a JobSeeker

Open http://localhost:5001/swagger

Find `POST /auth/register` → click "Try it out" → paste:
```json
{
  "email": "jobseeker@test.com",
  "password": "Password123!",
  "role": "JobSeeker"
}
```
Click Execute. Expected: `201 Created` with a `userId`.

---

### Step 2 — Verify Email (dev shortcut)

Since SendGrid is not configured in dev, the verification token is stored in the database. To get it:

Open SSMS → connect to `ROY\SQLEXPRESS` → run:
```sql
USE IdentityDb;
SELECT Email, EmailVerificationToken FROM Users WHERE Email = 'jobseeker@test.com';
```

Copy the token value. Back in Swagger, find `GET /auth/verify-email` → Try it out → paste the token in the `token` query parameter → Execute. Expected: `200 OK`.

---

### Step 3 — Login and get JWT token

Find `POST /auth/login` → Try it out:
```json
{
  "email": "jobseeker@test.com",
  "password": "Password123!"
}
```
Expected: `200 OK` with `accessToken` and `refreshToken`.

Copy the `accessToken` value (the long JWT string).

---

### Step 4 — Authorize in Swagger

Click the green "Authorize" button at the top of the Swagger page.
In the "Value" field type: `Bearer ` followed by your token (note the space).
Example: `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...`
Click "Authorize" then "Close".

Now all protected endpoints will use your token automatically.

---

### Step 5 — Test protected profile endpoint

Find `GET /auth/me` → Try it out → Execute.
Expected: `200 OK` with your user profile (id, email, role, emailVerified).

---

### Step 6 — Register a Recruiter

Repeat Steps 1–4 with:
```json
{
  "email": "recruiter@test.com",
  "password": "Password123!",
  "role": "Recruiter"
}

{
  "email": "admin@test.com",
  "password": "Password123!",
  "role": "Recruiter"
}
```
Keep the Recruiter's JWT token handy — you'll need it for job posting and wallet operations.

---

### Step 7 — Create a Company (via SSMS, required before posting jobs)

JobCatalogService does not have a "create company" endpoint — companies are seeded directly. Insert one via SSMS:
```sql
USE JobDb;
INSERT INTO Companies (Id, Name, Description, Website, Industry, Location, CreatedAt)
VALUES (NEWID(), 'Acme Corp', 'A great company', 'https://acme.com', 'Technology', 'Mumbai', GETUTCDATE());

-- Copy the Id from this query:
SELECT Id, Name FROM Companies;
```

---

### Step 8 — Post a Job (as Recruiter)

Open http://localhost:5002/swagger. Authorize with the Recruiter JWT token.

Find `POST /jobs` → Try it out:
```json
{
  "companyId": "PASTE-COMPANY-ID-HERE",
  "title": "Senior .NET Developer",
  "description": "We are looking for an experienced .NET developer to join our team.",
  "location": "Mumbai",
  "jobType": "FullTime",
  "salaryMin": 1200000,
  "salaryMax": 2000000
}
```
Expected: `201 Created` with a `jobId`. Note: the job starts with `ModerationStatus = Pending` and will NOT appear in search until an Admin approves it.

---

### Step 9 — Approve the Job (as Admin)

First, create an Admin user. In SSMS:
```sql
USE IdentityDb;
-- Find a user and promote them to Admin:
UPDATE Users SET Role = 'Admin' WHERE Email = 'jobseeker@test.com';
-- Then log in again to get a new token with the Admin role.
```

Or register a new user and update their role via SSMS.

Open http://localhost:5006/swagger. Authorize with the Admin JWT.

Find `POST /admin/jobs/{jobId}/approve` → Try it out → paste the jobId → Execute.
Expected: `200 OK`. The job is now `Approved` and will appear in Elasticsearch search.

---

### Step 10 — Search for Jobs

Open http://localhost:5002/swagger (no auth needed for search).

Find `GET /jobs/search` → Try it out:
- `q`: `developer`
- `location`: `Mumbai` (optional)
- `page`: `1`
- `limit`: `10`

Expected: `200 OK` with matching jobs. Note: Elasticsearch must be running for this to work. If ES is down, it returns an empty array.

---

### Step 11 — Apply for a Job (as JobSeeker)

Open http://localhost:5003/swagger. Authorize with the JobSeeker JWT.

Find `POST /applications` → Try it out:
```json
{
  "jobId": "PASTE-JOB-ID-HERE",
  "coverLetter": "I am very interested in this position."
}
```
Expected: `201 Created` with an `applicationId`.

---

### Step 12 — Check Application Status (as JobSeeker)

Find `GET /applications/my` → Try it out → Execute.
Expected: `200 OK` with a list of your applications, each showing `Status: "Submitted"`.

---

### Step 13 — Recruiter Reviews Application

Open http://localhost:5003/swagger. Authorize with the Recruiter JWT.

Find `PATCH /applications/{applicationId}/status` → Try it out:
```json
{
  "newStatus": "Reviewed"
}
```
Expected: `200 OK`. A RabbitMQ event is published (if RabbitMQ is running).

Valid status transitions:
- `Submitted` → `Reviewed` or `Rejected`
- `Reviewed` → `Shortlisted` or `Rejected`
- `Shortlisted` → `Rejected`

---

### Step 14 — Create a Resume (as JobSeeker)

Open http://localhost:5004/swagger. Authorize with the JobSeeker JWT.

Find `POST /resumes` → Try it out:
```json
{
  "title": "My Professional Resume",
  "summary": "Experienced .NET developer with 5 years of experience.",
  "templateId": "Classic",
  "educations": [
    {
      "institution": "Mumbai University",
      "degree": "B.Tech Computer Science",
      "fieldOfStudy": "Computer Science",
      "startDate": "2015-06-01",
      "endDate": "2019-05-31"
    }
  ],
  "experiences": [
    {
      "company": "TechCorp",
      "jobTitle": "Software Engineer",
      "description": "Developed REST APIs using .NET Core.",
      "startDate": "2019-07-01",
      "isCurrentRole": true
    }
  ],
  "skills": [
    { "name": "C#", "level": "Expert" },
    { "name": "SQL Server", "level": "Intermediate" }
  ],
  "projects": [
    {
      "name": "Job Portal",
      "description": "Built a microservices-based job portal.",
      "url": "https://github.com/example/jobportal"
    }
  ]
}
```
Expected: `201 Created` with a `resumeId`.

---

### Step 15 — Download Resume as PDF

Find `GET /resumes/{resumeId}/pdf` → Try it out → paste resumeId → Execute.
Expected: `200 OK` with a PDF file download. Click "Download file" in Swagger.

---

### Step 16 — Recruiter Purchases Points

Open http://localhost:5005/swagger. Authorize with the Recruiter JWT.

Find `POST /payments/wallet/purchase` → Try it out:
```json
{
  "amountInPaise": 50000
}
```
(50000 paise = ₹500 = 500 points)

Expected: `200 OK` with a Razorpay `orderId`. In a real flow, the frontend would open the Razorpay checkout. For testing, you can manually credit the wallet via SSMS:

```sql
USE PaymentDb;
-- First ensure wallet exists:
INSERT INTO RecruiterWallets (Id, RecruiterId, PointsBalance, CreatedAt, UpdatedAt)
VALUES (NEWID(), 'RECRUITER-USER-ID-HERE', 500, GETUTCDATE(), GETUTCDATE());
```

---

### Step 17 — Recruiter Views Resume (costs 10 points)

Open http://localhost:5004/swagger. Authorize with the Recruiter JWT.

Find `GET /resumes/{resumeId}/view` → Try it out → paste resumeId → Execute.
Expected: `200 OK` with full resume data. 10 points are deducted from the Recruiter's wallet.

If the Recruiter has insufficient points: `402 Payment Required`.

---

### Step 18 — Check Wallet Balance

Open http://localhost:5005/swagger. Authorize with the Recruiter JWT.

Find `GET /payments/wallet/balance` → Execute.
Expected: `200 OK` with current `balance` (should be 490 after one resume view).



---

### Step 19 — View Transaction History

Find `GET /payments/wallet/transactions` → Execute.
Expected: `200 OK` with a list of credit/debit transactions.

---

### Step 20 — Admin Views Revenue Report

Open http://localhost:5006/swagger. Authorize with the Admin JWT.

Find `GET /admin/reports/revenue` → Execute.
Expected: `200 OK` with revenue grouped by day.

Find `GET /admin/audit-logs` → Execute.
Expected: `200 OK` with a paginated list of all admin actions.

---

### Step 21 — Test Token Refresh

Open http://localhost:5001/swagger.

Find `POST /auth/refresh-token` → Try it out:
```json
{*
  "refreshToken": "PASTE-REFRESH-TOKEN-FROM-LOGIN"
}
```
Expected: `200 OK` with a new `accessToken` and `refreshToken`. The old refresh token is now invalid.

---

### Step 22 — Test Logout

Find `POST /auth/logout` → Authorize with your JWT → Execute.
Expected: `200 OK`. The JWT is now blocklisted in Redis. Any subsequent request with the same token returns `401 Unauthorized`.

---

### Step 23 — Test Account Lockout

Try logging in with a wrong password 5 times in a row:
```json
{ "email": "jobseeker@test.com", "password": "WrongPassword!" }
```
After the 5th attempt, the account is locked for 15 minutes. The 6th attempt returns `423 Locked` with the remaining lockout duration.

---

## 7. Service Reference

### IdentityService — http://localhost:5001

Handles all authentication and user identity. Owns the RSA private key.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /auth/register | None | Register JobSeeker or Recruiter |
| GET | /auth/verify-email?token= | None | Verify email address |
| POST | /auth/login | None | Login, returns JWT + refresh token |
| POST | /auth/refresh-token | None | Rotate refresh token |
| POST | /auth/logout | JWT | Revoke session, blocklist JTI |
| GET | /auth/me | JWT | Get current user profile |
| PUT | /auth/me | JWT | Update display name |
| POST | /auth/forgot-password | None | Send password reset email |
| POST | /auth/reset-password | None | Apply new password |
| GET | /auth/public-key | None | Get RSA public key (PEM) |

**JWT Token contents:**
```json
{
  "sub": "user-guid",
  "email": "user@example.com",
  "role": "JobSeeker",
  "jti": "unique-token-id",
  "exp": 1234567890
}
```
Access token expires in 15 minutes. Refresh token expires in 7 days.

---

### JobCatalogService — http://localhost:5002

Manages job listings, company profiles, and Elasticsearch-backed search.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /jobs/search | None | Full-text search via Elasticsearch |
| GET | /jobs/{id} | None | Get job detail |
| GET | /jobs/company/{companyId} | None | Jobs by company |
| POST | /jobs | Recruiter | Post new job (starts as Pending) |
| PUT | /jobs/{id} | Recruiter | Edit own job |
| PATCH | /jobs/{id}/status | Admin | Approve or Flag job |
| GET | /companies/{id} | None | Company profile |
| GET | /companies/{id}/reviews | None | Company reviews |
| POST | /companies/{id}/reviews | JobSeeker | Submit review |

**Job moderation flow:** `Pending` (on create) → `Approved` (Admin approves, appears in search) → `Flagged` (Admin flags, removed from search).

**Search parameters:** `q`, `location`, `jobType`, `salaryMin`, `salaryMax`, `page`, `limit`

---

### ApplicationService — http://localhost:5003

Manages job applications and their lifecycle.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /applications | JobSeeker | Apply to a job |
| GET | /applications/my | JobSeeker | My application dashboard |
| GET | /applications/{id} | JWT | Application detail |
| GET | /applications/job/{jobId} | Recruiter | All applicants for a job |
| PATCH | /applications/{id}/status | Recruiter | Update status |
| PATCH | /applications/{id}/shortlist | Recruiter | Shortlist candidate |
| DELETE | /applications/{id} | JobSeeker | Withdraw application |

**Status state machine:**
```
Submitted → Reviewed → Shortlisted → Rejected
Submitted → Rejected
Submitted → Withdrawn (JobSeeker DELETE only)
```
`Rejected` and `Withdrawn` are terminal states. Any invalid transition returns `422 Unprocessable Entity`.

On every status change, an `ApplicationStatusChanged` event is published to RabbitMQ exchange `application-events` (fanout, durable).

---

### ResumeService — http://localhost:5004

Manages resume CRUD, PDF generation, and points-gated recruiter access.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /resumes/templates | None | List 4 templates |
| GET | /resumes/my | JobSeeker | My resumes |
| POST | /resumes | JobSeeker | Create resume |
| PUT | /resumes/{id} | JobSeeker | Update resume |
| GET | /resumes/{id}/pdf | JobSeeker | Download as PDF |
| GET | /resumes/{id}/view | Recruiter | View resume (costs 10 points) |

**Templates:** `Classic`, `Modern`, `Minimal`, `Creative`

**Resume sections:** Summary, Education, Experience, Skills, Projects, Certifications

**Points-gated view flow:**
1. Recruiter calls `GET /resumes/{id}/view`
2. ResumeService calls `POST http://localhost:5005/payments/wallet/deduct` with `{ recruiterId, action: "ResumeView" }`
3. If PaymentService returns 402 → ResumeService returns 402 to caller
4. If PaymentService returns 200 → ResumeService returns full resume data

---

### PaymentService — http://localhost:5005

Manages the Razorpay-backed recruiter wallet and points system.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /payments/wallet/balance | Recruiter | Current points balance |
| POST | /payments/wallet/purchase | Recruiter | Initiate Razorpay order |
| POST | /payments/wallet/webhook | None | Razorpay webhook (HMAC verified) |
| POST | /payments/wallet/deduct | Internal | Deduct points for an action |
| POST | /payments/wallet/unlock-contact | Recruiter | Unlock contact (costs 20 points) |
| GET | /payments/wallet/transactions | Recruiter | Transaction history |
| GET | /payments/admin/transactions | Admin | All platform transactions |
| GET | /payments/admin/revenue | Admin | Revenue grouped by day |

**Points deduction rules (seeded on startup):**
- `ResumeView` = 10 points
- `ContactUnlock` = 20 points

**Wallet safety:** Uses EF Core `RowVersion` (optimistic concurrency) to prevent concurrent over-deduction. Retries up to 3 times on conflict, then returns `409 Conflict`.

**Webhook idempotency:** The `IdempotencyKey` column has a UNIQUE constraint. Duplicate Razorpay payment IDs are silently ignored (returns 200 without double-crediting).

**Points-to-INR mapping:** 1 paise = 1 point (100 paise = ₹1 = 100 points). Adjust in `PaymentController.cs` if needed.

---

### AdminService — http://localhost:5006

Full platform management. All endpoints require `Admin` role.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /admin/users | Admin | Paginated user list |
| PUT | /admin/users/{id}/role | Admin | Change user role |
| DELETE | /admin/users/{id} | Admin | Soft-delete user |
| GET | /admin/jobs/moderation-queue | Admin | Pending jobs |
| POST | /admin/jobs/{id}/approve | Admin | Approve job |
| POST | /admin/jobs/{id}/flag | Admin | Flag/reject job |
| GET | /admin/audit-logs | Admin | Paginated audit trail |
| GET | /admin/reports/transactions | Admin | All payment transactions |
| GET | /admin/reports/revenue | Admin | Revenue by day |

**Cross-DB reads:** AdminService connects directly to IdentityDb, JobDb, and PaymentDb using read-only DbContexts. It does NOT call other services via HTTP for reads — it queries the databases directly.

**Audit logging:** Every role change, user deletion, job approval, and job flagging writes an `AuditLog` entry to AdminDb.

---

### ApiGateway — http://localhost:5000

Ocelot-based gateway. Routes all `/gateway/*` requests to downstream services.

| Upstream Path | Downstream Service |
|---|---|
| /gateway/auth/* | IdentityService :5001 |
| /gateway/jobs/* | JobCatalogService :5002 |
| /gateway/companies/* | JobCatalogService :5002 |
| /gateway/applications/* | ApplicationService :5003 |
| /gateway/resumes/* | ResumeService :5004 |
| /gateway/payments/* | PaymentService :5005 |
| /gateway/admin/* | AdminService :5006 |

**Rate limiting:** 100 requests per minute per IP. Returns `429 Too Many Requests` when exceeded.

**JWT validation:** The gateway validates JWT signatures using the RSA public key fetched from IdentityService at startup. Protected routes return `401` if no valid token is provided.

**Public routes (no auth required at gateway):**
`/gateway/auth/register`, `/gateway/auth/login`, `/gateway/auth/verify-email`, `/gateway/auth/forgot-password`, `/gateway/auth/reset-password`, `/gateway/auth/public-key`, `/gateway/jobs/search`, `/gateway/jobs/{id}`, `/gateway/companies/{id}`

---

## 8. Database Reference

All databases are on `ROY\SQLEXPRESS` with Windows Authentication.

### IdentityDb
| Table | Key Columns | Purpose |
|---|---|---|
| Users | Id, Email (UNIQUE), Role, PasswordHash, EmailVerified, LockoutEnd, IsDeleted | All user accounts |
| RefreshTokens | Id, UserId, TokenHash (bcrypt), ExpiresAt, IsRevoked | Refresh token rotation |

### JobDb
| Table | Key Columns | Purpose |
|---|---|---|
| Companies | Id, Name, Industry, Location | Company profiles |
| CompanyReviews | Id, CompanyId, ReviewerId, Rating, Comment | Company reviews |
| Jobs | Id, CompanyId, PostedByRecruiterId, Title, ModerationStatus | Job listings |

### ApplicationDb
| Table | Key Columns | Purpose |
|---|---|---|
| Applications | Id, JobSeekerId, JobId (UNIQUE together), Status | Job applications |

### ResumeDb
| Table | Key Columns | Purpose |
|---|---|---|
| Resumes | Id, OwnerId, Title, TemplateId | Resume header |
| Educations | Id, ResumeId, Institution, Degree | Education section |
| Experiences | Id, ResumeId, Company, JobTitle | Experience section |
| Skills | Id, ResumeId, Name, Level | Skills section |
| Projects | Id, ResumeId, Name, Description | Projects section |

### PaymentDb
| Table | Key Columns | Purpose |
|---|---|---|
| RecruiterWallets | Id, RecruiterId (UNIQUE), PointsBalance, RowVersion | Wallet with optimistic concurrency |
| Transactions | Id, WalletId, Type, Points, IdempotencyKey (UNIQUE) | All credits and debits |
| PointsDeductionRules | Id, Action, Points | Configurable deduction costs |

### AdminDb
| Table | Key Columns | Purpose |
|---|---|---|
| AuditLogs | Id, AdminId, Action, TargetType, TargetId, Details | Immutable audit trail |

---

## 9. Security Model

### JWT RS256
- IdentityService generates a 2048-bit RSA key pair on first startup
- Private key: `IdentityService/keys/private.pem` (never leaves IdentityService)
- Public key: served at `GET /auth/public-key` (PEM format)
- All other services fetch the public key at startup for token validation
- Algorithm: RS256 (RSA + SHA-256)
- Access token lifetime: 15 minutes
- Refresh token lifetime: 7 days (stored as bcrypt hash, never plaintext)

### JTI Blocklist (Redis)
- On logout, the token's `jti` claim is stored in Redis with TTL = remaining token lifetime
- Key pattern: `jti:{jti-value}`
- Every protected request checks Redis before processing
- If Redis is unavailable, the system fails-open (logs a warning, allows the request)

### RBAC
- Role is embedded in the JWT as a claim
- Controllers use `[Authorize(Roles = "Recruiter")]` etc.
- Resource ownership is checked in controller logic (e.g., recruiters can only edit their own jobs)
- Admin role can be assigned via SSMS or via `PUT /admin/users/{id}/role`

### Account Lockout
- 5 consecutive failed login attempts → account locked for 15 minutes
- `LockoutEnd` timestamp stored in Users table
- Returns `423 Locked` with remaining seconds

### Payment Security
- Razorpay webhook: HMAC-SHA256 signature verified before any wallet credit
- Idempotency: `Transaction.IdempotencyKey` has a UNIQUE constraint — duplicate webhooks are silently ignored
- Optimistic concurrency: `RecruiterWallet.RowVersion` prevents concurrent over-deduction
- No raw card data stored anywhere — Razorpay handles PCI compliance

### Password Security
- Passwords hashed with BCrypt (work factor 10)
- Never stored or logged in plaintext

---

## 10. Inter-Service Communication

### Synchronous HTTP
| From | To | Endpoint | When |
|---|---|---|---|
| ResumeService | PaymentService | POST /payments/wallet/deduct | Recruiter views a resume |
| AdminService | IdentityDb | Direct DB read | List/update users |
| AdminService | JobDb | Direct DB read/write | Moderation queue, approve/flag |
| AdminService | PaymentDb | Direct DB read | Revenue reports |

### Asynchronous (RabbitMQ)
| Publisher | Exchange | Event | Consumer |
|---|---|---|---|
| ApplicationService | application-events (fanout, durable) | ApplicationStatusChanged | Any subscriber (push notification service, email service — not yet implemented) |

**ApplicationStatusChanged event schema:**
```json
{
  "applicationId": "guid",
  "jobSeekerId": "guid",
  "jobId": "guid",
  "oldStatus": "Submitted",
  "newStatus": "Reviewed",
  "changedAt": "2024-01-01T00:00:00Z"
}
```

### Elasticsearch (JobCatalogService)
- Jobs are indexed when created (`POST /jobs`)
- Jobs are updated in the index when edited (`PUT /jobs/{id}`)
- Jobs are removed from the index when flagged (`PATCH /jobs/{id}/status` with `Flagged`)
- Jobs are added to the index when approved (`PATCH /jobs/{id}/status` with `Approved`)
- On startup, `JobSyncService` bulk-indexes all `Approved` jobs that are missing from the index

---

## 11. Running Tests

### Run all tests (no external services needed)
```powershell
dotnet test JobPortalSystem/JobPortalSystem.slnx
```

Tests use SQLite in-memory databases and stub implementations for Redis, Elasticsearch, RabbitMQ, Razorpay, and SendGrid. No SQL Server, Redis, or any other service needs to be running.

### Run tests for a specific service
```powershell
dotnet test JobPortalSystem/IdentityService.Tests
dotnet test JobPortalSystem/PaymentService.Tests
dotnet test JobPortalSystem/ApplicationService.Tests
```

### Test coverage summary
| Project | Tests | What's covered |
|---|---|---|
| IdentityService.Tests | 6 | Register, duplicate email, invalid role, unverified login, wrong password, public key |
| JobCatalogService.Tests | 5 | Search, get job, get company, post job auth guard |
| ApplicationService.Tests | 4 | Auth guards, state machine valid/invalid transitions |
| ResumeService.Tests | 5 | Templates, auth guards, insufficient points |
| PaymentService.Tests | 8 | Auth, webhook HMAC, deduct insufficient/sufficient balance |
| AdminService.Tests | 5 | Auth guards on all admin endpoints |

---

## 12. Troubleshooting

### "RSA public key not available" on startup
IdentityService is not running or not yet ready. Start IdentityService first and wait for it to print "Now listening on http://localhost:5001" before starting other services.

### JWT validation fails (401 on all requests)
The service started before IdentityService was ready and could not fetch the public key. Restart the affected service after IdentityService is running.

### Elasticsearch search returns empty results
- Verify Elasticsearch is running: `curl http://localhost:9200`
- Jobs must be `Approved` to appear in search results
- The `jobs` index is created automatically on first job indexing

### RabbitMQ connection errors in ApplicationService logs
RabbitMQ is not running. The service will still work — status updates succeed, but events are not published. Start RabbitMQ and restart ApplicationService.

### Redis connection errors in IdentityService logs
Redis is not running. The JTI blocklist will fail-open (logged-out tokens may still work until they expire naturally). Start Redis and restart IdentityService.

### "PaymentDb: Cannot insert duplicate key" on wallet deduct
This is the idempotency key constraint working correctly — a duplicate webhook was received and ignored.

### "DbUpdateConcurrencyException" in PaymentService logs
Two concurrent deduction requests hit the same wallet simultaneously. The service retries up to 3 times. If it fails after 3 retries, it returns `409 Conflict`. This is expected behavior under high concurrency.

### Cannot connect to SQL Server
Verify the instance name. The connection string uses `ROY\\SQLEXPRESS`. If your SQL Server instance has a different name, update all `appsettings.json` files:
- `JobPortalSystem/IdentityService/appsettings.json`
- `JobPortalSystem/JobCatalogService/appsettings.json`
- `JobPortalSystem/ApplicationService/appsettings.json`
- `JobPortalSystem/ResumeService/appsettings.json`
- `JobPortalSystem/PaymentService/appsettings.json`
- `JobPortalSystem/AdminService/appsettings.json`

Change `ROY\\SQLEXPRESS` to your instance name (e.g., `localhost\\SQLEXPRESS` or just `localhost`).

### Re-running EF migrations (if databases are dropped)
```powershell
dotnet ef database update --project JobPortalSystem/IdentityService
dotnet ef database update --project JobPortalSystem/JobCatalogService
dotnet ef database update --project JobPortalSystem/ApplicationService
dotnet ef database update --project JobPortalSystem/ResumeService
dotnet ef database update --project JobPortalSystem/PaymentService
dotnet ef database update --project JobPortalSystem/AdminService
```

### Logs location
Each service writes rolling daily logs to its own `logs/` folder:
- `JobPortalSystem/IdentityService/logs/identity-YYYYMMDD.log`
- `JobPortalSystem/JobCatalogService/logs/jobcatalog-YYYYMMDD.log`
- `JobPortalSystem/ApplicationService/logs/application-YYYYMMDD.log`
- `JobPortalSystem/ResumeService/logs/resume-YYYYMMDD.log`
- `JobPortalSystem/PaymentService/logs/payment-YYYYMMDD.log`
- `JobPortalSystem/AdminService/logs/admin-YYYYMMDD.log`
- `JobPortalSystem/ApiGateway/logs/gateway-YYYYMMDD.log`

All logs are structured JSON (Serilog CompactJsonFormatter).

---

## Quick Reference — All Service Ports

| Service | Port | Swagger |
|---|---|---|
| ApiGateway | 5000 | http://localhost:5000/swagger |
| IdentityService | 5001 | http://localhost:5001/swagger |
| JobCatalogService | 5002 | http://localhost:5002/swagger |
| ApplicationService | 5003 | http://localhost:5003/swagger |
| ResumeService | 5004 | http://localhost:5004/swagger |
| PaymentService | 5005 | http://localhost:5005/swagger |
| AdminService | 5006 | http://localhost:5006/swagger |
| Redis | 6379 | — |
| Elasticsearch | 9200 | http://localhost:9200 |
| RabbitMQ | 5672 | http://localhost:15672 (management UI) |
| SQL Server | 1433 | SSMS → ROY\SQLEXPRESS |
