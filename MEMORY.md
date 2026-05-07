# Development Memory - Quiz Master Pro

## Current State
The project is a **Unified Fullstack Monolith** optimized for ARM64/Docker Swarm.
- [x] Admin Authentication (Synced with PostgreSQL).
- [x] CRUD for Quizzes & Questions (Synced with PostgreSQL).
- [x] Dynamic Identification Fields (Customizable by Admin).
- [x] Results Dashboard & Charts (Recharts).
- [x] Multi-format Export (PDF via html2canvas/jsPDF, Excel via xlsx).
- [x] **Unified Architecture**: Express server serves both API and React Frontend (`dist`).
- [x] **Real Persistence**: Persistent Docker Volume for uploads and PostgreSQL data.
- [x] **SSL/HTTPS**: Automated via Traefik with `leresolver`.

## Recent Changes (May 2026)
- **Fullstack Unification**: Merged Frontend and Backend into a single container for easier deployment and port management (Port 3005).
- **File Upload System**: Implemented `/api/upload` using Multer. Logos are now saved on disk and persisted via Docker Volumes.
- **SSL Fix**: Corrected Traefik labels to use `leresolver` instead of `letsencrypt` to match server configuration.
- **UI/Branding**: Changed project name to **Quiz Master**, added custom favicon and SEO meta tags.
- **Deployment Stabilization**: Optimized Dockerfile for node:20-slim (Debian) to ensure Prisma compatibility on ARM64.

## Pending Tasks / Next Steps
1. **Gemini AI Integration**: Implement automatic quiz generation or analysis using `@google/genai`.
2. **Delete Submissions**: Add a button to clear all results of a quiz without deleting the quiz structure.
3. **Advanced Reporting**: Add filtering by date range in the results dashboard.

## Technical Architecture
- **Port**: 3005 (Internal/External via Traefik).
- **Network**: `network_public` (External).
- **Volumes**: 
  - `quiz_pgdata`: Database persistence.
  - `quiz_uploads`: Uploaded images/logos persistence.
- **Resolver**: `leresolver` (ACME Let's Encrypt).
