import { Suspense } from 'react';
import TypeMatchupsClient from './TypeMatchupsClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted animate-pulse">Loading type matchups...</p></div>}>
      <TypeMatchupsClient />
    </Suspense>
  );
}
