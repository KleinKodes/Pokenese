export interface ApiUser {
  id: string;
  email: string;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: ApiUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface DailyChallenge {
  date: string;
  challenge_1_pokemon_id: number;
  challenge_2_pokemon_id: number;
  challenge_3_pokemon_id: number;
}

export interface SubmitGuessRequest {
  pokemon_id: number;
  guess: string;
  challenge_date?: string;
  challenge_number?: number;
}

export interface SubmitGuessResponse {
  correct: boolean;
  score: number;
  hints_revealed: number;
  message?: string;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  date?: string;
}
