import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';

async function testReclaim() {
  const APP_ID = "0x747d05f9f3914c0426be2519CF5A54A119cEa08d";
  const APP_SECRET = "0xb9cc4c72e9a8e1edf45f59c4b83824bc057806c8bd54a2053c14d4d155df0857";
  const PROVIDER_ID = "8573efb4-4529-47d3-80da-eaa7384dac19";
  
  try {
    const reclaimClient = await ReclaimProofRequest.init(APP_ID, APP_SECRET, PROVIDER_ID);
    
    // Test Provider URL parameters
    reclaimClient.setParams({
        "URL_PARAMS_1": "shyam",
        "URL_PARAMS_2_GRD": "shyam"
    });

    const requestUrl = await reclaimClient.getRequestUrl();
    console.log("SUCCESSFUL INITIATION!");
    console.log("QR Request URL:", requestUrl);
    
  } catch(e) {
    console.error("SDK Test Error:", e.message);
  }
}

testReclaim();
