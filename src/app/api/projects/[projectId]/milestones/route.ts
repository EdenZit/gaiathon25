import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ProjectService, createMilestoneSchema } from '@/lib/project/project.service';

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = createMilestoneSchema.parse(body);

    const project = await ProjectService.addMilestone(
      params.projectId,
      token.id,
      validatedData
    );

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const milestoneIndex = parseInt(searchParams.get('index') || '-1');
    
    if (milestoneIndex < 0) {
      return new NextResponse('Milestone index is required', { status: 400 });
    }

    const body = await req.json();
    const project = await ProjectService.updateMilestone(
      params.projectId,
      token.id,
      milestoneIndex,
      body
    );

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 