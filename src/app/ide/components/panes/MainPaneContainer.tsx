'use client';

import { useIDEStore } from '../../stores/ideStore';
import { PreviewPane } from './PreviewPane';
import { EditorPane } from './EditorPane';
import { DatabasePane } from './DatabasePane';
import { DeployPane } from './DeployPane';
import { ActivityPane } from './ActivityPane';

export function MainPaneContainer() {
  const activePane = useIDEStore((state) => state.activePane);

  // Render the active pane
  // Using conditional rendering instead of display:none to avoid
  // keeping heavy components mounted (like Monaco editor)
  switch (activePane) {
    case 'preview':
      return <PreviewPane />;
    case 'editor':
      return <EditorPane />;
    case 'database':
      return <DatabasePane />;
    case 'deploy':
      return <DeployPane />;
    case 'activity':
      return <ActivityPane />;
    default:
      return <PreviewPane />;
  }
}
