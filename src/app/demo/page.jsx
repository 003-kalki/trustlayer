"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    Briefcase,
    CheckCircle,
    Clock3,
    FileText,
    Github,
    Info,
    RotateCcw,
    Shield,
    User,
    Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EscrowCard } from "@/components/dashboard/EscrowCard";

// Everything on this page is sample data held in React state. Nothing touches the wallet,
// the database or the blockchain, so anyone can explore the dashboard without logging in.

const DEMO_EMPLOYER = "0x7a3f9c2e81b4d6f05e9a1c3b7d2e4f6a8b0c1d2e";
const DEMO_FREELANCER = "0x4e8b1d7c3a9f2e6b5d0c8a1f7e3b9d2c6a4f8e1b";

const SAMPLE_CONTRACTS = [
    {
        id: "12",
        title: "Landing page redesign",
        description: "Responsive redesign of a SaaS landing page in Next.js and Tailwind, delivered as a GitHub PR.",
        totalAmountMatic: "0.8",
        depositedAmountMatic: "0.4",
        status: "FUNDED",
    },
    {
        id: "11",
        title: "Discord moderation bot",
        description: "Bot with anti-spam filters, role sync and a weekly activity report for a 5k-member server.",
        totalAmountMatic: "1.2",
        depositedAmountMatic: "0.6",
        status: "ACTIVE",
    },
    {
        id: "10",
        title: "Smart contract review notes",
        description: "Line-by-line review of an ERC-20 vesting contract with a short findings report.",
        totalAmountMatic: "2.0",
        depositedAmountMatic: "1.0",
        status: "SUBMITTED_FOR_REVIEW",
    },
    {
        id: "9",
        title: "Logo and brand kit",
        description: "Logo, colour palette and social banners for a Web3 community project.",
        totalAmountMatic: "0.5",
        depositedAmountMatic: "0",
        status: "COMPLETED",
        outcomeNote: "Delivered on time. Employer released the remaining 50%; the contract paid 100% to the freelancer.",
    },
    {
        id: "8",
        title: "NFT art commission",
        description: "Set of 10 character illustrations in a pixel-art style.",
        totalAmountMatic: "1.5",
        depositedAmountMatic: "0.75",
        status: "DISPUTED",
        outcomeNote: "Employer raised a dispute: final art did not match the agreed style guide.",
    },
    {
        id: "7",
        title: "Data scraping script",
        description: "Python script to collect public product listings into a CSV.",
        totalAmountMatic: "0.6",
        depositedAmountMatic: "0",
        status: "CANCELLED",
        outcomeNote: "Freelancer declined. refundJob() returned the 0.3 MATIC deposit to the employer.",
    },
];

const PENDING = new Set(["FUNDED", "PENDING_ACCEPTANCE"]);
const ACTIVE = new Set(["ACTIVE", "SUBMITTED_FOR_REVIEW"]);

// What the real app does at each step, shown after every demo action.
const STEP_EXPLANATIONS = {
    ACTIVE: "Freelancer accepted. The 50% deposit stays locked in the escrow contract while the work happens.",
    CANCELLED: "Freelancer declined. In the real app this calls refundJob() and the contract returns the 50% deposit to the employer.",
    SUBMITTED_FOR_REVIEW: "Work submitted. The employer now reviews it and either releases payment or raises a dispute.",
    COMPLETED: "Employer approved. In the real app completeJob() takes the remaining 50% and the contract pays 100% to the freelancer.",
    DISPUTED: "Dispute raised. The outcome is recorded on both trust profiles so future counterparties can see it.",
    ABANDONED_BY_FREELANCER: "Recorded as abandoned by the freelancer. If the freelancer withdrew, refundJob() returned the employer's deposit.",
    ABANDONED_BY_EMPLOYER: "Recorded as abandoned by the employer. This now shows on the employer's trust history.",
};

const STATUS_NOTES = {
    COMPLETED: "Employer released the remaining 50%; the contract paid 100% to the freelancer.",
    CANCELLED: "Freelancer declined; the deposit was refunded to the employer.",
    DISPUTED: "Dispute raised by the employer.",
    ABANDONED_BY_FREELANCER: "Marked as abandoned by the freelancer.",
    ABANDONED_BY_EMPLOYER: "Reported as abandoned by the employer.",
};

