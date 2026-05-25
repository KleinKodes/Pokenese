import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  AdminUser,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  DailyChallenge,
  SubmitGuessRequest,
  SubmitGuessResponse,
} from '../types/api';
import type { EtymologyEntry } from '../types/pokemon';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  async getDailyChallenge(date?: string): Promise<DailyChallenge> {
    const params = date ? { date } : {};
    const response = await this.client.get<DailyChallenge>('/daily', { params });
    return response.data;
  }

  async submitGuess(data: SubmitGuessRequest): Promise<SubmitGuessResponse> {
    const response = await this.client.post<SubmitGuessResponse>('/guess', data);
    return response.data;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  async adminListUsers(): Promise<AdminUser[]> {
    return this.get('/api/v1/admin/users');
  }

  async adminCreateUser(data: { email: string; username: string; password: string; is_admin: boolean }): Promise<AdminUser> {
    return this.post('/api/v1/admin/users', data);
  }

  async adminSetRole(userId: string, is_admin: boolean): Promise<AdminUser> {
    return this.patch(`/api/v1/admin/users/${userId}/role`, { is_admin });
  }

  async adminDeleteUser(userId: string): Promise<void> {
    return this.delete(`/api/v1/admin/users/${userId}`);
  }

  async adminGetEtymologyOverride(pokemonId: number): Promise<{ etymology: EtymologyEntry[] } | null> {
    try {
      return await this.get(`/api/v1/admin/etymology/${pokemonId}`);
    } catch {
      return null;
    }
  }

  async adminSaveEtymologyOverride(pokemonId: number, etymology: EtymologyEntry[]): Promise<void> {
    return this.put(`/api/v1/admin/etymology/${pokemonId}`, { etymology });
  }

  async adminDeleteEtymologyOverride(pokemonId: number): Promise<void> {
    return this.delete(`/api/v1/admin/etymology/${pokemonId}`);
  }

  async getEtymologyOverrides(): Promise<Record<string, EtymologyEntry[]>> {
    return this.get('/api/v1/pokemon/etymology-overrides');
  }

  exportEtymologyOverridesUrl(): string {
    return `${BASE_URL}/api/v1/admin/etymology/export`;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
