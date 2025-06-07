import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import type { RateLimitResponse } from '@/types/api';

// More generous limits for development
const REQUESTS_PER_HOUR = parseInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR || '100'); // Increased from 10
const GLOBAL_REQUESTS_PER_HOUR = parseInt(process.env.RATE_LIMIT_GLOBAL_PER_HOUR || '1000'); // Increased from 100

// Add development mode check
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export async function rateLimit(request: NextRequest): Promise<RateLimitResponse> {
  try {
    // Skip rate limiting in development mode
    if (IS_DEVELOPMENT) {
      console.log('⚠️ Development mode: Skipping rate limiting');
      return {
        allowed: true,
        info: {
          limit: REQUESTS_PER_HOUR,
          remaining: REQUESTS_PER_HOUR - 1,
          resetTime: Date.now() + 60 * 60 * 1000
        }
      };
    }

    // Get user identifier (IP address for MVP, could be user ID later)
    const userIdentifier = getUserIdentifier(request);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check individual user rate limit
    const userLimitResult = await checkUserRateLimit(userIdentifier, now, oneHourAgo);
    if (!userLimitResult.allowed) {
      return userLimitResult;
    }

    // Check global rate limit
    const globalLimitResult = await checkGlobalRateLimit(now, oneHourAgo);
    if (!globalLimitResult.allowed) {
      return globalLimitResult;
    }

    // Record the request
    await recordRequest(userIdentifier, now);

    return {
      allowed: true,
      info: {
        limit: REQUESTS_PER_HOUR,
        remaining: Math.max(0, REQUESTS_PER_HOUR - userLimitResult.info.remaining - 1),
        resetTime: now.getTime() + 60 * 60 * 1000
      }
    };

  } catch (error) {
    console.error('Rate limiting error:', error);
    // On error, allow the request but log the issue
    return {
      allowed: true,
      info: {
        limit: REQUESTS_PER_HOUR,
        remaining: REQUESTS_PER_HOUR - 1,
        resetTime: Date.now() + 60 * 60 * 1000
      }
    };
  }
}

async function checkUserRateLimit(
  userIdentifier: string, 
  now: Date, 
  oneHourAgo: Date
): Promise<RateLimitResponse> {
  // Clean up old rate limit records
  await prisma.rateLimit.deleteMany({
    where: {
      windowEnd: {
        lt: oneHourAgo
      }
    }
  });

  // Count requests in the current window
  const requestCount = await prisma.rateLimit.count({
    where: {
      userId: userIdentifier,
      windowStart: {
        gte: oneHourAgo
      }
    }
  });

  const remaining = Math.max(0, REQUESTS_PER_HOUR - requestCount);
  const resetTime = now.getTime() + 60 * 60 * 1000;

  if (requestCount >= REQUESTS_PER_HOUR) {
    return {
      allowed: false,
      info: {
        limit: REQUESTS_PER_HOUR,
        remaining: 0,
        resetTime,
        retryAfter: 60 * 60 // 1 hour in seconds
      }
    };
  }

  return {
    allowed: true,
    info: {
      limit: REQUESTS_PER_HOUR,
      remaining,
      resetTime
    }
  };
}

async function checkGlobalRateLimit(now: Date, oneHourAgo: Date): Promise<RateLimitResponse> {
  const globalRequestCount = await prisma.rateLimit.count({
    where: {
      windowStart: {
        gte: oneHourAgo
      }
    }
  });

  if (globalRequestCount >= GLOBAL_REQUESTS_PER_HOUR) {
    return {
      allowed: false,
      info: {
        limit: GLOBAL_REQUESTS_PER_HOUR,
        remaining: 0,
        resetTime: now.getTime() + 60 * 60 * 1000,
        retryAfter: 60 * 60 // 1 hour in seconds
      }
    };
  }

  return {
    allowed: true,
    info: {
      limit: GLOBAL_REQUESTS_PER_HOUR,
      remaining: Math.max(0, GLOBAL_REQUESTS_PER_HOUR - globalRequestCount),
      resetTime: now.getTime() + 60 * 60 * 1000
    }
  };
}

async function recordRequest(userIdentifier: string, now: Date): Promise<void> {
  const windowEnd = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

  await prisma.rateLimit.create({
    data: {
      userId: userIdentifier,
      requestCount: 1,
      windowStart: now,
      windowEnd
    }
  });
}

function getUserIdentifier(request: NextRequest): string {
  // Try to get real IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
}

// Utility function to get rate limit info for a user
export async function getRateLimitInfo(request: NextRequest) {
  const userIdentifier = getUserIdentifier(request);
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const requestCount = await prisma.rateLimit.count({
    where: {
      userId: userIdentifier,
      windowStart: {
        gte: oneHourAgo
      }
    }
  });

  return {
    limit: REQUESTS_PER_HOUR,
    remaining: Math.max(0, REQUESTS_PER_HOUR - requestCount),
    resetTime: now.getTime() + 60 * 60 * 1000
  };
} 