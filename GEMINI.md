# Quiz Master Pro - Core Guidelines & Skills
// Teste de escrita do assistente

## Project Vision
A robust, modern Quiz management system designed for educational institutions. It allows administrators to create diverse quizzes (multiple choice, survey, open-ended), track student submissions, analyze results with charts, and export data in various formats.

## Tech Stack
- **Frontend**: React 19 (Vite)
- **Backend**: Node.js (Express)
- **Database**: PostgreSQL (via Prisma)
- **Styling**: TailwindCSS (v4)
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion)
- **State Management**: Zustand (Local sync + API fetch)
- **Charts**: Recharts
- **Data Export**: xlsx (Excel), jspdf & html2canvas (PDF)
- **AI**: Google Gemini SDK (`@google/genai`)

## Core Rules & Business Logic
1. **State Persistence**: Data is stored in **PostgreSQL**. The frontend syncs with the Backend API on load and during updates.
2. **Identification**: Students identify themselves via custom fields.
3. **Authentication**: Admin login is verified against the database.
4. **Links**: Quizzes can have custom slugs or use their UUID for the respondent link.
5. **Data Export**: Support for Excel (raw data) and PDF (visual reports).

## Key Skills (Development Patterns)

### Adding a New Question Type
1. Update `QuestionType` in `src/types.ts`.
2. Update the `Question` interface if needed.
3. Add the UI for the new type in `src/pages/Admin/CreateQuiz.tsx` (the `questions.map` loop and the "Add" buttons).
4. Implement the respondent view in `src/pages/Student/TakeQuiz.tsx`.
5. Update results display in `src/pages/Admin/QuizResults.tsx`.

### Managing State (Zustand)
- Actions are defined in `src/store.ts`.
- Use `useQuizStore((state) => state.X)` to access state or actions.
- Always ensure new objects (like quizzes or submissions) are given a UUID using `uuidv4()`.

### Custom Identification Fields
- Admin can define fields like "Mother's Name", "Registration Number", etc.
- These are stored in `settings.customFields`.
- Respondent data for these fields is stored in `submission.studentInfo` using the field `id` as the key.

### Exporting Reports
- Excel uses `xlsx` to convert JSON data to sheets.
- PDF uses `html2canvas` to capture the `reportRef` and `jspdf` to generate the document.
- The PDF export handles multi-page results by splitting the canvas image.

### Docker & Portainer Deployment (Swarm + Traefik)
1. **Build Automático**: O GitHub Actions constrói a imagem `ghcr.io/sidney201900/quizpro:latest` automaticamente a cada push.
2. **Sem Configuração Extra**: O GHCR é gratuito e já está integrado ao seu GitHub.
3. **Portainer**: 
   - Vá em **Stacks** -> **quizpro**.
   - No **Editor**, clique em **Update the stack** e marque **Re-pull images**.
   - O domínio configurado é `quiz.microtecinformaticacurso.com.br`.
   - Certifique-se de que a rede `network_public` existe no seu Swarm.

## Technical Deployment Notes
- **Monolito Unificado**: O servidor Express (porta 3005) serve a API e o Frontend compilado em `/dist`.
- **SSL Resolver**: O Traefik utiliza o resolver `leresolver`. **Não use** `letsencrypt`.
- **Volumes**: O container mapeia `/app/uploads` para persistência de logos e imagens.
