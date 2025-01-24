import { AccessibilityService } from '../accessibility.service';
import { ACCESSIBILITY_CONFIG } from '../../config/accessibility.config';

describe('AccessibilityService', () => {
  describe('validateContrast', () => {
    it('should validate color contrast correctly', () => {
      const result = AccessibilityService.validateContrast('#000000', '#FFFFFF');
      expect(result.ratio).toBeCloseTo(21, 0);
      expect(result.AA).toBe(true);
      expect(result.AAA).toBe(true);
    });

    it('should fail for insufficient contrast', () => {
      const result = AccessibilityService.validateContrast('#777777', '#888888');
      expect(result.AA).toBe(false);
      expect(result.AAA).toBe(false);
    });
  });

  describe('validateAriaAttributes', () => {
    it('should validate required ARIA attributes for buttons', () => {
      const result = AccessibilityService.validateAriaAttributes('button', {
        'aria-label': 'Test Button',
        'aria-expanded': 'false',
        'aria-pressed': 'false',
        'aria-controls': 'test-id',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing required ARIA attributes', () => {
      const result = AccessibilityService.validateAriaAttributes('button', {
        'aria-label': 'Test Button',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required ARIA attribute: aria-expanded');
    });
  });

  describe('validateHeadingStructure', () => {
    it('should validate correct heading structure', () => {
      const result = AccessibilityService.validateHeadingStructure(['h1', 'h2', 'h2', 'h3']);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for skipped heading levels', () => {
      const result = AccessibilityService.validateHeadingStructure(['h1', 'h3']);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid heading structure: Headings should not skip levels');
    });
  });

  describe('validateAltText', () => {
    it('should validate correct alt text', () => {
      const result = AccessibilityService.validateAltText('A descriptive alt text');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for empty alt text', () => {
      const result = AccessibilityService.validateAltText('');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('must not be empty');
    });

    it('should fail for alt text starting with "image of"', () => {
      const result = AccessibilityService.validateAltText('image of a cat');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('should not begin with "image of"');
    });
  });

  describe('manageFocus', () => {
    let container: HTMLDivElement;
    let button1: HTMLButtonElement;
    let button2: HTMLButtonElement;

    beforeEach(() => {
      container = document.createElement('div');
      button1 = document.createElement('button');
      button2 = document.createElement('button');
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should set focus to first focusable element', () => {
      AccessibilityService.manageFocus(container);
      expect(document.activeElement).toBe(button1);
    });

    it('should trap focus when enabled', () => {
      AccessibilityService.manageFocus(container, { trap: true });
      
      // Simulate Tab key press on last element
      button2.focus();
      button2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(document.activeElement).toBe(button1);

      // Simulate Shift+Tab key press on first element
      button1.focus();
      button1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }));
      expect(document.activeElement).toBe(button2);
    });
  });

  describe('announce', () => {
    it('should create and remove announcer element', () => {
      jest.useFakeTimers();
      
      AccessibilityService.announce('Test message');
      
      const announcer = document.querySelector('[aria-live]');
      expect(announcer).toBeTruthy();
      expect(announcer?.getAttribute('aria-live')).toBe('polite');
      
      jest.advanceTimersByTime(100);
      expect(announcer?.textContent).toBe('Test message');
      
      jest.advanceTimersByTime(1000);
      expect(document.querySelector('[aria-live]')).toBeNull();
      
      jest.useRealTimers();
    });

    it('should support assertive announcements', () => {
      AccessibilityService.announce('Important message', 'assertive');
      const announcer = document.querySelector('[aria-live]');
      expect(announcer?.getAttribute('aria-live')).toBe('assertive');
    });
  });
}); 