"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEscrowContract } from "@/hooks/useEscrowContract";
import { FileText, Loader2, AlertCircle } from "lucide-react";

export function CreateEscrowModal({ currentUserAddress }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [freelancerAddress, setFreelancerAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [syncError, setSyncError] = useState("");
    const { createEscrowJob, isTxLoading, txError } = useEscrowContract();

    const handleCreate = async () => {
        if (!freelancerAddress || !amount || !title || isTxLoading) return;
        setSyncError("");
        
        const result = await createEscrowJob(freelancerAddress, amount);
        
        if (result.success && result.jobId) {
            // Securely POST the large text fields exclusively to MariaDB Database using the generated Web3 ID
            try {
                const response = await fetch('/api/contracts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        web3JobId: result.jobId,
                        title,
                        description,
                        employerAddress: currentUserAddress,
                        freelancerAddress,
                        totalAmount: amount,
                        milestoneAmount: Number(amount) / 2
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || "Contract created on-chain, but TrustLayer could not sync it to the dashboard.");
                }
            } catch (err) {
                console.error("Failed syncing JSON Web2 payload:", err);
                setSyncError(err.message || "Contract created on-chain, but metadata sync failed.");
                return;
            }
            
            setOpen(false);
            setTitle("");
            setDescription("");
            setFreelancerAddress("");
            setAmount("");
            setSyncError("");
            // Refresh to trigger re-reads of blockchain data eventually
            window.location.reload(); 
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gray-900 text-white hover:bg-gray-800">
                    + New Contract
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Initiate Escrow Contract
                    </DialogTitle>
                    <DialogDescription>
                        Create a trust-backed contract offer. TrustLayer will fund the first 50% in escrow and send the request to the freelancer for acceptance.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto pr-2">
                    
                    <div className="space-y-1">
                        <Label htmlFor="title">Job Title</Label>
                        <Input 
                            id="title" 
                            placeholder="e.g. Build Web3 Landing Page" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isTxLoading}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="desc">Job Description (Metadata)</Label>
                        <Input 
                            id="desc" 
                            placeholder="Design and code the hero section..." 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isTxLoading}
                        />
                            <p className="text-[10px] text-gray-400">Only the contract summary is stored here so you do not need to overshare resumes or portfolios in chat.</p>
                    </div>

                    <div className="space-y-1 mt-2">
                        <Label htmlFor="address">Freelancer Wallet Address</Label>
                        <Input 
                            id="address" 
                            placeholder="0x..." 
                            value={freelancerAddress}
                            onChange={(e) => setFreelancerAddress(e.target.value)}
                            disabled={isTxLoading}
                        />
                        <p className="text-[10px] text-gray-500">The 0x Polygon Amoy address of the assigned worker.</p>
                    </div>
                    
                    <div className="space-y-1 mt-2">
                        <Label htmlFor="amount">Total Project Value (MATIC)</Label>
                        <Input 
                            id="amount" 
                            type="number" 
                            placeholder="0.00" 
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={isTxLoading}
                        />
                    </div>

                    {amount && !isNaN(amount) && Number(amount) > 0 && (
                        <div className="bg-primary/5 p-3 rounded-md border border-primary/20 mt-2">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-gray-600">Total Value:</span>
                                <span>{amount} MATIC</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-semibold border-t pt-1 border-primary/10">
                                <span className="text-primary">Required Deposit (50%):</span>
                                <span className="text-primary">{(Number(amount) / 2).toFixed(4)} MATIC</span>
                            </div>
                        </div>
                    )}

                    {txError && (
                        <div className="bg-red-50 text-red-600 text-xs p-3 rounded-md border border-red-200 flex items-start gap-2 max-h-24 overflow-y-auto">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span className="break-all">{txError}</span>
                        </div>
                    )}

                    {syncError && (
                        <div className="bg-amber-50 text-amber-700 text-xs p-3 rounded-md border border-amber-200 flex items-start gap-2 max-h-24 overflow-y-auto">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span className="break-all">{syncError}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isTxLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!freelancerAddress || !amount || isTxLoading} className="min-w-[120px]">
                        {isTxLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deploying...
                            </>
                        ) : (
                            "Fund & Send Offer"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
