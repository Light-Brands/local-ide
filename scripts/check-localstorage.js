// Run this in browser console to check localStorage state
// Copy and paste into browser DevTools Console

const stored = localStorage.getItem('local-ide-store-v2');
if (stored) {
  const parsed = JSON.parse(stored);
  console.log('=== localStorage Structure ===');
  console.log('Top-level keys:', Object.keys(parsed));
  console.log('');
  console.log('=== Terminal Tabs ===');
  // Try both structures - with and without 'state' wrapper
  const tabs = parsed.state?.terminalTabs || parsed.terminalTabs;
  const activeId = parsed.state?.activeTabId || parsed.activeTabId;
  console.log('terminalTabs:', tabs);
  console.log('activeTabId:', activeId);
  console.log('');
  if (parsed.state) {
    console.log('State keys:', Object.keys(parsed.state));
  }
} else {
  console.log('No local-ide-store-v2 found in localStorage');
}
