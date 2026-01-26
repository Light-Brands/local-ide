# Plan: Component Enhancement Popup

## Overview

Enhance the component selection module to show an input popup when a component is selected, allowing users to describe what they want to change. Upon submission, the system auto-selects the quick-fix workflow, primes the chat input, and adds the component context with their enhancement request.

---

## Decisions Made

| Decision | Answer |
|----------|--------|
| Quick-fix agent | Use existing `workflow-quick-fix` from orchestration |
| Primed message | More comprehensive (see below) |
| Empty enhancement | Require minimum 5 words, show validation message |
| Multi-select mode | Both modes show popup. New click replaces pending. After submit, popup ready for next |
| Auto-focus | Yes, auto-focus chat input AND pulse the send button when 5+ words |

---

## Current Flow

```
User clicks component → Component data captured → Context added to "Elements"
→ User manually types request → User hits send
```

## Proposed Flow

```
User clicks component → Popup appears asking "What would you like to change?"
→ User types enhancement (5+ words) → User clicks "Submit"
→ Quick-fix workflow auto-loaded → Chat input primed with comprehensive message
→ Element context updated with enhancement details → Send button pulses
→ User hits send
```

---

## Implementation Plan

### Phase 1: Create the Enhancement Popup Component

**New File:** `src/app/ide/components/panes/PreviewPane/ComponentEnhancementPopup.tsx`

**Features:**
- Modal/dialog that appears centered over the preview pane
- Shows the component name/identifier at the top
- Textarea for user to describe their enhancement request
- **5-word minimum validation** with helper text
- "Submit" and "Cancel" buttons (Submit disabled until 5+ words)
- Keyboard support: Cmd/Ctrl+Enter to submit, Escape to cancel
- Clean, minimal design matching existing UI patterns

**Props:**
```typescript
interface ComponentEnhancementPopupProps {
  isOpen: boolean;
  componentData: ComponentData | null;
  onSubmit: (enhancementRequest: string) => void;
  onCancel: () => void;
}
```

**Validation:**
```typescript
const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
const isValid = wordCount >= 5;
// Show: "Please provide at least 5 words describing what you'd like to change"
```

---

### Phase 2: Modify the Component Selection Flow

**File:** `src/app/ide/components/panes/PreviewPane/index.tsx`

**Changes:**
1. Add state for popup visibility and pending component data:
   ```typescript
   const [showEnhancementPopup, setShowEnhancementPopup] = useState(false);
   const [pendingComponentData, setPendingComponentData] = useState<ComponentData | null>(null);
   ```

2. Modify `handleElementSelected` to show popup instead of immediately adding context:
   ```typescript
   const handleElementSelected = (data: ComponentData, formattedContext: string) => {
     // Store the new component data (replaces any pending)
     setPendingComponentData({ data, formattedContext });
     setShowEnhancementPopup(true);
     // Note: If popup was already open, this just updates the component
   };
   ```

3. Add handler for popup submission:
   ```typescript
   const handleEnhancementSubmit = (enhancementRequest: string) => {
     if (!pendingComponentData) return;

     // Dispatch enhanced element event
     window.dispatchEvent(new CustomEvent('ide:element-selected', {
       detail: {
         ...elementData,
         enhancementRequest, // Include the user's request
       }
     }));

     // Clear pending but keep popup open for next selection
     setPendingComponentData(null);
     // Popup stays open, will show fresh state on next component click
   };
   ```

4. Add handler for popup cancel:
   ```typescript
   const handleEnhancementCancel = () => {
     setPendingComponentData(null);
     setShowEnhancementPopup(false);
     // Optionally disable component selector
   };
   ```

---

### Phase 3: Update Context System for Enhancement + Workflow Loading

**File:** `src/app/ide/components/context/ContextProvider.tsx`

**Changes:**

1. Handle enhancement details in element event:
   ```typescript
   const handleElementSelected = (e: CustomEvent) => {
     const { enhancementRequest, ...elementData } = e.detail;

     // Build enhanced content
     let content = elementData.content;
     if (enhancementRequest) {
       content += `\n\n---\n**Enhancement Request:**\n${enhancementRequest}`;
     }

     // Add element to context
     addContext({
       type: 'element',
       name: elementData.name,
       description: elementData.description,
       content,
       metadata: elementData.metadata,
     });

     // Auto-load quick-fix workflow when enhancement request present
     if (enhancementRequest) {
       loadWorkflow('quick-fix');

       // Prime the chat input
       window.dispatchEvent(new CustomEvent('ide:prime-chat-input', {
         detail: {
           message: "I've selected a component and described what I'd like to change. Can you run the quick-fix workflow to update this component for me?",
           focusInput: true,
           pulseSubmit: true,
         }
       }));
     }
   };
   ```

