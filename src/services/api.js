const JSON_HEADERS = {
  "Content-Type": "application/json",
};

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiRequest(path, options = {}) {
  const { body, headers, ...init } = options;

  const response = await fetch(path, {
    headers: {
      ...JSON_HEADERS,
      ...headers,
    },
    cache: "no-store",
    ...init,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const profileApi = {
  get(walletAddress) {
    return apiRequest(`/api/profile?walletAddress=${encodeURIComponent(walletAddress)}`, {
      method: "GET",
    });
  },
  upsert(walletAddress) {
    return apiRequest("/api/profile", {
      method: "POST",
      body: { walletAddress },
    });
  },
  update(payload) {
    return apiRequest("/api/profile", {
      method: "PATCH",
      body: payload,
    });
  },
  verifyCredential(payload) {
    return apiRequest("/api/profile/verify", {
      method: "POST",
      body: payload,
    });
  },
};

export const contractApi = {
  listByWallet(walletAddress) {
    return apiRequest(`/api/contracts?walletAddress=${encodeURIComponent(walletAddress)}`, {
      method: "GET",
    });
  },
  listByJobIds(jobIds = []) {
    const query = jobIds.map((id) => id.toString()).join(",");
    return apiRequest(`/api/contracts?jobIds=${encodeURIComponent(query)}`, {
      method: "GET",
    });
  },
  create(payload) {
    return apiRequest("/api/contracts", {
      method: "POST",
      body: payload,
    });
  },
  updateStatus(payload) {
    return apiRequest("/api/contracts", {
      method: "PATCH",
      body: payload,
    });
  },
};

export const reclaimApi = {
  generateConfig(payload) {
    return apiRequest("/api/reclaim/generate-config", {
      method: "POST",
      body: payload,
    });
  },
  getStatus(sessionId) {
    return apiRequest(`/api/reclaim/status?sessionId=${encodeURIComponent(sessionId)}`, {
      method: "GET",
    });
  },
};
