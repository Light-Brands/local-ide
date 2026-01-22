// =============================================================================
// Feedback Capture Utilities
// Captures context, text content, and screenshots when user clicks
// =============================================================================

import type { CapturedContext, FeedbackPosition, TextContext, PageId } from './types';
import { getCurrentPageId } from './pageId';
import { isBrowser } from './visibility';

/**
 * Get readable path from clicked element up to body
 * Returns something like "Dashboard > Epic Cards > Epic 01"
 */
export function getElementPath(element: HTMLElement): string {
  if (!isBrowser) return 'Page';

  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    // Check for data attributes that indicate section/component names
    const sectionName = current.getAttribute('data-section');
    const componentName = current.getAttribute('data-component');
    const testId = current.getAttribute('data-testid');

    // Check for meaningful content
    if (sectionName) {
      path.unshift(sectionName);
    } else if (componentName) {
      path.unshift(componentName);
    } else if (testId) {
      path.unshift(testId.replace(/-/g, ' '));
    } else if (current.id && !current.id.startsWith('radix-')) {
      path.unshift(current.id.replace(/-/g, ' '));
    } else {
      // Check for heading text inside this element
      const heading = current.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading && heading.textContent && !path.includes(heading.textContent.trim())) {
        const text = heading.textContent.trim().slice(0, 30);
        if (text) path.unshift(text);
      }
    }

    current = current.parentElement;
  }

  // Limit path length and clean up
  const uniquePath = [...new Set(path)].slice(0, 5);
  return uniquePath.length > 0 ? uniquePath.join(' > ') : 'Page';
}

/**
 * Find the nearest React component name
 * Looks for data-component or class names that look like components
 */
export function getComponentName(element: HTMLElement): string | undefined {
  if (!isBrowser) return undefined;

  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    // Check for explicit component name
    const componentName = current.getAttribute('data-component');
    if (componentName) return componentName;

    // Check class names for component-like patterns (PascalCase)
    const classes = Array.from(current.classList);
    const componentClass = classes.find(c => /^[A-Z][a-zA-Z]+$/.test(c));
    if (componentClass) return componentClass;

    current = current.parentElement;
  }

  return undefined;
}

/**
 * Extract text content around the clicked element
 */
export function getTextContext(element: HTMLElement, clickY: number): TextContext {
  if (!isBrowser) {
    return {
      textBefore: '',
      textAfter: '',
      clickedText: '',
      elementTag: 'div',
      elementClasses: [],
      dataAttributes: {},
    };
  }

  // Get the clicked element's text
  const clickedText = element.innerText?.slice(0, 500) || element.textContent?.slice(0, 500) || '';

  // Get parent context for before/after
  const parent = element.parentElement;

  // Simple approach: get text from surrounding elements
  let textBefore = '';
  let textAfter = '';

  if (parent) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element);

    // Get previous siblings text
    for (let i = Math.max(0, index - 3); i < index; i++) {
      const text = (siblings[i] as HTMLElement)?.innerText?.trim();
      if (text) textBefore += text + '\n';
    }

    // Get next siblings text
    for (let i = index + 1; i < Math.min(siblings.length, index + 4); i++) {
      const text = (siblings[i] as HTMLElement)?.innerText?.trim();
      if (text) textAfter += text + '\n';
    }
  }

  // Get element details
  const dataAttributes: Record<string, string> = {};
  Array.from(element.attributes)
    .filter(attr => attr.name.startsWith('data-'))
    .forEach(attr => {
      dataAttributes[attr.name] = attr.value;
    });

  return {
    textBefore: textBefore.trim(),
    textAfter: textAfter.trim(),
    clickedText: clickedText.trim(),
    elementTag: element.tagName.toLowerCase(),
    elementId: element.id || undefined,
    elementClasses: Array.from(element.classList),
    dataAttributes,
  };
}

/**
 * Calculate position as percentages for marker placement
 */
export function getPosition(event: MouseEvent): FeedbackPosition {
  if (!isBrowser) {
    return { x: 0, y: 0, scrollY: 0, viewportY: 0 };
  }

  const docHeight = Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  );
  const docWidth = Math.max(
    document.body.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.scrollWidth,
    document.documentElement.offsetWidth
  );

  return {
    x: (event.pageX / docWidth) * 100,
    y: (event.pageY / docHeight) * 100,
    scrollY: window.scrollY,
    viewportY: (event.clientY / window.innerHeight) * 100,
  };
}

/**
 * Capture screenshot of clicked element using html2canvas
 */
