import { z } from 'zod';

export const ACCESSIBILITY_CONFIG = {
  // WCAG 2.1 AA Compliance Requirements
  wcag: {
    level: 'AA',
    version: '2.1',
    guidelines: {
      perceivable: {
        textAlternatives: true, // 1.1
        timeBasedMedia: true, // 1.2
        adaptable: true, // 1.3
        distinguishable: true, // 1.4
      },
      operable: {
        keyboardAccessible: true, // 2.1
        enoughTime: true, // 2.2
        seizures: true, // 2.3
        navigable: true, // 2.4
        inputModalities: true, // 2.5
      },
      understandable: {
        readable: true, // 3.1
        predictable: true, // 3.2
        inputAssistance: true, // 3.3
      },
      robust: {
        compatible: true, // 4.1
      },
    },
  },

  // ARIA Implementation
  aria: {
    landmarks: [
      'banner',
      'main',
      'navigation',
      'complementary',
      'contentinfo',
      'search',
      'form',
    ],
    requiredProps: {
      button: ['aria-label', 'aria-expanded', 'aria-pressed', 'aria-controls'],
      input: ['aria-label', 'aria-required', 'aria-invalid', 'aria-describedby'],
      dialog: ['aria-labelledby', 'aria-describedby', 'aria-modal'],
      menu: ['aria-label', 'aria-expanded', 'aria-orientation'],
    },
    liveRegions: {
      types: ['polite', 'assertive'],
      usage: ['status', 'alert', 'log'],
    },
  },

  // Keyboard Navigation
  keyboard: {
    focusableElements: [
      'a[href]',
      'button',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
    ],
    focusOrder: {
      natural: true,
      maintainScroll: true,
      trapInModals: true,
    },
    shortcuts: {
      skip: 'Alt+1', // Skip to main content
      menu: 'Alt+2', // Open main menu
      search: 'Alt+3', // Focus search
    },
  },

  // Screen Reader Optimization
  screenReader: {
    announcements: {
      pageLoad: true,
      navigation: true,
      formSubmission: true,
      errorMessages: true,
      loadingStates: true,
    },
    textAlternatives: {
      images: true,
      icons: true,
      buttons: true,
      links: true,
    },
    landmarks: {
      required: ['header', 'main', 'footer', 'navigation'],
      recommended: ['search', 'complementary'],
    },
  },

  // Focus Management
  focus: {
    indicators: {
      visible: true,
      highContrast: true,
      size: '3px',
      color: 'primary',
    },
    behavior: {
      returnPosition: true,
      trapInModals: true,
      skipLinks: true,
    },
    styling: {
      outlineWidth: '2px',
      outlineStyle: 'solid',
      outlineOffset: '2px',
    },
  },

  // Color and Contrast
  color: {
    contrast: {
      normal: {
        min: 4.5, // AA for normal text
        recommended: 7,
      },
      large: {
        min: 3, // AA for large text
        recommended: 4.5,
      },
    },
    colorBlindness: {
      protanopia: true,
      deuteranopia: true,
      tritanopia: true,
    },
  },

  // Form Accessibility
  forms: {
    labels: {
      visible: true,
      position: 'top',
      required: true,
    },
    validation: {
      realTime: true,
      onSubmit: true,
      clear: true,
    },
    errorMessages: {
      location: 'below',
      ariaLive: 'polite',
      icon: true,
    },
  },

  // Testing Requirements
  testing: {
    tools: ['jest-axe', 'cypress-axe'],
    coverage: {
      required: true,
      minimum: 90,
    },
    automated: {
      ci: true,
      frequency: 'perCommit',
    },
    manual: {
      frequency: 'perRelease',
      devices: ['screen-reader', 'keyboard', 'mobile'],
    },
  },

  // Validation Schemas
  schemas: {
    ariaLabel: z.string()
      .min(1, 'ARIA label must not be empty')
      .max(100, 'ARIA label must not exceed 100 characters'),
    
    altText: z.string()
      .min(1, 'Alt text must not be empty')
      .max(150, 'Alt text must not exceed 150 characters')
      .refine(
        (text) => !text.toLowerCase().includes('image of'),
        'Alt text should not begin with "image of"'
      ),
    
    headingStructure: z.array(z.string())
      .refine(
        (headings) => {
          const levels = headings.map(h => parseInt(h.charAt(1)));
          return levels.every((level, i) => i === 0 || level <= levels[i-1] + 1);
        },
        'Heading levels should not skip levels'
      ),
  },
}; 