export interface Word {
  id?: number;
  word: string;
  explanation: string;
  frequency: number;
  exact_frequency?: number | null;
  min_frequency?: number;
  tags?: string[];
  example?: string; // Some in the prompt might not have examples yet, but I'll keep the field
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  wordCount: number;
  learnedCount: number;
  color: string;
}

export interface UserProgress {
  wordId: string;
  status: 'new' | 'learning' | 'mastered';
  lastReview: number;
  level: number;
}
