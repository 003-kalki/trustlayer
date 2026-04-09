import { shortenWalletAddress } from "@/services/auth";

export function getTrustTier(stats = {}) {
  const completedContracts = Number(stats.completedContracts || 0);
  const disputedContracts = Number(stats.disputedContracts || 0);

  if (completedContracts >= 10 && disputedContracts === 0) {
    return "Proven";
  }

  if (completedContracts >= 3) {
    return "Established";
  }

  if (completedContracts >= 1) {
    return "Emerging";
  }

  return "New";
}

export function buildPortableTrustRecord(user) {
  const profile = user?.profile || {};
  const trustStats = user?.trustStats || {};

  return {
    identity: {
      walletAddress: user?.walletAddress || "",
      shortAddress: shortenWalletAddress(user?.walletAddress || ""),
      handle: profile.handle || null,
      displayName: profile.displayName || "Anonymous User",
      role: profile.role || "BOTH",
      privacyMode: profile.privacyMode || "SELECTIVE",
    },
    credentials: [
      {
        id: "github",
        label: "GitHub activity proof",
        verified: Boolean(profile.githubVerified),
        visibility: "Selective disclosure",
      },
      {
        id: "upwork",
        label: "Marketplace credential slot",
        verified: Boolean(profile.upworkVerified),
        visibility: "Future integration",
      },
    ],
    stats: {
      totalContracts: Number(trustStats.totalContracts || 0),
      activeContracts: Number(trustStats.activeContracts || 0),
      completedContracts: Number(trustStats.completedContracts || 0),
      disputedContracts: Number(trustStats.disputedContracts || 0),
      abandonedByUser: Number(trustStats.abandonedByUser || 0),
      abandonedByCounterparty: Number(trustStats.abandonedByCounterparty || 0),
      trustTier: getTrustTier(trustStats),
    },
  };
}

export function getCredentialCompletion(record) {
  const credentials = record?.credentials || [];
  const verifiedCount = credentials.filter((item) => item.verified).length;

  return {
    verifiedCount,
    total: credentials.length,
    percent: credentials.length === 0 ? 0 : Math.round((verifiedCount / credentials.length) * 100),
  };
}
