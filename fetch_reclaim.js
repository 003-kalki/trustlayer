import https from 'https';

https.get('https://api.reclaimprotocol.org/api/providers/8573efb4-4529-47d3-80da-eaa7384dac19', (resp) => {
  let data = '';
  resp.on('data', (chunk) => data += chunk);
  resp.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.provider && parsed.provider.httpProviderId) {
          const templates = parsed.provider.httpProviderId.filter(p => p.urlType === "TEMPLATE");
          console.log("Template URLs found:", templates.length);
          templates.forEach(t => {
            console.log("\nURL:", t.url);
            const matches = t.url.match(/{{(.*?)}}/g);
            console.log("Required Params:", matches ? matches : "None (Static URL)");
          });
      }
    } catch(e) {
      console.log("Failed to parse Reclaim JSON:", e.message);
    }
  });
});
