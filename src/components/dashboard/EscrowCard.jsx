import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEscrowContract } from "@/hooks/useEscrowContract";
import { Loader2, CheckCircle, ArrowRight, AlertTriangle, Clock3, ShieldAlert } from "lucide-react";

const STATUS_STYLES = {
    PENDING_ACCEPTANCE: "bg-amber-50 text-amber-700 border-amber-200",
    FUNDED: "bg-blue-50 text-blue-700 border-blue-200",
    ACTIVE: "bg-sky-50 text-sky-700 border-sky-200",
    SUBMITTED_FOR_REVIEW: "bg-violet-50 text-violet-700 border-violet-200",
    COMPLETED: "bg-green-50 text-green-700 border-green-200",
    DISPUTED: "bg-red-50 text-red-700 border-red-200",
    ABANDONED_BY_FREELANCER: "bg-rose-50 text-rose-700 border-rose-200",
    ABANDONED_BY_EMPLOYER: "bg-orange-50 text-orange-700 border-orange-200",
    CANCELLED: "bg-gray-100 text-gray-700 border-gray-200",
};

const STATUS_LABELS = {
    PENDING_ACCEPTANCE: "Pending Acceptance",
    FUNDED: "Funded",
    ACTIVE: "Active",
    SUBMITTED_FOR_REVIEW: "In Review",
    COMPLETED: "Completed",
    DISPUTED: "Disputed",
    ABANDONED_BY_FREELANCER: "Abandoned by Freelancer",
    ABANDONED_BY_EMPLOYER: "Abandoned by Employer",
    CANCELLED: "Cancelled",
};

export function EscrowCard({ job, onStatusChange }) {
    const { completeEscrowJob, isTxLoading } = useEscrowContract();
    const status = typeof job.status === "number"
        ? (job.status === 2 ? "COMPLETED" : "ACTIVE")
        : (job.status || "ACTIVE");
    const isActive = status === "ACTIVE";
    const isCompleted = status === "COMPLETED";
    const counterparty = job.isEmployer ? job.freelancerWalletAddress || job.freelancer : job.employerWalletAddress || job.employer;

    const handleReleaseFunds = async () => {
        const res = await completeEscrowJob(job.id, job.totalAmountMatic);
        if (res.success) {
            await onStatusChange?.(job.id, "COMPLETED");
        }
    };

    const handleStatusClick = async (nextStatus) => {
        await onStatusChange?.(job.id, nextStatus);
    };

    return (
        <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-500">ID: #{job.id}</span>
                        <Badge variant="outline" className={STATUS_STYLES[status] || STATUS_STYLES.ACTIVE}>
                            {STATUS_LABELS[status] || status}
                        </Badge>
                    </div>
                    
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">
                        {job.title || `Escrow Contract #${job.id}`}
                    </h2>

                    <h3 className="font-semibold text-gray-700 mt-1.5 text-sm">
                        {job.isEmployer ? "Hiring: " : "Working for: "} 
                        <span className="font-mono text-sm ml-1 text-gray-500 bg-gray-50 border px-2 py-0.5 rounded inline-block">
                            {counterparty}
                        </span>
                    </h3>

                    {job.description && (
                        <p className="text-sm mt-3 text-gray-600 line-clamp-2 pr-4">{job.description}</p>
                    )}
                    {job.outcomeNote && (
                        <p className="text-xs mt-3 text-gray-500 bg-gray-50 border rounded-lg px-3 py-2">
                            {job.outcomeNote}
                        </p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Total Value</p>
                    <p className="font-bold text-xl font-display">{job.totalAmountMatic || job.totalAmount} MATIC</p>
                </div>
            </div>

            <div className="border-t pt-4 mt-2 flex items-center justify-between">
                <div className="text-sm text-gray-600 flex flex-col">
                    <span className="text-xs text-gray-400 mb-0.5">Currently Locked in Escrow</span> 
                    <span className="font-semibold text-gray-900">{job.depositedAmountMatic || job.milestoneAmount} MATIC</span>
                </div>
                
                {job.isEmployer && isActive && (
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => handleStatusClick("DISPUTED")}
                            variant="outline"
                            size="sm"
                        >
                            <ShieldAlert className="h-4 w-4 mr-2" />
                            Raise Dispute
                        </Button>
                        <Button 
                            onClick={handleReleaseFunds} 
                            disabled={isTxLoading}
                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all"
                            size="sm"
                        >
                            {isTxLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            {isTxLoading ? "Releasing..." : "Release Remaining 50%"}
                        </Button>
                    </div>
                )}

                {job.isEmployer && status === "FUNDED" && (
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md flex items-center gap-2 border border-blue-100">
                            <Clock3 className="h-3.5 w-3.5" /> Awaiting Freelancer Acceptance
                        </div>
                        <Button onClick={() => handleStatusClick("ABANDONED_BY_FREELANCER")} variant="outline" size="sm">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Report No-Show
                        </Button>
                    </div>
                )}

                {!job.isEmployer && status === "FUNDED" && (
                    <div className="flex items-center gap-2">
                        <Button onClick={() => handleStatusClick("ACTIVE")} size="sm">
                            Accept Contract
                        </Button>
                        <Button onClick={() => handleStatusClick("CANCELLED")} variant="outline" size="sm">
                            Decline
                        </Button>
                    </div>
                )}
                
                {!job.isEmployer && isActive && (
                    <div className="flex items-center gap-2">
                        <Button onClick={() => handleStatusClick("SUBMITTED_FOR_REVIEW")} variant="outline" size="sm">
                            Submit for Review
                        </Button>
                        <Button onClick={() => handleStatusClick("ABANDONED_BY_EMPLOYER")} variant="outline" size="sm">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Report Employer Abandonment
                        </Button>
                    </div>
                )}

                {!job.isEmployer && status === "SUBMITTED_FOR_REVIEW" && (
                    <div className="text-sm font-medium bg-amber-50 text-amber-700 px-3 py-1.5 rounded-md flex items-center gap-2 border border-amber-100">
                        <Loader2 className="h-3.5 w-3.5 animate-spin"/> Awaiting Employer Approval
                    </div>
                )}
                
                {isCompleted && (
                    <div className="text-sm text-green-600 font-semibold flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                        Funds Successfully Transferred <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                )}

                {(status === "DISPUTED" || status.startsWith("ABANDONED")) && (
                    <div className="text-sm font-medium bg-red-50 text-red-700 px-3 py-1.5 rounded-md flex items-center gap-2 border border-red-100">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Visible on both trust profiles
                    </div>
                )}
            </div>
        </div>
    );
}
