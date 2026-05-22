# JobPortal

Enterprise Job Portal System

A full-stack recruitment platform built using Angular 21 and .NET 10 with a microservices-style architecture. The system connects job seekers, recruiters, and administrators through secure and scalable services for job management, applications, resume handling, recruiter wallet operations, and admin moderation.

Features
Authentication & Authorization
JWT authentication with RSA signing
Role-based access control (JobSeeker, Recruiter, Admin)
Refresh tokens and logout token revocation using Redis
Email verification and password reset support
Job Management
Recruiters can create, update, and manage job postings
Admin moderation for job approval and flagging
Elasticsearch-powered job search with filtering and sorting
Application Management
Job seekers can apply for jobs
Recruiters can review and manage applicants
Application status tracking and email notifications
Resume Management
Resume creation and management
PDF resume generation using QuestPDF
Resume unlock system for recruiters
Payment & Wallet System
Razorpay payment integration
Recruiter wallet and points management
Distributed resume unlock workflow using RabbitMQ and MassTransit Saga
Admin Panel
User management
Job moderation
Reports and audit workflows
Tech Stack
Frontend
Angular 21
TypeScript
Angular Material
SCSS
Backend
.NET 10 / ASP.NET Core
Entity Framework Core
Ocelot API Gateway
Databases & Infrastructure
SQL Server
Redis
Elasticsearch
RabbitMQ
Other Tools & Libraries
MassTransit
Razorpay
QuestPDF
Serilog
Architecture Overview

The project follows a service-oriented backend architecture where each domain is handled by an independent service.

Services
ApiGateway
IdentityService
JobCatalogService
ApplicationService
ResumeService
PaymentService
AdminService

The Angular frontend communicates with backend services through the Ocelot API Gateway.

Key Functionalities
Secure authentication and authorization
Elasticsearch-based job search
Resume unlock workflow with distributed messaging
Wallet and payment management
Role-based dashboards
Email notifications
RESTful APIs with scalable backend structure
Future Enhancements
Docker containerization
Kubernetes deployment
OpenTelemetry monitoring
Real-time notifications using SignalR
Enhanced saga compensation handling
Improved Elasticsearch fallback mechanisms
Developed By

Jagriti
Full Stack .NET Developer | Angular 
