export type QuestionType = 'multiple_choice' | 'open_ended' | 'survey';

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: Option[];
  correctOptionId?: string; // Only for multiple_choice
}

export interface Quiz {
  id: string;
  slug?: string;
  title: string;
  description: string;
  createdAt: string;
  questions: Question[];
}

export interface AnswerItem {
  questionId: string;
  answerText?: string; // For open ended
  selectedOptionId?: string; // For multiple choice
}

export type StudentInfo = Record<string, any>;

export interface Submission {
  id: string;
  quizId: string;
  studentInfo: StudentInfo;
  answers: AnswerItem[];
  submittedAt: string;
  score?: number; // Calculated later if needed
}

export type FieldType = 'text' | 'date' | 'select' | 'checkbox' | 'radio';

export interface CustomField {
  id: string;
  name: string;
  type: FieldType;
  options?: string[]; // Commma separated or array of choices
  required: boolean;
}

export interface AppSettings {
  logoUrl: string;
  schools: string[];
  shifts: string[];
  grades: string[];
  classes: string[];
  adminUser?: string;
  adminPass?: string;
  customFields?: CustomField[];
}