export async function captureScreenshot(
  element: HTMLElement,
  clickEvent?: { clientX: number; clientY: number }
): Promise<string | undefined> {
  if (!isBrowser) return undefined;

  try {
    const html2canvas = (await import('html2canvas')).default;

    // Find a reasonable container
    let target = element;
    while (target.parentElement && target.offsetWidth < 100 && target.offsetHeight < 100) {
      target = target.parentElement;
    }

    const canvas = await html2canvas(target, {
      backgroundColor: '#0a0a0a', // Dark background
      scale: 1,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    return canvas.toDataURL('image/png', 0.8);
  } catch (error) {
    console.warn('Screenshot capture failed:', error);
    return undefined;
  }
}

/**
 * Format text context for display in the feedback form
 */
export function formatTextContextPreview(textContext: TextContext): string {
  const parts: string[] = [];

  if (textContext.clickedText) {
    parts.push(`Clicked on: "${textContext.clickedText.slice(0, 100)}${textContext.clickedText.length > 100 ? '...' : ''}"`);
  }

  parts.push(`Element: <${textContext.elementTag}>`);

  if (textContext.elementId) {
    parts.push(`ID: #${textContext.elementId}`);
  }

  if (textContext.elementClasses.length > 0) {
    parts.push(`Classes: ${textContext.elementClasses.slice(0, 3).join(', ')}`);
  }

  return parts.join(' | ');
}

/**
 * Capture context from a single element (hover-click approach)
 * Captures the element's full content + 50 lines before/after
 */
export async function captureContextFromElement(
  element: HTMLElement,
  event: MouseEvent
): Promise<CapturedContext | null> {
  if (!isBrowser) return null;

  try {
    const sectionPath = getElementPath(element);
    const componentName = getComponentName(element);
    const pageId = getCurrentPageId();

    // Get the element's full text content
    const elementText = element.innerText?.trim() || '';

    // Get 50 lines before and after from the page
    const pageText = document.body.innerText || '';

    let textBefore = '';
    let textAfter = '';

    // Find where this element's text appears in the page
    const searchText = elementText.slice(0, 100);
    if (searchText) {
      const startIndex = pageText.indexOf(searchText);
      if (startIndex !== -1) {
        // Get 50 lines before
        const textBeforeElement = pageText.slice(0, startIndex);
        const linesBefore = textBeforeElement.split('\n').filter(line => line.trim());
        textBefore = linesBefore.slice(-50).join('\n');

        // Get 50 lines after
        const endIndex = startIndex + elementText.length;
        const textAfterElement = pageText.slice(endIndex);
        const linesAfter = textAfterElement.split('\n').filter(line => line.trim());
        textAfter = linesAfter.slice(0, 50).join('\n');
      }
    }

    // Build text context
    const textContext: TextContext = {
      textBefore,
      textAfter,
      clickedText: elementText,
      elementTag: element.tagName.toLowerCase(),
      elementId: element.id || undefined,
      elementClasses: Array.from(element.classList),
      dataAttributes: {},
    };

    // Get data attributes
    Array.from(element.attributes)
      .filter((attr) => attr.name.startsWith('data-'))
      .forEach((attr) => {
        textContext.dataAttributes[attr.name] = attr.value;
      });

    // Calculate position
    const position = getPosition(event);

    // Capture screenshot
    const screenshot = await captureScreenshot(element, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    return {
      sectionPath,
      componentName,
      pageId,
      position,
      textContext,
      screenshot,
    };
  } catch (error) {
    console.error('Element capture failed:', error);
    return null;
  }
}

/**
 * Find the primary element for a selection region
 */
function findPrimaryElement(
  bounds: { left: number; top: number; width: number; height: number }
): HTMLElement | null {
  if (!isBrowser) return null;

  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;

  let element = document.elementFromPoint(centerX, centerY) as HTMLElement;

  if (!element || element.id === 'feedback-mode-overlay') {
    // Try corners
    const points = [
      { x: bounds.left + 10, y: bounds.top + 10 },
      { x: bounds.left + bounds.width - 10, y: bounds.top + 10 },
      { x: bounds.left + 10, y: bounds.top + bounds.height - 10 },
      { x: bounds.left + bounds.width - 10, y: bounds.top + bounds.height - 10 },
    ];

    for (const point of points) {
      const el = document.elementFromPoint(point.x, point.y) as HTMLElement;
      if (el && el.id !== 'feedback-mode-overlay' && !el.closest('[data-feedback-ui]')) {
        element = el;
        break;
      }
    }
  }

  return element;
}

/**
 * Capture context from a selection box area
 */
export async function captureContextFromSelection(
  bounds: { left: number; top: number; width: number; height: number },
  event: MouseEvent
): Promise<CapturedContext | null> {
  if (!isBrowser) return null;

  try {
    // Find the primary element
    const element = findPrimaryElement(bounds);
    if (!element) {
      console.warn('No element found in selection');
      return null;
    }

    const sectionPath = getElementPath(element);
    const componentName = getComponentName(element);
    const pageId = getCurrentPageId();

    // Get text context
    const textContext = getTextContext(element, event.clientY);

    // Calculate position
    const position = getPosition(event);

    return {
      sectionPath,
      componentName,
      pageId,
      position,
      textContext,
      screenshot: undefined,
    };
  } catch (error) {
    console.error('Selection capture failed:', error);
    return null;
  }
}