2. Add/expose `loadWorkflow` function:
   ```typescript
   const loadWorkflow = (workflowName: string) => {
     const workflow = workflowDefinitions.find(w => w.name === workflowName);
     if (!workflow) return;

     // Add workflow context (this replaces any existing workflow)
     addContext({
       type: 'workflow',
       name: workflow.name,
       displayName: workflow.displayName,
       description: workflow.description,
       content: workflow.strategyPrompt,
       color: workflow.color,
     });
   };
   ```

---

### Phase 4: Add Chat Input Priming + Send Button Pulse

**File:** `src/app/ide/components/chat/ChatInput.tsx`

**Changes:**

1. Add event listener for priming:
   ```typescript
   useEffect(() => {
     const handlePrimeChatInput = (e: CustomEvent) => {
       const { message, focusInput, pulseSubmit } = e.detail;

       onChange(message);

       if (focusInput && textareaRef.current) {
         textareaRef.current.focus();
       }

       if (pulseSubmit) {
         setShouldPulseSubmit(true);
       }
     };

     window.addEventListener('ide:prime-chat-input', handlePrimeChatInput);
     return () => window.removeEventListener('ide:prime-chat-input', handlePrimeChatInput);
   }, [onChange]);
   ```

2. Add pulse state and 5-word check:
   ```typescript
   const [shouldPulseSubmit, setShouldPulseSubmit] = useState(false);

   // Check word count for pulse activation
   const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
   const showPulse = shouldPulseSubmit && wordCount >= 5;

   // Clear pulse on submit
   const handleSubmit = () => {
     setShouldPulseSubmit(false);
     onSubmit();
   };
   ```

3. Add pulse animation to send button:
   ```tsx
   <Button
     onClick={handleSubmit}
     disabled={disabled || !value.trim()}
     className={cn(
       "...",
       showPulse && "animate-pulse ring-2 ring-emerald-500 ring-offset-2 ring-offset-neutral-900"
     )}
   >
     <Send className="h-4 w-4" />
   </Button>
   ```

4. Add visual hint text when pulsing:
   ```tsx
   {showPulse && (
     <div className="text-xs text-emerald-400 animate-pulse">
       Ready to go! Hit send to run the update.
     </div>
   )}
   ```

---

## UI Designs

### Enhancement Popup
```
┌────────────────────────────────────────────────┐
│  ✨ Enhance Component                        ✕ │
├────────────────────────────────────────────────┤
│                                                │
│  Component: LoginButton                        │
│  Path: button.submit-btn                       │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ What would you like to change?           │ │
│  │                                          │ │
│  │                                          │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│  ⓘ Please provide at least 5 words           │
│                                                │
│              [Cancel]  [Submit ↵]              │
│                        (disabled until valid)  │
└────────────────────────────────────────────────┘
```

**Validation States:**
- 0-4 words: "Please provide at least 5 words describing your change" (muted text)
- 5+ words: Helper text disappears, Submit button enabled

### Chat Input with Pulse
```
┌─────────────────────────────────────────────────────────────┐
│ [Elements 1] [Workflows 1] [Agents 3] ...                   │
├─────────────────────────────────────────────────────────────┤
│ I've selected a component and described what I'd like to    │
│ change. Can you run the quick-fix workflow to update this   │
│ component for me?                                           │
├─────────────────────────────────────────────────────────────┤
│ Ready to go! Hit send to run the update.    [🔘 SEND 🔘]   │
│                                              ↑ pulsing      │
└─────────────────────────────────────────────────────────────┘
```

---

### Keyboard Shortcuts

