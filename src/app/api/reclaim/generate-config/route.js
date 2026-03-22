import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
import { NextResponse } from 'next/server';

const DEFAULT_GITHUB_PROVIDER_ID = '8573efb4-4529-47d3-80da-eaa7384dac19';

export async function POST(req) {
    try {
        const { providerId, username } = await req.json();
        
        const APP_ID = process.env.APPLICATION_ID;
        const APP_SECRET = process.env.APPLICATION_SECRET;
        const resolvedProviderId = providerId || DEFAULT_GITHUB_PROVIDER_ID;

        if (!APP_ID || !APP_SECRET) {
            return NextResponse.json({ error: "Missing Reclaim application credentials" }, { status: 500 });
        }

        if (!username) {
            return NextResponse.json({ error: "Missing GitHub username for verification" }, { status: 400 });
        }

        // 1. Initialize the mathematically secure Reclaim Context using v2 SDK
        const reclaimClient = await ReclaimProofRequest.init(APP_ID, APP_SECRET, resolvedProviderId);

        // Required URL parameters for the "Github Contributions in the last year" provider
        reclaimClient.setParams({
            "URL_PARAMS_1": username,
            "URL_PARAMS_2_GRD": username
        });

        // 2. Extract the physical payload routing URIs
        const requestUrl = await reclaimClient.getRequestUrl();

        // 3. Deconstruct the entire Javascript SDK class into a strictly serialized JSON object
        return NextResponse.json({ 
            requestUrl,
            signature: reclaimClient.signature,
            reclaimClientJson: reclaimClient.toJsonString()
        });
        
    } catch (e) {
        console.error("Reclaim Signature Initialization Error:", e);
        return NextResponse.json({ error: "Failed generating Zero-Knowledge Context", details: e.message }, { status: 500 });
    }
}
