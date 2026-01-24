'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface IntegrationStatus {
  github: boolean;
  vercel: boolean;
  supabase: boolean;
  claude: boolean;
}

export default function IDEPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkIntegrations() {
      try {
        const response = await fetch('/api/integrations');
        const result = await response.json();
        const data = result.data || result;

        setIntegrations({
          github: !!data.github?.connected,
          vercel: !!data.vercel?.connected,
          supabase: !!data.supabase?.connected,
          claude: !!data.claude?.connected,
        });

        // Check if at least GitHub OR Claude is connected (minimum for development)
        const hasMinimum = !!data.github?.connected || !!data.claude?.connected;

        if (!hasMinimum) {
          // No integrations - redirect to setup
          router.replace('/admin/settings/development?from=ide');
        } else {
          // Has minimum - go to workspace
          router.replace('/ide/workspace');
        }
      } catch {
        // On error, redirect to setup
        router.replace('/admin/settings/development?from=ide');
      } finally {
        setIsLoading(false);
      }
    }

    checkIntegrations();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <p className="text-sm text-neutral-400">Loading IDE...</p>
        </div>
      </div>
    );
  }

  return null;
}
