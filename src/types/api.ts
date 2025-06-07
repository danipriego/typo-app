// API Types
export interface APIError {
  message: string;
  code?: string;
  status?: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  cached?: boolean;
  requestId?: string;
}

// Rate Limiting Types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitResponse {
  allowed: boolean;
  info: RateLimitInfo;
} 