import { RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement } from 'react';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): Promise<R>;
    }
  }
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  state?: Record<string, unknown>;
}

declare module '@test/utils/test-utils' {
  export function render(
    ui: ReactElement,
    options?: CustomRenderOptions
  ): RenderResult & { rerender: (ui: ReactElement) => void };

  export function generateMockTeam(overrides?: Record<string, unknown>): {
    _id: string;
    name: string;
    description?: string;
    members: Array<{
      user: string;
      role: string;
      status: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
  };

  export function generateMockMember(overrides?: Record<string, unknown>): {
    _id: string;
    user: string;
    team: string;
    role: string;
    status: string;
    joinedAt: Date;
    activities: Array<{
      type: string;
      timestamp: Date;
      details: Record<string, unknown>;
    }>;
  };
} 