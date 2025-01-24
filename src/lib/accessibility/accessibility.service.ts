import { ACCESSIBILITY_CONFIG } from '../config/accessibility.config';
import { AccessibilityProps } from './types';

interface ContrastRatio {
  ratio: number;
  AA: boolean;
  AAA: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class AccessibilityService {
  // Color contrast validation
  static validateContrast(foreground?: string, background?: string): ContrastRatio {
    if (!foreground || !background) {
      return {
        ratio: 0,
        AA: false,
        AAA: false,
      };
    }

    // Convert colors to RGB values
    const getRGB = (color: string) => {
      const hex = color.replace('#', '');
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    };

    // Calculate relative luminance
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(val => {
        return val <= 0.03928
          ? val / 12.92
          : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const fg = getRGB(foreground);
    const bg = getRGB(background);

    const l1 = getLuminance(fg.r, fg.g, fg.b);
    const l2 = getLuminance(bg.r, bg.g, bg.b);

    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio,
      AA: ratio >= 4.5,
      AAA: ratio >= 7,
    };
  }

  // ARIA validation
  static validateAriaAttributes(role: string, attributes: Partial<AccessibilityProps>): ValidationResult {
    const errors: string[] = [];
    const requiredAttributes = new Set(['button', 'checkbox', 'combobox', 'listbox', 'radiogroup', 'slider', 'spinbutton', 'textbox']);

    if (requiredAttributes.has(role)) {
      if (!attributes['aria-label'] && !attributes['aria-labelledby']) {
        errors.push(`Role "${role}" requires either aria-label or aria-labelledby`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Focus management
  static manageFocus(element?: HTMLElement, options: { trap?: boolean } = {}): void {
    if (!element) return;

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (options.trap && focusableElements.length > 0) {
      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

      element.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          } else if (!e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      });
    }
  }

  // Screen reader announcements
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.classList.add('sr-only');
    document.body.appendChild(announcer);
    
    // Set the message in the next tick to ensure it's announced
    setTimeout(() => {
      announcer.textContent = message;
      setTimeout(() => {
        document.body.removeChild(announcer);
      }, 1000);
    }, 100);
  }

  // Heading structure validation
  static validateHeadingStructure(headings: string[]): ValidationResult {
    try {
      ACCESSIBILITY_CONFIG.schemas.headingStructure.parse(headings);
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid heading structure: Headings should not skip levels'],
      };
    }
  }

  // Alt text validation
  static validateAltText(alt: string): ValidationResult {
    try {
      ACCESSIBILITY_CONFIG.schemas.altText.parse(alt);
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [(error as Error).message],
      };
    }
  }
} 