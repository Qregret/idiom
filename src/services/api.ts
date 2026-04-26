export interface Idiom {
  word: string;
  explanation: string;
  frequency: number;
  reliability_level: string;
  priority_score?: number;
  remembered?: boolean;
  favorite?: boolean;
}

export interface UserStats {
  totalWords: number;
  coreWords?: number;
  lowFreqWords?: number;
  coreLearned?: number;
  lowFreqLearned?: number;
  learnedCount: number;
  rememberedCount: number;
  forgottenCount: number;
  favoriteCount: number;
  remainingCount: number;
  activity?: { date: string, count: number }[];
  consecutiveDays?: number;
}

export interface MeResponse {
  ip: string;
  dailyTarget: number;
  stats: UserStats;
}

export const api = {
  getMe: async (): Promise<MeResponse> => {
    const res = await fetch('/api/me');
    return res.json();
  },
  
  updateSettings: async (dailyTarget: number) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyTarget }),
    });
    return res.json();
  },
  
  getSession: async (limit: number): Promise<{ words: Idiom[] }> => {
    const res = await fetch(`/api/session?limit=${limit}`);
    return res.json();
  },

  getReviewSession: async (): Promise<{ words: Idiom[] }> => {
    const res = await fetch('/api/review-session');
    return res.json();
  },
  
  submitAnswer: async (word: string, remembered: boolean) => {
    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, remembered }),
    });
    return res.json();
  },
  
  toggleFavorite: async (word: string) => {
    const res = await fetch('/api/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    });
    return res.json();
  },
  
  resetProgress: async () => {
    const res = await fetch('/api/reset', { method: 'POST' });
    return res.json();
  },
  
  getWords: async (type: 'all' | 'learned' | 'remaining' | 'difficult' | 'favorites' | 'core', limit: number = 500, offset: number = 0, category?: string): Promise<Idiom[]> => {
    try {
      const url = new URL(!window.location.host.includes('localhost') ? `https://${window.location.host}/api/words` : 'http://localhost:3000/api/words');
      url.searchParams.append('type', type);
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('offset', offset.toString());
      if (category) {
        url.searchParams.append('category', category);
      }
      const res = await fetch(url.toString());
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Failed to fetch words:", e);
      return [];
    }
  }
};
