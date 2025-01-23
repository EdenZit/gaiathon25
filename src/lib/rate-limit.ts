import { LRUCache } from 'lru-cache';
import type { NextRequest } from 'next/server';

export interface RateLimitOptions {
  uniqueTokenPerInterval?: number;
  interval?: number;
}

export interface RateLimitResult {
  check: (
    req: NextRequest,
    limit: number,
    token: string
  ) => Promise<void>;
}

export function rateLimit(options?: RateLimitOptions): RateLimitResult {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: async (req: NextRequest, limit: number, token: string) => {
      const tokenCount = (tokenCache.get(token) as number[]) || [0];
      if (tokenCount[0] === 0) {
        tokenCache.set(token, tokenCount);
      }
      tokenCount[0] += 1;

      const currentUsage = tokenCount[0];
      if (currentUsage > limit) {
        throw new Error('Rate limit exceeded');
      }
    },
  };
} 