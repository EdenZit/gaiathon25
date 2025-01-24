import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './auth.config';

interface RBACOptions {
  allowedRoles: string[];
}

export async function rbacMiddleware(
  request: NextRequest,
  options: RBACOptions
): Promise<NextResponse | undefined> {
  try {
    const session = await auth();
    
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      );
    }

    if (!session.user?.role || !options.allowedRoles.includes(session.user.role)) {
      return new NextResponse(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403 }
      );
    }

    // User is authenticated and authorized
    return NextResponse.next();
  } catch (error) {
    console.error('RBAC Middleware Error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export function withRBAC(allowedRoles: string[]) {
  return async function(request: NextRequest): Promise<NextResponse | undefined> {
    return rbacMiddleware(request, { allowedRoles });
  };
}

// Example usage in route handlers:
// export async function GET(req: NextRequest) {
//   const rbacCheck = await rbacMiddleware(req, { allowedRoles: ['ADMIN'] });
//   if (rbacCheck) return rbacCheck;
//   // Continue with the route handler
// } 