| Context | Shortcut | Action |
|---------|----------|--------|
| Popup | `Escape` | Cancel and close popup |
| Popup | `Cmd/Ctrl + Enter` | Submit (if valid) |
| Popup textarea | `Enter` | New line (standard) |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `PreviewPane/ComponentEnhancementPopup.tsx` | **CREATE** | New popup component with 5-word validation |
| `PreviewPane/index.tsx` | MODIFY | Add popup state, replace immediate context add |
| `context/ContextProvider.tsx` | MODIFY | Handle enhancement details, auto-load workflow, dispatch prime event |
| `chat/ChatInput.tsx` | MODIFY | Add prime listener, pulse animation, "ready to go" hint |

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS COMPONENT                                    │
├─────────────────────────────────────────────────────────────┤
│ useComponentSelector captures ComponentData                 │
│   ↓                                                         │
│ PreviewPane.handleElementSelected()                         │
│   ├─ setPendingComponentData(data)                         │
│   └─ setShowEnhancementPopup(true)                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ENHANCEMENT POPUP SHOWN                                  │
├─────────────────────────────────────────────────────────────┤
│ ComponentEnhancementPopup                                   │
│   ├─ Shows component name/path                             │
│   ├─ Textarea for enhancement request                      │
│   ├─ Validates: minimum 5 words                            │
│   └─ Submit disabled until valid                           │
│                                                             │
│ If user clicks another component:                          │
│   → pendingComponentData replaced                          │
│   → Popup shows new component (input cleared)              │
│                                                             │
│ If user cancels:                                           │
│   → Popup closes, selector optionally disabled             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. USER SUBMITS (5+ words)                                  │
├─────────────────────────────────────────────────────────────┤
│ handleEnhancementSubmit(request)                           │
│   ├─ Dispatches 'ide:element-selected' with:              │
│   │   └─ enhancementRequest included                       │
│   ├─ Clears pendingComponentData                           │
│   └─ Popup stays open (ready for next selection)           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CONTEXT PROVIDER RECEIVES EVENT                          │
├─────────────────────────────────────────────────────────────┤
│ handleElementSelected()                                     │
│   ├─ Appends enhancement request to element content        │
│   ├─ addContext(element)                                   │
│   ├─ loadWorkflow('quick-fix')                             │
│   │   └─ Loads: @quick-dev, @debugger, @test-runner        │
│   │   └─ Skills: systematic-debugging                       │
│   └─ Dispatches 'ide:prime-chat-input'                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CHAT INPUT PRIMED                                        │
├─────────────────────────────────────────────────────────────┤
│ ChatInput receives 'ide:prime-chat-input'                  │
│   ├─ Sets value to comprehensive message                   │
│   ├─ Focuses textarea                                      │
│   ├─ Enables pulse mode                                    │
│   └─ Shows "Ready to go! Hit send to run the update."      │
│                                                             │
│ Send button pulses with emerald ring animation             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. USER HITS SEND                                           │
├─────────────────────────────────────────────────────────────┤
│ buildPromptWithTooling() combines:                         │
│   ├─ Quick-fix workflow strategy                           │
│   ├─ Agents: quick-dev, debugger, test-runner             │
│   ├─ Skills: systematic-debugging                          │
│   ├─ Element context + enhancement request                 │
│   └─ User message                                          │
│                                                             │
│ Full context sent to Claude CLI                            │
│ Context cleared ("fuel consumed")                          │
│ Pulse animation stops                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| User clicks new component before submitting | Pending component replaced, popup shows new one |
| User submits successfully | Popup stays open, clears for next selection |
| User cancels popup | Popup closes, pending cleared |
| User tries to submit < 5 words | Submit button disabled, validation message shown |
| User in "on" mode | Same behavior, popup persists through selections |
| User in "once" mode | Same behavior, selector disables after popup closes |
| Chat already has content | Primed message replaces it (user hasn't typed yet) |

---

## Primed Message (Comprehensive)

```
I've selected a component and described what I'd like to change. Can you run the quick-fix workflow to update this component for me?
```

This works because the context already contains:
- The workflow strategy (quick-fix)
- The relevant agents and skills
- The element with full component context
- The enhancement request with their specific change

---

## Testing Checklist

- [ ] Popup appears on component selection
- [ ] Component name/path displayed correctly
- [ ] Can type enhancement request
- [ ] Submit disabled with < 5 words
- [ ] Validation message shows with < 5 words
- [ ] Submit enabled at exactly 5 words
- [ ] Cancel closes popup
- [ ] Submit adds element with enhancement to context
- [ ] Quick-fix workflow auto-loaded after submit
- [ ] Chat input primed with message
- [ ] Chat input focused after prime
- [ ] Send button pulses with emerald ring
- [ ] "Ready to go!" hint text visible
- [ ] Clicking new component replaces pending (popup stays open)
- [ ] After submit, popup ready for next selection
- [ ] Works in both "once" and "on" selector modes
- [ ] Pulse stops after send
- [ ] Full context sent correctly
