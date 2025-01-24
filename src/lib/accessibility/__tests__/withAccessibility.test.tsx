import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { withAccessibility } from '../withAccessibility';
import { AccessibilityService } from '../accessibility.service';
import { AccessibilityProps } from '../types';

// Mock AccessibilityService
jest.mock('../accessibility.service', () => ({
  AccessibilityService: {
    announce: jest.fn(),
    manageFocus: jest.fn(),
    validateAriaAttributes: jest.fn(),
    validateContrast: jest.fn(),
  },
}));

describe('withAccessibility HOC', () => {
  // Test component
  const TestComponent = React.forwardRef<HTMLDivElement, AccessibilityProps>(
    (props, ref) => (
      <div ref={ref} {...props}>
        Test Component
      </div>
    )
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass accessibility props to wrapped component', () => {
    const AccessibleComponent = withAccessibility(TestComponent, {
      role: 'button',
    });

    render(
      <AccessibleComponent
        aria-label="Test button"
        aria-describedby="test-desc"
      />
    );

    const component = screen.getByRole('button');
    expect(component).toHaveAttribute('aria-label', 'Test button');
    expect(component).toHaveAttribute('aria-describedby', 'test-desc');
  });

  it('should announce on mount when configured', () => {
    const AccessibleComponent = withAccessibility(TestComponent, {
      announceOnMount: true,
      mountMessage: 'Component mounted',
    });

    render(<AccessibleComponent />);

    expect(AccessibilityService.announce).toHaveBeenCalledWith('Component mounted');
  });

  it('should manage focus when trapFocus is enabled', () => {
    const AccessibleComponent = withAccessibility(TestComponent, {
      trapFocus: true,
    });

    render(<AccessibleComponent />);

    expect(AccessibilityService.manageFocus).toHaveBeenCalled();
  });

  it('should validate ARIA attributes when configured', () => {
    const mockValidation = { valid: true, errors: [] };
    (AccessibilityService.validateAriaAttributes as jest.Mock).mockReturnValue(mockValidation);

    const AccessibleComponent = withAccessibility(TestComponent, {
      validateAria: true,
      role: 'button',
    });

    render(
      <AccessibleComponent
        aria-label="Test button"
        aria-describedby="test-desc"
      />
    );

    expect(AccessibilityService.validateAriaAttributes).toHaveBeenCalledWith(
      'button',
      expect.objectContaining({
        'aria-label': 'Test button',
        'aria-describedby': 'test-desc',
        role: 'button',
      })
    );
  });

  it('should validate color contrast when configured', () => {
    const mockContrast = { ratio: 4.5, AA: true, AAA: false };
    (AccessibilityService.validateContrast as jest.Mock).mockReturnValue(mockContrast);

    const AccessibleComponent = withAccessibility(TestComponent, {
      validateContrast: true,
    });

    render(<AccessibleComponent />);

    expect(AccessibilityService.validateContrast).toHaveBeenCalled();
  });

  it('should render skip link for main content', () => {
    const AccessibleComponent = withAccessibility(TestComponent, {
      role: 'main',
    });

    render(<AccessibleComponent />);

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveClass('sr-only');
  });

  it('should handle keyboard navigation', () => {
    const mockAnnounce = AccessibilityService.announce as jest.Mock;
    const AccessibleComponent = withAccessibility(TestComponent, {
      role: 'main',
    });

    render(<AccessibleComponent />);

    // Create a main element for the skip link to focus
    const main = document.createElement('main');
    document.body.appendChild(main);

    // Simulate Alt+1 keypress
    fireEvent.keyDown(window, {
      key: '1',
      altKey: true,
    });

    expect(mockAnnounce).toHaveBeenCalledWith('Skipped to main content');

    // Cleanup
    document.body.removeChild(main);
  });

  it('should handle focus visibility', () => {
    const AccessibleComponent = withAccessibility(TestComponent);

    render(<AccessibleComponent className="focus:outline-none" />);

    const component = screen.getByText('Test Component');
    expect(component).toHaveClass('focus:outline-none');
  });

  it('should cleanup event listeners on unmount', () => {
    const AccessibleComponent = withAccessibility(TestComponent);
    const { unmount } = render(<AccessibleComponent />);

    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
  });
}); 