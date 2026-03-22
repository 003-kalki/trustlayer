import { NextResponse } from 'next/server';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
        return NextResponse.json({ error: 'Missing Reclaim session id' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://api.reclaimprotocol.org/api/sdk/session/${sessionId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data?.message || 'Failed to fetch Reclaim session status' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Reclaim status fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch Reclaim session status' }, { status: 500 });
    }
}
