import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(express.json());

// --- API ROUTES ---
app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

app.get('/api/quizzes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await prisma.quiz.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id }
        ]
      },
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

app.post('/api/quizzes', async (req, res) => {
  try {
    const { title, description, slug, questions } = req.body;
    const quiz = await prisma.quiz.create({
      data: { title, description, slug, questions },
    });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

app.put('/api/quizzes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, slug, questions } = req.body;
    const quiz = await prisma.quiz.update({
      where: { id },
      data: { title, description, slug, questions },
    });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

app.delete('/api/quizzes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.quiz.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany();
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

app.post('/api/submissions', async (req, res) => {
  try {
    const { quizId, studentInfo, answers } = req.body;
    const submission = await prisma.submission.create({
      data: { quizId, studentInfo, answers },
    });
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 'global' } });
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'global',
          schools: [],
          shifts: ['Manhã', 'Tarde', 'Noite', 'Integral'],
          grades: [],
          classes: [],
          customFields: [],
        }
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const data = req.body;
    delete data.id;
    const settings = await prisma.settings.upsert({
      where: { id: 'global' },
      update: data,
      create: { id: 'global', ...data },
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// --- SERVE FRONTEND ---
// Serve static files from the React app
// We go up one level because server.js is in dist-server/
app.use(express.static(path.join(__dirname, '..', 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Unified server running on port ${port}`);
});
