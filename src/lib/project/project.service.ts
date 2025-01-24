import { z } from 'zod';
import { Project, ProjectModel, ProjectMilestone, ProjectEvent } from '@/models/project.model';
import { TeamService } from '@/lib/team/team.service';

// Validation schemas
export const createProjectSchema = z.object({
  title: z.string()
    .min(3, 'Project title must be at least 3 characters')
    .max(100, 'Project title must be at most 100 characters'),
  description: z.string().max(1000).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  settings: z.object({
    visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PRIVATE'),
    allowComments: z.boolean().default(true),
    requireApproval: z.boolean().default(true),
    autoReminders: z.boolean().default(true)
  }).optional(),
  tags: z.array(z.string()).optional()
});

export const updateProjectSchema = createProjectSchema.partial();

export const createMilestoneSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  dueDate: z.coerce.date(),
  assignees: z.array(z.string()),
  tasks: z.array(z.object({
    title: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    assignee: z.string().optional(),
    dueDate: z.coerce.date().optional()
  })).optional()
});

export const createEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  type: z.enum(['MEETING', 'DEADLINE', 'REVIEW', 'OTHER']),
  location: z.string().optional(),
  attendees: z.array(z.string())
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;

export class ProjectService {
  static async createProject(
    teamId: string,
    userId: string,
    data: CreateProjectInput
  ): Promise<Project> {
    // Verify team exists and user is a leader
    const team = await TeamService.getTeam(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const isLeader = team.members.some(m => 
      m.user.toString() === userId && 
      m.status === 'ACTIVE' && 
      m.role === 'LEADER'
    );

    if (!isLeader) {
      throw new Error('Only team leaders can create projects');
    }

    const project = new ProjectModel({
      ...data,
      team: teamId,
      status: 'PLANNING'
    });

    await project.save();
    return project;
  }

  static async getProject(projectId: string): Promise<Project | null> {
    return ProjectModel.findById(projectId)
      .populate('team')
      .populate('milestones.assignees', 'name email')
      .populate('events.attendees', 'name email');
  }

  static async getTeamProjects(
    teamId: string,
    options: {
      status?: Project['status'];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ projects: Project[]; total: number }> {
    const { status, limit = 10, offset = 0 } = options;

    const filter: Record<string, any> = { team: teamId };
    if (status) {
      filter.status = status;
    }

    const [projects, total] = await Promise.all([
      ProjectModel.find(filter)
        .sort({ startDate: 1 })
        .skip(offset)
        .limit(limit)
        .populate('team')
        .populate('milestones.assignees', 'name email')
        .populate('events.attendees', 'name email'),
      ProjectModel.countDocuments(filter)
    ]);

    return { projects, total };
  }

  static async updateProject(
    projectId: string,
    userId: string,
    data: UpdateProjectInput
  ): Promise<Project> {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const team = await TeamService.getTeam(project.team.toString());
    if (!team) {
      throw new Error('Team not found');
    }

    const isLeader = team.members.some(m => 
      m.user.toString() === userId && 
      m.status === 'ACTIVE' && 
      m.role === 'LEADER'
    );

    if (!isLeader) {
      throw new Error('Only team leaders can update projects');
    }

    Object.assign(project, data);
    await project.save();
    return project;
  }

  static async addMilestone(
    projectId: string,
    userId: string,
    data: CreateMilestoneInput
  ): Promise<Project> {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const team = await TeamService.getTeam(project.team.toString());
    if (!team) {
      throw new Error('Team not found');
    }

    const isLeader = team.members.some(m => 
      m.user.toString() === userId && 
      m.status === 'ACTIVE' && 
      m.role === 'LEADER'
    );

    if (!isLeader) {
      throw new Error('Only team leaders can add milestones');
    }

    return project.addMilestone(data);
  }

  static async updateMilestone(
    projectId: string,
    userId: string,
    milestoneIndex: number,
    updates: Partial<ProjectMilestone>
  ): Promise<Project> {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const team = await TeamService.getTeam(project.team.toString());
    if (!team) {
      throw new Error('Team not found');
    }

    const isTeamMember = team.members.some(m => 
      m.user.toString() === userId && 
      m.status === 'ACTIVE'
    );

    if (!isTeamMember) {
      throw new Error('Only team members can update milestones');
    }

    return project.updateMilestone(milestoneIndex, updates);
  }

  static async addEvent(
    projectId: string,
    userId: string,
    data: CreateEventInput
  ): Promise<Project> {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const team = await TeamService.getTeam(project.team.toString());
    if (!team) {
      throw new Error('Team not found');
    }

    const isTeamMember = team.members.some(m => 
      m.user.toString() === userId && 
      m.status === 'ACTIVE'
    );

    if (!isTeamMember) {
      throw new Error('Only team members can add events');
    }

    return project.addEvent(data);
  }

  static async updateEvent(
    projectId: string,
    userId: string,
    eventIndex: number,
    updates: Partial<ProjectEvent>
  ): Promise<Project> {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const team = await TeamService.getTeam(project.team.toString());
    if (!team) {
      throw new Error('Team not found');
    }

    const isTeamMember = team.members.some(m => 
      m.user.toString() === userId && 
      m.status === 'ACTIVE'
    );

    if (!isTeamMember) {
      throw new Error('Only team members can update events');
    }

    return project.updateEvent(eventIndex, updates);
  }

  static async getProjectTimeline(
    projectId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    milestones: ProjectMilestone[];
    events: ProjectEvent[];
  }> {
    const project = await ProjectModel.findById(projectId)
      .populate('milestones.assignees', 'name email')
      .populate('events.attendees', 'name email');

    if (!project) {
      throw new Error('Project not found');
    }

    const team = await TeamService.getTeam(project.team.toString());
    if (!team) {
      throw new Error('Team not found');
    }

    const isTeamMember = team.members.some(m => 
      m.user.toString() === userId && 
      m.status === 'ACTIVE'
    );

    if (!isTeamMember) {
      throw new Error('Only team members can view project timeline');
    }

    let milestones = project.milestones;
    let events = project.events;

    if (startDate && endDate) {
      milestones = milestones.filter(m => 
        m.dueDate >= startDate && m.dueDate <= endDate
      );
      events = events.filter(e => 
        (e.startDate >= startDate && e.startDate <= endDate) ||
        (e.endDate >= startDate && e.endDate <= endDate)
      );
    }

    return { milestones, events };
  }
} 