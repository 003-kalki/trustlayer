export const CHAIN_JOB_STATUS = {
  DRAFT: 0,
  ACTIVE: 1,
  COMPLETED: 2,
  DISPUTED: 3,
};

export function getEscrowBreakdown(totalAmount) {
  const normalized = Number(totalAmount || 0);
  const depositAmount = normalized / 2;

  return {
    totalAmount: normalized,
    depositAmount,
    remainingAmount: normalized - depositAmount,
  };
}

export function normalizeChainStatus(status) {
  if (typeof status === "string") {
    return status;
  }

  switch (Number(status)) {
    case CHAIN_JOB_STATUS.COMPLETED:
      return "COMPLETED";
    case CHAIN_JOB_STATUS.DISPUTED:
      return "DISPUTED";
    case CHAIN_JOB_STATUS.ACTIVE:
    default:
      return "ACTIVE";
  }
}

export function normalizeChainJob(job = {}) {
  return {
    ...job,
    id: job.id?.toString?.() || job.id,
    status: normalizeChainStatus(job.status),
    totalAmountMatic: Number(job.totalAmountMatic || 0),
    depositedAmountMatic: Number(job.depositedAmountMatic || 0),
  };
}

export function getStatusTone(status) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "DISPUTED":
    case "ABANDONED_BY_EMPLOYER":
    case "ABANDONED_BY_FREELANCER":
      return "danger";
    case "FUNDED":
    case "PENDING_ACCEPTANCE":
    case "SUBMITTED_FOR_REVIEW":
      return "warning";
    default:
      return "default";
  }
}
