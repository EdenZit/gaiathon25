import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { updateProfile, getProfileActivity } from '@/lib/profile/profile.service';
import { profileUpdateSchema } from '@/lib/profile/profile.service';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const activities = await getProfileActivity(token.id);
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching profile activities:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = profileUpdateSchema.parse(body);

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip');
    const userAgent = req.headers.get('user-agent') || undefined;

    const updatedProfile = await updateProfile(
      token.id,
      validatedData,
      ipAddress || undefined,
      userAgent
    );

    if (!updatedProfile) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json(updatedProfile);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 