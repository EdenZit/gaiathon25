import React, { ComponentType, ForwardRefExoticComponent, RefAttributes } from 'react';
import { AccessibilityProps } from './types';
import { AccessibilityService } from './accessibility.service';

interface WithAccessibilityOptions {
  role?: string;
  announceOnMount?: boolean;
  mountMessage?: string;
  trapFocus?: boolean;
  validateAria?: boolean;
  validateContrast?: boolean;
}

export function withAccessibility<P extends AccessibilityProps>(
  WrappedComponent: ComponentType<P> | ForwardRefExoticComponent<P>,
  options: WithAccessibilityOptions = {}
) {
  const {
    role,
    announceOnMount,
    mountMessage,
    trapFocus,
    validateAria,
    validateContrast,
  } = options;

  const WithAccessibilityComponent = React.forwardRef<HTMLElement, P>((props, ref) => {
    const componentRef = React.useRef<HTMLElement | null>(null);

    React.useEffect(() => {
      if (announceOnMount && mountMessage) {
        AccessibilityService.announce(mountMessage);
      }
    }, []);

    React.useEffect(() => {
      if (trapFocus && componentRef.current) {
        AccessibilityService.manageFocus(componentRef.current, { trap: true });
      }
    }, [trapFocus]);

    React.useEffect(() => {
      if (validateAria) {
        const validation = AccessibilityService.validateAriaAttributes(role || '', {
          role,
          ...props,
        });
        if (!validation.valid) {
          console.warn('Accessibility validation failed:', validation.errors.join(', '));
        }
      }
    }, [validateAria, role, props]);

    React.useEffect(() => {
      if (validateContrast && componentRef.current) {
        const styles = window.getComputedStyle(componentRef.current);
        const validation = AccessibilityService.validateContrast(
          styles.color,
          styles.backgroundColor
        );
        if (!validation.AA) {
          console.warn(
            `Color contrast ratio ${validation.ratio.toFixed(2)} does not meet WCAG 2.1 AA standards`
          );
        }
      }
    }, [validateContrast]);

    const handleKeyDown = React.useCallback(
      (event: KeyboardEvent) => {
        if (event.altKey && event.key === '1' && role === 'main') {
          event.preventDefault();
          const main = document.querySelector('main');
          if (main) {
            main.focus();
            AccessibilityService.announce('Skipped to main content');
          }
        }
      },
      [role]
    );

    React.useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [handleKeyDown]);

    const skipLinkStyle: React.CSSProperties = {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: 0,
    };

    const setRefs = React.useCallback(
      (element: HTMLElement | null) => {
        componentRef.current = element;

        // Forward the ref
        if (ref) {
          if (typeof ref === 'function') {
            ref(element);
          } else {
            (ref as React.MutableRefObject<HTMLElement | null>).current = element;
          }
        }
      },
      [ref]
    );

    const combinedProps = {
      ...props,
      ref: setRefs,
      role: role || props.role,
    };

    return (
      <>
        {role === 'main' && (
          <a href="#main" className="sr-only" style={skipLinkStyle}>
            Skip to main content
          </a>
        )}
        <WrappedComponent {...(combinedProps as P)} />
      </>
    );
  });

  WithAccessibilityComponent.displayName = `WithAccessibility(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithAccessibilityComponent;
} 