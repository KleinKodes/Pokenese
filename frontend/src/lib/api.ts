import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  DailyChallenge,
  SubmitGuessRequest,
  SubmitGuessResponse,
} from '../types/api';

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
}

export const apiClient = new ApiClient();
export default apiClient;
