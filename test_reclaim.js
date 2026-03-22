require('dotenv').config({ path: '.env.local' });
const { Reclaim } = require('@reclaimprotocol/js-sdk');

async function test() {
    try {
        const APP_ID = process.env.APPLICATION_ID;
        const APP_SECRET = process.env.APPLICATION_SECRET;
        
        console.log("APP_ID:", APP_ID);
        // Do not log secret
        
        const reclaimClient = new Reclaim.ProofRequest(APP_ID);
        await reclaimClient.buildProofRequest("6d3f6753-7ee6-49ee-a545-62f1b1822ce5");
        reclaimClient.setSignature(await reclaimClient.generateSignature(APP_SECRET));
        const req = await reclaimClient.createVerificationRequest();
        console.log("SUCCESS:", req);
    } catch(e) {
        console.error("FAILED!!!", e);
    }
}
test();
