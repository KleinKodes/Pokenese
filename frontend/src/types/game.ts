export interface UserSettings {
  show_pinyin: boolean;
  show_ipa: boolean;
  extreme_mode: boolean;
  auto_play_audio: boolean;
  theme: 'dark' | 'light';
  show_traditional: boolean;
}

export interface ChallengeResult {
  guesses: string[];
  score: number;
  hints_used: number;
  completed_at: string;
}

export interface LocalState {
  version: number;
  glossary: number[];
  glossary_seen_count: Record<number, number>;
  daily: {
    [date: string]: {
      challenge_1?: ChallengeResult;
      challenge_2?: ChallengeResult;
      challenge_3?: ChallengeResult;
    };
  };
  challenge: {
    seen_ids: number[];
    total_score: number;
    is_active: boolean;
    run_number: number;
  };
  settings: UserSettings;
}

export interface GameState {
  pokemon: import('./pokemon').PokemonType | null;
  guesses: string[];
  hints_revealed: number;
  is_complete: boolean;
  is_correct: boolean;
  score: number | null;
}

export type GameMode = 'daily' | 'challenge';
