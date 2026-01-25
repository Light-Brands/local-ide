// =============================================================================
// Component Selector Bridge Script
// Runs inside the preview iframe to detect and select components
// =============================================================================

/**
 * The bridge script code that runs inside the preview iframe.
 * This is exported as a string so it can be injected or compiled to a standalone file.
 */
export const bridgeScript = `
(function() {
  // Prevent double initialization
  if (window.__componentSelectorBridge) return;
  window.__componentSelectorBridge = true;

  let isEnabled = false;
  let currentHighlight = null;
  let lastHoveredElement = null;

  // Tags to skip - not meaningful for component selection
  const SKIP_TAGS = ['html', 'head', 'script', 'style', 'link', 'meta', 'noscript', 'svg', 'path'];

  // Semantic HTML tags that are worth selecting
  const SEMANTIC_TAGS = ['main', 'nav', 'header', 'footer', 'section', 'article', 'aside', 'form', 'button', 'a', 'input', 'textarea', 'select', 'table', 'ul', 'ol', 'li', 'dialog', 'details', 'figure'];

  /**
   * Check if an element is a good candidate for selection
   */
  function shouldSelect(el) {
    if (!el || el === document.body || el === document.documentElement) return false;

    const tagName = el.tagName.toLowerCase();
    if (SKIP_TAGS.includes(tagName)) return false;

    const rect = el.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return false;

    // Has explicit component marker
    if (el.hasAttribute('data-component')) return true;
    if (el.hasAttribute('data-testid')) return true;
    if (el.hasAttribute('data-section')) return true;

    // PascalCase class = likely React component
    const hasComponentClass = Array.from(el.classList)
      .some(function(c) { return /^[A-Z][a-zA-Z]+$/.test(c); });
    if (hasComponentClass) return true;

    // Semantic HTML tag
    if (SEMANTIC_TAGS.includes(tagName)) return true;

    // Has a meaningful ID (not auto-generated)
    if (el.id && !el.id.startsWith('radix-') && !el.id.startsWith(':r')) return true;

    return false;
  }

  /**
   * Walk up the DOM tree to find the nearest selectable ancestor
   */
  function findSelectableAncestor(el) {
    let current = el;
    while (current && current !== document.body) {
      if (shouldSelect(current)) return current;
      current = current.parentElement;
    }
    return null;
  }

  /**
   * Get the component name from an element
   */
  function getComponentName(el) {
    let current = el;
    while (current && current !== document.body) {
      const name = current.getAttribute('data-component');
      if (name) return name;

      const componentClass = Array.from(current.classList)
        .find(function(c) { return /^[A-Z][a-zA-Z]+$/.test(c); });
      if (componentClass) return componentClass;

      current = current.parentElement;
    }
    return null;
  }

  /**
   * Get a readable path for the component
   */
  function getComponentPath(el) {
    const path = [];
    let current = el;

    while (current && current !== document.body) {
      const name = current.getAttribute('data-component')
        || current.getAttribute('data-section')
        || current.getAttribute('data-testid')?.replace(/-/g, ' ');
      if (name) path.unshift(name);
      current = current.parentElement;
    }

    return path.slice(0, 5).join(' > ') || 'Page';
  }

  /**
   * Get parent chain for context
   */
  function getParentChain(el) {
    const chain = [];
    let current = el.parentElement;

    while (current && current !== document.body && chain.length < 5) {
      const tag = current.tagName.toLowerCase();
      let identifier = tag;

      if (current.hasAttribute('data-component')) {
        identifier = current.getAttribute('data-component');
      } else if (current.id && !current.id.startsWith('radix-')) {
        identifier = tag + '#' + current.id;
      } else {
        const componentClass = Array.from(current.classList)
          .find(function(c) { return /^[A-Z][a-zA-Z]+$/.test(c); });
        if (componentClass) {
          identifier = componentClass;
        }
      }

      chain.push(identifier);
      current = current.parentElement;
    }

    return chain;
  }

  /**
   * Build a unique CSS selector for the element
   */
  function buildUniqueSelector(el) {
    const parts = [];
    let current = el;

    while (current && current !== document.body && parts.length < 5) {
      let selector = current.tagName.toLowerCase();

      // ID is most unique
      if (current.id && !current.id.startsWith('radix-') && !current.id.startsWith(':r')) {
        selector += '#' + current.id;
        parts.unshift(selector);
        break; // ID is unique enough
      }

      // Add meaningful classes (skip utility classes)
      const meaningfulClasses = Array.from(current.classList)
        .filter(function(c) {
          // Keep component-like classes and semantic classes
          return /^[A-Z][a-zA-Z]+$/.test(c) ||
                 c.startsWith('btn') ||
                 c.startsWith('card') ||
                 c.startsWith('nav') ||
                 c.startsWith('header') ||
                 c.startsWith('footer') ||
                 c.startsWith('modal') ||
                 c.startsWith('dialog');
        });

      if (meaningfulClasses.length > 0) {
        selector += '.' + meaningfulClasses.join('.');
      }

      // Add data attributes that identify the element
      if (current.hasAttribute('data-testid')) {
        selector += '[data-testid="' + current.getAttribute('data-testid') + '"]';
      } else if (current.hasAttribute('data-component')) {
        selector += '[data-component="' + current.getAttribute('data-component') + '"]';
      }

      // Add href for links
      if (current.tagName === 'A' && current.getAttribute('href')) {
        const href = current.getAttribute('href');
        if (href && !href.startsWith('javascript:')) {
          selector += '[href="' + href + '"]';
        }
      }

      parts.unshift(selector);
      current = current.parentElement;
    }

    return parts.join(' > ');
  }

  /**
   * Generate search hints for finding this component in code
   */
  function generateSearchHints(el) {
    const hints = [];
    const tag = el.tagName.toLowerCase();
    const text = (el.innerText || '').trim().slice(0, 50);

    // Text content is very searchable
    if (text && text.length > 2 && text.length < 50) {
      hints.push('"' + text.replace(/"/g, '\\"') + '"');
    }

    // href is unique
    if (el.getAttribute('href')) {
      hints.push('href="' + el.getAttribute('href') + '"');
    }

    // aria-label is usually unique
    if (el.getAttribute('aria-label')) {
      hints.push('aria-label="' + el.getAttribute('aria-label') + '"');
    }

    // data-testid is meant to be unique
    if (el.getAttribute('data-testid')) {
      hints.push('data-testid="' + el.getAttribute('data-testid') + '"');
    }

    // data-component
    if (el.getAttribute('data-component')) {
      hints.push('data-component="' + el.getAttribute('data-component') + '"');
    }

    // Unique class combinations
    const componentClasses = Array.from(el.classList)
      .filter(function(c) { return /^[A-Z][a-zA-Z]+$/.test(c); });
    if (componentClasses.length > 0) {
      hints.push('className="' + componentClasses.join(' ') + '"');
    }

    // For buttons/links, the text content in JSX
    if ((tag === 'button' || tag === 'a') && text) {
      hints.push('>' + text + '<');
    }

    return hints;
  }

  /**
   * Extract component data from an element
   */
  function getComponentData(el) {
    const dataAttributes = {};
    Array.from(el.attributes)
      .filter(function(attr) { return attr.name.startsWith('data-'); })
      .forEach(function(attr) {
        dataAttributes[attr.name] = attr.value;
      });

    const textContent = (el.innerText || el.textContent || '').trim().slice(0, 500);

    return {
      componentName: getComponentName(el),
      componentPath: getComponentPath(el),
      elementTag: el.tagName.toLowerCase(),
      elementId: el.id || undefined,
      elementClasses: Array.from(el.classList),
      dataAttributes: dataAttributes,
      textContent: textContent,
      parentChain: getParentChain(el),
      // Additional identifying attributes
      href: el.getAttribute('href') || undefined,
      ariaLabel: el.getAttribute('aria-label') || undefined,
      role: el.getAttribute('role') || undefined,
      name: el.getAttribute('name') || undefined,
      type: el.getAttribute('type') || undefined,
      placeholder: el.getAttribute('placeholder') || undefined,
      // Unique selector and search hints
      uniqueSelector: buildUniqueSelector(el),
      searchHints: generateSearchHints(el)
    };
  }

  /**
   * Create or update the highlight overlay
   */
  function updateHighlight(el) {
    if (!el) {
      if (currentHighlight) {
        currentHighlight.remove();
        currentHighlight = null;
      }
      return;
    }

    const rect = el.getBoundingClientRect();
    const componentName = getComponentName(el) || el.tagName.toLowerCase();

    if (!currentHighlight) {
      currentHighlight = document.createElement('div');
      currentHighlight.id = '__component-selector-highlight';
      currentHighlight.style.cssText = 'position:fixed;pointer-events:none;z-index:999999;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);transition:all 0.1s ease;';

      const label = document.createElement('div');
      label.id = '__component-selector-label';
      label.style.cssText = 'position:absolute;top:-24px;left:0;background:#3b82f6;color:white;font-size:12px;padding:2px 8px;border-radius:4px 4px 0 0;font-family:system-ui,sans-serif;white-space:nowrap;';
      currentHighlight.appendChild(label);

      document.body.appendChild(currentHighlight);
    }

    currentHighlight.style.left = rect.left + 'px';
    currentHighlight.style.top = rect.top + 'px';
    currentHighlight.style.width = rect.width + 'px';
    currentHighlight.style.height = rect.height + 'px';

    const label = currentHighlight.querySelector('#__component-selector-label');
    if (label) label.textContent = componentName;
  }

  /**
   * Handle mouse move for hover detection
   */
  function handleMouseMove(e) {
    if (!isEnabled) return;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const selectable = findSelectableAncestor(el);

    if (selectable !== lastHoveredElement) {
      lastHoveredElement = selectable;
      updateHighlight(selectable);

      if (selectable) {
        const rect = selectable.getBoundingClientRect();
        window.parent.postMessage({
          type: 'component-selector:hover',
          source: 'app-preview',
          data: {
            rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
            componentName: getComponentName(selectable),
            elementTag: selectable.tagName.toLowerCase()
          }
        }, '*');
      } else {
        window.parent.postMessage({
          type: 'component-selector:hover',
          source: 'app-preview',
          data: null
        }, '*');
      }
    }
  }

  /**
   * Handle click for selection
   */
  function handleClick(e) {
    if (!isEnabled) return;

    e.preventDefault();
    e.stopPropagation();

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const selectable = findSelectableAncestor(el);

    if (selectable) {
      const data = getComponentData(selectable);
      window.parent.postMessage({
        type: 'component-selector:selected',
        source: 'app-preview',
        data: data
      }, '*');
    }
  }

  /**
   * Enable the selector
   */
  function enable() {
    if (isEnabled) return;
    isEnabled = true;
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
  }

  /**
   * Disable the selector
   */
  function disable() {
    if (!isEnabled) return;
    isEnabled = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    updateHighlight(null);
    lastHoveredElement = null;
  }

  /**
   * Listen for messages from the IDE
   */
  window.addEventListener('message', function(event) {
    if (event.data?.source !== 'ide') return;

    if (event.data.type === 'component-selector:enable') {
      enable();
    } else if (event.data.type === 'component-selector:disable') {
      disable();
    }
  });

  // Send ready signal
  window.parent.postMessage({
    type: 'component-selector:ready',
    source: 'app-preview'
  }, '*');
})();
`;

/**
 * Get the bridge script for injection into an iframe
 */
export function getBridgeScript(): string {
  return bridgeScript;
}
