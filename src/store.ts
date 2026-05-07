import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Quiz, Submission, AppSettings } from './types';

const API_URL = '/api';

interface QuizStore {
  quizzes: Quiz[];
  submissions: Submission[];
  settings: AppSettings;
  isAuthenticated: boolean;
  isLoading: boolean;
  fetchInitialData: () => Promise<void>;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addQuiz: (quiz: Omit<Quiz, 'id' | 'createdAt'>) => Promise<Quiz | null>;
  deleteQuiz: (id: string) => Promise<void>;
  addSubmission: (submission: Omit<Submission, 'id' | 'submittedAt'>) => Promise<void>;
  getSubmissionsByQuizId: (quizId: string) => Submission[];
  updateSettings: (settings: AppSettings) => Promise<void>;
  updateQuiz: (id: string, quiz: Partial<Omit<Quiz, 'id' | 'createdAt'>>) => Promise<void>;
}

const defaultSettings: AppSettings = {
  logoUrl: '',
  schools: [],
  shifts: ['Manhã', 'Tarde', 'Noite', 'Integral'],
  grades: [],
  classes: [],
  adminUser: 'admin',
  adminPass: 'admin',
  customFields: [],
};

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      quizzes: [],
      submissions: [],
      settings: defaultSettings,
      isAuthenticated: false,
      isLoading: false,

      fetchInitialData: async () => {
        set({ isLoading: true });
        try {
          const [quizzesRes, submissionsRes, settingsRes] = await Promise.all([
            fetch(`${API_URL}/quizzes`),
            fetch(`${API_URL}/submissions`),
            fetch(`${API_URL}/settings`),
          ]);

          const quizzes = await quizzesRes.json();
          const submissions = await submissionsRes.json();
          const settings = await settingsRes.json();

          set({ quizzes, submissions, settings });
        } catch (error) {
          console.error('Failed to fetch initial data:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      login: (username, password) => {
        const settings = get().settings;
        const validUser = settings.adminUser || 'admin';
        const validPass = settings.adminPass || 'admin';

        if (username === validUser && password === validPass) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ isAuthenticated: false });
      },

      addQuiz: async (quizData) => {
        try {
          const res = await fetch(`${API_URL}/quizzes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quizData),
          });
          const newQuiz = await res.json();
          set((state) => ({ quizzes: [newQuiz, ...state.quizzes] }));
          return newQuiz;
        } catch (error) {
          console.error('Failed to add quiz:', error);
          return null;
        }
      },

      deleteQuiz: async (id) => {
        try {
          await fetch(`${API_URL}/quizzes/${id}`, { method: 'DELETE' });
          set((state) => ({
            quizzes: state.quizzes.filter((q) => q.id !== id),
            submissions: state.submissions.filter((s) => s.quizId !== id),
          }));
        } catch (error) {
          console.error('Failed to delete quiz:', error);
        }
      },

      addSubmission: async (subData) => {
        try {
          const res = await fetch(`${API_URL}/submissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subData),
          });
          const newSub = await res.json();
          set((state) => ({ submissions: [...state.submissions, newSub] }));
        } catch (error) {
          console.error('Failed to add submission:', error);
        }
      },

      getSubmissionsByQuizId: (quizId) => {
        return get().submissions.filter((s) => s.quizId === quizId);
      },

      updateSettings: async (settings) => {
        try {
          const res = await fetch(`${API_URL}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
          });
          const updatedSettings = await res.json();
          set({ settings: updatedSettings });
        } catch (error) {
          console.error('Failed to update settings:', error);
        }
      },

      updateQuiz: async (id, quiz) => {
        try {
          const res = await fetch(`${API_URL}/quizzes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quiz),
          });
          const updatedQuiz = await res.json();
          set((state) => ({
            quizzes: state.quizzes.map((q) => (q.id === id ? updatedQuiz : q)),
          }));
        } catch (error) {
          console.error('Failed to update quiz:', error);
        }
      },
    }),
    {
      name: 'quiz-auth-storage',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }), // Only persist auth state
    }
  )
);
