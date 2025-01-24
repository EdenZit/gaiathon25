import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ProjectService, updateProjectSchema } from '@/lib/project/project.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const project = await ProjectService.getProject(params.projectId);
    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

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

    const body = await req.json();
    const validatedData = updateProjectSchema.parse(body);

    const project = await ProjectService.updateProject(
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const token = await getToken({ req });
    if (!token?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const project = await ProjectService.getProject(params.projectId);
    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    await project.deleteOne();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 