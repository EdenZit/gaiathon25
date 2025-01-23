import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rateLimit } from './lib/rate-limit';

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// Admin routes pattern
const ADMIN_ROUTES = /^\/[^/]+\/admin(?:\/.*)?$/;

// Middleware function
export async function middleware(request: NextRequest) {
  // Apply rate limiting
  try {
    await limiter.check(request, 30, 'CACHE_TOKEN');
  } catch {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  // Check for admin routes
  if (ADMIN_ROUTES.test(request.nextUrl.pathname)) {
    const token = await getToken({ req: request });
    
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (token.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Log admin access
    try {
      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                       request.headers.get('x-real-ip');
      const userAgent = request.headers.get('user-agent');
      
      // TODO: Implement admin access logging
      console.log(`Admin access: ${token.email} - ${request.nextUrl.pathname}`);
    } catch (error) {
      console.error('Error logging admin access:', error);
    }
  }

  // Security headers
  const response = NextResponse.next();
  
  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXTAUTH_URL || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests"
  );

  return response;
}

// Configure protected routes
export const config = {
  matcher: [
    '/api/:path*',
    '/(dashboard|admin)/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 