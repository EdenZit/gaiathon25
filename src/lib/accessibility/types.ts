import { AriaAttributes, DOMAttributes } from 'react';

export interface AccessibilityProps extends AriaAttributes, DOMAttributes<HTMLElement> {
  role?: string;
  className?: string;
  tabIndex?: number;
  id?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
} 