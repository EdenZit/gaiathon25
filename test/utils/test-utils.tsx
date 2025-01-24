import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: {
    user: {
      id: string;
      name: string;
      email: string;
    };
    expires: string;
  };
  initialQueryState?: Record<string, any>;
}

function customRender(
  ui: React.ReactElement,
  {
    session = {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    initialQueryState = {},
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

  if (Object.keys(initialQueryState).length > 0) {
    Object.entries(initialQueryState).forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SessionProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Test data generators
export function generateMockTeam(overrides = {}) {
  return {
    _id: 'team-1',
    name: 'Test Team',
    description: 'A test team',
    members: [
      {
        user: 'user-1',
        role: 'LEADER',
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
    ],
    ...overrides,
  };
}

export function generateMockMember(overrides = {}) {
  return {
    _id: 'member-1',
    user: 'user-1',
    team: 'team-1',
    role: 'LEADER',
    status: 'ACTIVE',
    activities: [
      {
        type: 'PROJECT_CONTRIBUTION',
        timestamp: new Date(),
        details: {
          action: 'Code commit',
          impact: 8,
        },
      },
    ],
    metrics: [
      {
        type: 'PRODUCTIVITY',
        value: 85,
        period: 'WEEKLY',
        timestamp: new Date(),
      },
    ],
    ...overrides,
  };
}

export function generateMockProject(overrides = {}) {
  return {
    _id: 'project-1',
    title: 'Test Project',
    team: 'team-1',
    status: 'ACTIVE',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    milestones: [
      {
        title: 'Milestone 1',
        status: 'IN_PROGRESS',
        progress: 60,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignees: ['user-1'],
        tasks: [
          {
            title: 'Task 1',
            completed: false,
            assignee: 'user-1',
          },
        ],
      },
    ],
    ...overrides,
  };
}

// Test query helpers
export function createQueryKey(base: string, params: Record<string, any> = {}) {
  return [base, params];
}

export function createMockQueryData<T>(
  key: string | (string | Record<string, any>)[],
  data: T
) {
  return {
    [Array.isArray(key) ? key.join('-') : key]: data,
  };
}

// Test event helpers
export function createMockEvent() {
  return {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  };
}

export function createMockFormEvent(data: Record<string, any> = {}) {
  return {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: {
      elements: Object.entries(data).reduce((acc, [key, value]) => {
        acc[key] = { value };
        return acc;
      }, {} as Record<string, { value: any }>),
    },
  };
}

// Test response helpers
export function createMockResponse<T>(data: T, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

export function createMockErrorResponse(message: string, status = 400) {
  return {
    ok: false,
    status,
    json: async () => ({ message }),
  };
} 