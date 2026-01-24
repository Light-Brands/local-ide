'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Redirect to the main integrations page
export default function IDEConfigurePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/settings/development?from=ide');
  }, [router]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <p className="text-sm text-neutral-500">Redirecting to setup...</p>
      </div>
    </div>
  );
}