function StatCard({ icon: Icon, label, value, tone = "default" }) {
    const tones = {
        default: "bg-white border",
        success: "bg-green-50 border-green-200",
        warning: "bg-amber-50 border-amber-200",
        danger: "bg-red-50 border-red-200",
    };

    return (
        <div className={`rounded-2xl p-5 shadow-sm ${tones[tone] || tones.default}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{label}</span>
                <Icon className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
    );
}

function Section({ icon: Icon, title, subtitle, emptyText, jobs, onStatusChange }) {
    return (
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <div className="mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Icon className="h-5 w-5 text-gray-500" />
                    {title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            </div>
            {jobs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-sm text-gray-500">
                    {emptyText}
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.map((job) => (
                        <EscrowCard key={job.id} job={job} onStatusChange={onStatusChange} demoMode />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function DemoPage() {
    const [role, setRole] = useState("EMPLOYER");
    const [contracts, setContracts] = useState(SAMPLE_CONTRACTS);
    const [lastAction, setLastAction] = useState(null);

    const isEmployer = role === "EMPLOYER";
    const viewer = isEmployer
        ? { name: "Aarav (Employer)", handle: "@aarav.builds", address: DEMO_EMPLOYER }
        : { name: "Meera (Freelancer)", handle: "@meera.dev", address: DEMO_FREELANCER };

    const jobs = useMemo(
        () =>
            contracts.map((contract) => ({
                ...contract,
                isEmployer,
                employer: DEMO_EMPLOYER,
                freelancer: DEMO_FREELANCER,
            })),
        [contracts, isEmployer]
    );

    const stats = {
        total: jobs.length,
        completed: jobs.filter((job) => job.status === "COMPLETED").length,
        abandonedByYou: jobs.filter((job) => job.status === (isEmployer ? "ABANDONED_BY_EMPLOYER" : "ABANDONED_BY_FREELANCER")).length,
        disputes: jobs.filter((job) => job.status === "DISPUTED").length,
    };

    const handleStatusChange = (jobId, nextStatus) => {
        setContracts((prev) =>
            prev.map((contract) => {
                if (contract.id !== jobId) return contract;
                const refunded = nextStatus === "CANCELLED" || nextStatus === "ABANDONED_BY_FREELANCER";
                return {
                    ...contract,
                    status: nextStatus,
                    depositedAmountMatic: nextStatus === "COMPLETED" || refunded ? "0" : contract.depositedAmountMatic,
                    outcomeNote: STATUS_NOTES[nextStatus] || contract.outcomeNote,
                };
            })
        );
        const job = contracts.find((contract) => contract.id === jobId);
        setLastAction({ title: job?.title, message: STEP_EXPLANATIONS[nextStatus] || `Status changed to ${nextStatus}.` });
    };

    const handleReset = () => {
        setContracts(SAMPLE_CONTRACTS);
        setLastAction(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-6xl space-y-6">
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 mt-0.5 shrink-0" />
                        <p>
                            <span className="font-semibold">Demo mode.</span> This is the real TrustLayer dashboard filled with sample data, so you can
                            explore it without logging in. Switch sides and click the buttons on any contract to walk through the escrow flow. No wallet,
                            real money or blockchain is involved here.
                        </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={handleReset}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset demo
                        </Button>
                        <Link href="/how-it-works">
                            <Button size="sm">How it works</Button>
                        </Link>
                    </div>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">TrustLayer Workspace</h1>
                        <p className="text-gray-500">Build trust before the work starts, then keep a fair record of what actually happened for both sides.</p>
                    </div>
                    <div className="inline-flex rounded-lg border bg-white p-1 shadow-sm w-fit" role="tablist" aria-label="View the demo as">
                        {["EMPLOYER", "FREELANCER"].map((option) => (
                            <button
                                key={option}
                                type="button"
                                role="tab"
                                aria-selected={role === option}
                                onClick={() => setRole(option)}
                                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                                    role === option ? "bg-primary text-primary-foreground" : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                View as {option === "EMPLOYER" ? "Employer" : "Freelancer"}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {lastAction && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        <span className="font-semibold">{lastAction.title}:</span> {lastAction.message}
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={FileText} label="Total contracts" value={stats.total} />
                    <StatCard icon={CheckCircle} label="Completed" value={stats.completed} tone="success" />
                    <StatCard icon={AlertTriangle} label="Abandoned by you" value={stats.abandonedByYou} tone="danger" />
                    <StatCard icon={Shield} label="Disputes" value={stats.disputes} tone="warning" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-semibold text-lg">{viewer.name}</h2>
                                    <p className="text-sm text-gray-500">{viewer.handle}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs bg-gray-50 px-3 py-1.5 rounded-md border w-fit">
                                <Wallet className="h-3 w-3 text-primary" />
                                <span className="font-mono text-gray-700">
                                    {viewer.address.substring(0, 8)}...{viewer.address.substring(viewer.address.length - 6)}
                                </span>
                            </div>
                            <p className="mt-3 text-xs text-gray-500">
                                In the real app this wallet is created by Web3Auth when you sign in with Google. No seed phrase needed.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Verified Credentials</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Github className="h-4 w-4" />
                                        GitHub Commits
                                    </div>
                                    {isEmployer ? (
                                        <span className="text-xs text-gray-400">Not verified</span>
                                    ) : (
                                        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                                            <CheckCircle className="h-3 w-3" />
                                            <span className="text-xs font-semibold">Verified</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Briefcase className="h-4 w-4" />
                                        Privacy Mode
                                    </div>
                                    <div className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded border text-gray-700">Selective disclosure</div>
                                </div>
                            </div>
                            <p className="mt-4 text-xs text-gray-500">
                                GitHub activity is proven with Reclaim Protocol: the freelancer shows a verified proof instead of sharing account access.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">How the escrow works</h3>
                            <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
                                <li>Employer deposits 50% into the smart contract.</li>
                                <li>Freelancer accepts and does the work.</li>
                                <li>Employer pays the other 50%; the contract sends 100% to the freelancer.</li>
                                <li>If the freelancer declines, only they can refund the deposit.</li>
                            </ol>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <Section
                            icon={Clock3}
                            title="Pending Contract Requests"
                            subtitle="Funded offers wait here until the freelancer accepts or one side records a problem."
                            emptyText="No pending requests. Reset the demo to start over."
                            jobs={jobs.filter((job) => PENDING.has(job.status))}
                            onStatusChange={handleStatusChange}
                        />
                        <Section
                            icon={Shield}
                            title="Active Contracts"
                            subtitle="These contracts are in progress, in review, or waiting for the next action."
                            emptyText="No active contracts right now."
                            jobs={jobs.filter((job) => ACTIVE.has(job.status))}
                            onStatusChange={handleStatusChange}
                        />
                        <Section
                            icon={FileText}
                            title="Trust History"
                            subtitle="Completed, disputed, and abandoned contracts stay visible to future counterparties."
                            emptyText="No history yet."
                            jobs={jobs.filter((job) => !PENDING.has(job.status) && !ACTIVE.has(job.status))}
                            onStatusChange={handleStatusChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
