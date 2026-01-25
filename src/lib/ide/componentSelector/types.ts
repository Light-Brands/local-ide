// =============================================================================
// Component Selector Types
// Type definitions for the component selector feature
// =============================================================================

// Selector mode - once (auto-disable after selection) or on (persistent)
export type SelectorMode = 'once' | 'on';

// Messages from IDE to App
export interface EnableSelectorMessage {
  type: 'component-selector:enable';
  source: 'ide';
}

export interface DisableSelectorMessage {
  type: 'component-selector:disable';
  source: 'ide';
}

export type IDEToAppMessage = EnableSelectorMessage | DisableSelectorMessage;

// Messages from App to IDE
export interface ComponentHoverMessage {
  type: 'component-selector:hover';
  source: 'app-preview';
  data: HoverData | null;
}

export interface HoverData {
  rect: { x: number; y: number; width: number; height: number };
  componentName: string | null;
  elementTag: string;
}

export interface ComponentSelectedMessage {
  type: 'component-selector:selected';
  source: 'app-preview';
  data: ComponentData;
}

export type AppToIDEMessage = ComponentHoverMessage | ComponentSelectedMessage;

// Component data structure
export interface ComponentData {
  componentName: string | null;
  componentPath: string;
  elementTag: string;
  elementId?: string;
  elementClasses: string[];
  dataAttributes: Record<string, string>;
  textContent: string;
  parentChain: string[];
  // Additional identifying attributes
  href?: string;
  ariaLabel?: string;
  role?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  // Unique selector for searching
  uniqueSelector: string;
  // Search hints for finding in code
  searchHints: string[];
}
