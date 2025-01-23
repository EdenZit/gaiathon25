import { NextRequest, NextResponse } from 'next/server';
import { rbacMiddleware } from '@/lib/auth/rbac.middleware';
import { UserModel } from '@/models/user.model';

export async function GET(req: NextRequest) {
  // Check if user has admin role
  const rbacCheck = await rbacMiddleware(req, { allowedRoles: ['ADMIN'] });
  if (rbacCheck) return rbacCheck;

  try {
    const users = await UserModel.find({}, '-password').sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Check if user has admin role
  const rbacCheck = await rbacMiddleware(req, { allowedRoles: ['ADMIN'] });
  if (rbacCheck) return rbacCheck;

  try {
    const body = await req.json();
    const user = await UserModel.create(body);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 