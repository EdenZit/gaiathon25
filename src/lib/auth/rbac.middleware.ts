import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export interface RBACOptions {
  allowedRoles: string[];
}

export async function rbacMiddleware(
  req: NextRequest,
  options: RBACOptions
): Promise<NextResponse | null> {
  try {
    const token = await getToken({ req });

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!options.allowedRoles.includes(token.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    return null;
  } catch (error) {
    console.error('RBAC Middleware Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Example usage in route handlers:
// export async function GET(req: NextRequest) {
//   const rbacCheck = await rbacMiddleware(req, { allowedRoles: ['ADMIN'] });
//   if (rbacCheck) return rbacCheck;
//   // Continue with the route handler
// } 