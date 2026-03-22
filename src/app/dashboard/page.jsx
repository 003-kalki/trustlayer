"use client";

import { useEffect, useMemo, useState } from "react";
import { useWeb3Auth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Briefcase,
    CheckCircle,
    Clock3,
    Copy,
    FileText,
    Github,
    Shield,
    User,
    Wallet,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CreateEscrowModal } from "@/components/dashboard/CreateEscrowModal";
import { ReclaimVerifyButton } from "@/components/dashboard/ReclaimVerifyButton";
import { EscrowCard } from "@/components/dashboard/EscrowCard";
import { useEscrowContract } from "@/hooks/useEscrowContract";

const GITHUB_RECLAIM_PROVIDER_ID = "8573efb4-4529-47d3-80da-eaa7384dac19";
const ACTIVE_STATUSES = new Set(["FUNDED", "ACTIVE", "SUBMITTED_FOR_REVIEW", "PENDING_ACCEPTANCE"]);
const HISTORY_STATUSES = new Set(["COMPLETED", "DISPUTED", "ABANDONED_BY_EMPLOYER", "ABANDONED_BY_FREELANCER", "CANCELLED"]);

const DEFAULT_PROFILE_FORM = {
    handle: "",
    displayName: "",
    bio: "",
    role: "BOTH",
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

export default function DashboardPage() {
    const { isConnected, address } = useWeb3Auth();
    const router = useRouter();
    const { getUserJobs } = useEscrowContract();
    const [profileData, setProfileData] = useState(null);
    const [profileForm, setProfileForm] = useState(DEFAULT_PROFILE_FORM);
    const [contracts, setContracts] = useState([]);
    const [onChainJobs, setOnChainJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [statusUpdatingId, setStatusUpdatingId] = useState(null);
    const [profileFeedback, setProfileFeedback] = useState(null);
    const [copyFeedback, setCopyFeedback] = useState("");

    const hydrateData = async () => {
        if (!address) {
            return;
        }

        setLoading(true);

        try {
            const profileResponse = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress: address }),
            });

            if (profileResponse.ok) {
                const data = await profileResponse.json();
                setProfileData(data.user);
                setProfileForm({
                    handle: data.user?.profile?.handle || "",
                    displayName: data.user?.profile?.displayName || "",
                    bio: data.user?.profile?.bio || "",
                    role: data.user?.profile?.role || "BOTH",
                });
            }

            const [contractsResponse, jobs] = await Promise.all([
                fetch(`/api/contracts?walletAddress=${address}`),
                getUserJobs(address),
            ]);

            setOnChainJobs(jobs);

            if (contractsResponse.ok) {
                const data = await contractsResponse.json();
                setContracts(data.contracts || []);
            } else {
                setContracts([]);
            }
        } catch (error) {
            console.error("Failed to hydrate dashboard", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isConnected) {
            router.push("/");
            return;
        }

        hydrateData();
    }, [isConnected, address, router]);

    const mergedContracts = useMemo(() => {
        const chainMap = new Map(onChainJobs.map((job) => [job.id?.toString(), job]));
        const merged = contracts.map((contract) => {
            const chainJob = chainMap.get(contract.web3JobId?.toString());
            return {
                ...contract,
                id: contract.web3JobId || contract.id,
                totalAmountMatic: chainJob?.totalAmountMatic || contract.totalAmount,
                depositedAmountMatic: chainJob?.depositedAmountMatic || contract.milestoneAmount,
                employer: chainJob?.employer || contract.employerWalletAddress,
                freelancer: chainJob?.freelancer || contract.freelancerWalletAddress,
            };
        });

        const knownIds = new Set(merged.map((contract) => contract.web3JobId?.toString() || contract.id?.toString()));
        const chainOnly = onChainJobs
            .filter((job) => !knownIds.has(job.id?.toString()))
            .map((job) => ({
                id: job.id?.toString(),
                web3JobId: job.id?.toString(),
                title: `Escrow Contract #${job.id}`,
                description: "On-chain contract found, but dashboard metadata has not synced yet.",
                totalAmount: Number(job.totalAmountMatic),
                milestoneAmount: Number(job.depositedAmountMatic),
                totalAmountMatic: job.totalAmountMatic,
                depositedAmountMatic: job.depositedAmountMatic,
                status: typeof job.status === "number"
                    ? (job.status === 2 ? "COMPLETED" : job.status === 3 ? "DISPUTED" : "ACTIVE")
                    : job.status,
                employerWalletAddress: job.employer,
                freelancerWalletAddress: job.freelancer,
                employer: job.employer,
                freelancer: job.freelancer,
                isEmployer: job.isEmployer,
            }));

        return [...merged, ...chainOnly];
    }, [contracts, onChainJobs]);

    const pendingContracts = mergedContracts.filter((contract) => contract.status === "FUNDED" || contract.status === "PENDING_ACCEPTANCE");
    const activeContracts = mergedContracts.filter((contract) => ACTIVE_STATUSES.has(contract.status) && contract.status !== "FUNDED" && contract.status !== "PENDING_ACCEPTANCE");
    const historyContracts = mergedContracts.filter((contract) => HISTORY_STATUSES.has(contract.status));

    const handleGithubVerified = async (proofs) => {
        try {
            const res = await fetch("/api/profile/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress: address, type: "github", proofs }),
            });

            if (res.ok) {
                setProfileData((prev) => ({
                    ...prev,
                    profile: {
                        ...prev.profile,
                        githubVerified: true,
                    },
                }));
                return true;
            }
        } catch (error) {
            console.error("GitHub verification update failed", error);
        }

        return false;
    };

    const handleProfileSave = async () => {
        setSavingProfile(true);
        setProfileFeedback(null);

        try {
            const response = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress: address,
                    ...profileForm,
                    privacyMode: "SELECTIVE",
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setProfileData(data.user);
                setProfileForm({
                    handle: data.user?.profile?.handle || "",
                    displayName: data.user?.profile?.displayName || "",
                    bio: data.user?.profile?.bio || "",
                    role: data.user?.profile?.role || "BOTH",
                });
                setProfileFeedback({ type: "success", message: "Trust profile saved." });
            } else {
                const errorData = await response.json().catch(() => ({}));
                setProfileFeedback({
                    type: "error",
                    message: errorData.error || "Profile could not be saved.",
                });
            }
        } catch (error) {
            console.error("Failed to save profile", error);
            setProfileFeedback({
                type: "error",
                message: "Profile could not be saved. If the new columns are not migrated yet, only the older fields will work.",
            });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleStatusChange = async (contractWeb3Id, nextStatus) => {
        const target = contracts.find((contract) => (contract.web3JobId || contract.id) === contractWeb3Id);
        if (!target) {
            return;
        }

        setStatusUpdatingId(contractWeb3Id);

        try {
            const response = await fetch("/api/contracts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contractId: target.id,
                    walletAddress: address,
                    status: nextStatus,
                }),
            });

            if (response.ok) {
                await hydrateData();
            }
        } catch (error) {
            console.error("Failed to update contract state", error);
        } finally {
            setStatusUpdatingId(null);
        }
    };

    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(address);
            setCopyFeedback("Copied");
            window.setTimeout(() => setCopyFeedback(""), 2000);
        } catch (error) {
            console.error("Failed to copy address", error);
            setCopyFeedback("Copy failed");
            window.setTimeout(() => setCopyFeedback(""), 2000);
        }
    };

    if (!isConnected || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-6xl space-y-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">TrustLayer Workspace</h1>
                    <p className="text-gray-500">Build trust before the work starts, then keep a fair record of what actually happened for both sides.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard icon={FileText} label="Total contracts" value={profileData?.trustStats?.totalContracts || 0} />
                    <StatCard icon={CheckCircle} label="Completed" value={profileData?.trustStats?.completedContracts || 0} tone="success" />
                    <StatCard icon={AlertTriangle} label="Abandoned by you" value={profileData?.trustStats?.abandonedByUser || 0} tone="danger" />
                    <StatCard icon={Shield} label="Disputes" value={profileData?.trustStats?.disputedContracts || 0} tone="warning" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-lg">
                                        {profileData?.profile?.displayName || profileData?.profile?.handle || "Anonymous User"}
                                    </h2>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 bg-gray-50 px-3 py-1.5 rounded-md border w-fit">
                                        <Wallet className="h-3 w-3 text-primary" />
                                        <span className="font-mono text-gray-700">
                                            {address.substring(0, 8)}...{address.substring(address.length - 6)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleCopyAddress}
                                            className="inline-flex items-center justify-center rounded p-1 text-gray-500 hover:text-gray-900"
                                            aria-label="Copy TrustLayer wallet address"
                                            title="Copy TrustLayer wallet address"
                                        >
                                            <Copy className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        TrustLayer wallet for contracts and escrow.
                                        {copyFeedback ? ` ${copyFeedback}.` : ""}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <Input
                                        id="displayName"
                                        value={profileForm.displayName}
                                        onChange={(event) => setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))}
                                        placeholder="How should people know you?"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="handle">TrustLayer Handle</Label>
                                    <Input
                                        id="handle"
                                        value={profileForm.handle}
                                        onChange={(event) => setProfileForm((prev) => ({ ...prev, handle: event.target.value }))}
                                        placeholder="@your-handle"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="role">Primary Role</Label>
                                    <select
                                        id="role"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={profileForm.role}
                                        onChange={(event) => setProfileForm((prev) => ({ ...prev, role: event.target.value }))}
                                    >
                                        <option value="FREELANCER">Freelancer</option>
                                        <option value="EMPLOYER">Employer</option>
                                        <option value="BOTH">Both</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="bio">Short Bio</Label>
                                    <Textarea
                                        id="bio"
                                        value={profileForm.bio}
                                        onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))}
                                        placeholder="Keep it compact. Share only what a counterparty needs to trust you."
                                        rows={4}
                                    />
                                </div>
                                <Button onClick={handleProfileSave} disabled={savingProfile} className="w-full">
                                    {savingProfile ? "Saving..." : "Save Trust Profile"}
                                </Button>
                                {profileFeedback && (
                                    <p className={`text-sm ${profileFeedback.type === "success" ? "text-green-600" : "text-red-600"}`}>
                                        {profileFeedback.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Verified Credentials</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Github className="h-4 w-4" />
                                        GitHub Commits
                                    </div>
                                    {profileData?.profile?.githubVerified ? (
                                        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                                            <CheckCircle className="h-3 w-3" />
                                            <span className="text-xs font-semibold">Verified</span>
                                        </div>
                                    ) : (
                                        <ReclaimVerifyButton
                                            title="Github"
                                            icon={Github}
                                            providerId={GITHUB_RECLAIM_PROVIDER_ID}
                                            onSuccess={handleGithubVerified}
                                        />
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Briefcase className="h-4 w-4" />
                                        Privacy Mode
                                    </div>
                                    <div className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded border text-gray-700">
                                        Selective disclosure
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Clock3 className="h-5 w-5 text-gray-500" />
                                        Pending Contract Requests
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">Funded offers wait here until the freelancer accepts or one side records a problem.</p>
                                </div>
                                <CreateEscrowModal currentUserAddress={address} />
                            </div>

                            {pendingContracts.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <Clock3 className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 font-medium">No pending contract requests</p>
                                    <p className="text-sm text-gray-400 mt-1">Start with a funded offer so both sides have a clear paper trail from day one.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingContracts.map((job) => (
                                        <div key={job.id} className={statusUpdatingId === job.id ? "opacity-60 pointer-events-none" : ""}>
                                            <EscrowCard job={job} onStatusChange={handleStatusChange} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-gray-500" />
                                        Active Contracts
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">These contracts are in progress, in review, or waiting for the next action.</p>
                                </div>
                            </div>

                            {activeContracts.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <Shield className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 font-medium">No active contracts yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Accepted deals move here and become part of each side's visible trust record.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activeContracts.map((job) => (
                                        <div key={job.id} className={statusUpdatingId === job.id ? "opacity-60 pointer-events-none" : ""}>
                                            <EscrowCard job={job} onStatusChange={handleStatusChange} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-gray-500" />
                                        Trust History
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">Completed, disputed, and abandoned contracts should all remain visible to future counterparties.</p>
                                </div>
                            </div>

                            {historyContracts.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 font-medium">No history yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Once contracts finish or fail, they become portable trust evidence here.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {historyContracts.map((job) => (
                                        <EscrowCard key={job.id} job={job} onStatusChange={handleStatusChange} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
