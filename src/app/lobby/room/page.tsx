'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RoomPageClient from '@/components/lobby/RoomPageClient';

function RoomPageContent() {
    const searchParams = useSearchParams();
    const roomId = searchParams.get('id');

    if (!roomId) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-bg text-text">
                <div className="text-center px-4">
                    <h1 className="text-2xl font-bold mb-2">Room Not Found</h1>
                    <p className="text-muted-foreground">No room ID was provided.</p>
                </div>
            </div>
        );
    }

    return <RoomPageClient roomId={roomId} />;
}

export default function RoomPage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-bg text-text">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading room...</p>
                </div>
            </div>
        }>
            <RoomPageContent />
        </Suspense>
    );
}
