"use client";

import { useEffect, useState } from "react";
import { useWeb3Auth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, User, Wallet, FileText, CheckCircle, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const { isConnected, address } = useWeb3Auth();
    const router = useRouter();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isConnected) {
            router.push("/");
            return;
        }

        const fetchProfile = async () => {
            try {
                // Upsert the user into MariaDB
                const response = await fetch("/api/profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ walletAddress: address }),
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setProfileData(data.user);
                }
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [isConnected, address, router]);

    if (!isConnected || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-5xl">
                
                {/* Header Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Welcome Back</h1>
                    <p className="text-gray-500">Manage your Escrow Contracts and Decentralized Identity.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Left Column: Identity Card */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="col-span-1"
                    >
                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-lg">{profileData?.profile?.handle || "Anonymous User"}</h2>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 bg-gray-50 px-3 py-1.5 rounded-md border w-fit">
                                        <Wallet className="h-3 w-3 text-primary" />
                                        <span className="font-mono text-gray-700">{address.substring(0, 8)}...{address.substring(address.length - 6)}</span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(address);
                                                const btn = document.getElementById('copy-icon');
                                                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>';
                                                setTimeout(() => {
                                                    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy text-gray-400 hover:text-gray-900"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
                                                }, 2000);
                                            }}
                                            className="ml-2 focus:outline-none transition-colors"
                                            id="copy-icon"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy text-gray-400 hover:text-gray-900"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <Button variant="outline" className="w-full mb-6 text-sm">
                                Edit Profile
                            </Button>

                            {/* ZKP Credentials */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Verified Credentials (ZKP)</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Github className="h-4 w-4" />
                                            GitHub Commits
                                        </div>
                                        {profileData?.profile?.githubVerified ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">Verify</Button>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Shield className="h-4 w-4" />
                                            Upwork Earnings
                                        </div>
                                        {profileData?.profile?.upworkVerified ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">Verify</Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Contracts */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="col-span-1 md:col-span-2 space-y-6"
                    >
                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-gray-500" />
                                    Active Escrow Contracts
                                </h2>
                                <Button className="bg-gray-900 text-white hover:bg-gray-800">
                                    + New Contract
                                </Button>
                            </div>

                            {(!profileData?.employerContracts?.length && !profileData?.freelancerContracts?.length) ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 font-medium">No active contracts</p>
                                    <p className="text-sm text-gray-400 mt-1">Send a TrustLayer link to initiate a new 50/50 escrow agreement.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Render actual contracts here in the future */}
                                </div>
                            )}
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
