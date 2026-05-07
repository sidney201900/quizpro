import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Quiz, Submission, AppSettings } from './types';
import { v4 as uuidv4 } from 'uuid';

interface QuizStore {
  quizzes: Quiz[];
  submissions: Submission[];
  settings: AppSettings;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addQuiz: (quiz: Omit<Quiz, 'id' | 'createdAt'>) => Quiz;
  deleteQuiz: (id: string) => void;
  addSubmission: (submission: Omit<Submission, 'id' | 'submittedAt'>) => void;
  getSubmissionsByQuizId: (quizId: string) => Submission[];
  updateSettings: (settings: AppSettings) => void;
  updateQuiz: (id: string, quiz: Partial<Omit<Quiz, 'id' | 'createdAt'>>) => void;
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
      addQuiz: (quizData) => {
        const newQuiz: Quiz = {
          ...quizData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ quizzes: [...state.quizzes, newQuiz] }));
        return newQuiz;
      },
      deleteQuiz: (id) => {
        set((state) => ({
          quizzes: state.quizzes.filter((q) => q.id !== id),
          submissions: state.submissions.filter((s) => s.quizId !== id),
        }));
      },
      addSubmission: (subData) => {
        const newSub: Submission = {
          ...subData,
          id: uuidv4(),
          submittedAt: new Date().toISOString(),
        };
        set((state) => ({ submissions: [...state.submissions, newSub] }));
      },
      getSubmissionsByQuizId: (quizId) => {
        return get().submissions.filter((s) => s.quizId === quizId);
      },
      updateSettings: (settings) => {
        set({ settings });
      },
      updateQuiz: (id, quiz) => {
        set((state) => ({
          quizzes: state.quizzes.map((q) => (q.id === id ? { ...q, ...quiz } : q)),
        }));
      },
    }),
    {
      name: 'quiz-storage',
    }
  )
);

