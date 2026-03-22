import { useState } from 'react';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function ReclaimVerifyButton({ providerId, username: initialUsername, title, icon: Icon, onSuccess }) {
    const [requestUrl, setRequestUrl] = useState("");
    const [username, setUsername] = useState(initialUsername || "");
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [verified, setVerified] = useState(false);
    const [waitingForVerification, setWaitingForVerification] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const completeVerification = async (proof) => {
        console.log("Zero-Knowledge Proof Received!", proof);
        setStatusMessage("Proof received. Finalizing verification...");

        let verificationAccepted = true;
        if (onSuccess) {
            verificationAccepted = await onSuccess(proof);
        }

        if (verificationAccepted === false) {
            setWaitingForVerification(false);
            setStatusMessage("Verification proof was received, but backend confirmation failed.");
            return;
        }

        setVerified(true);
        setWaitingForVerification(false);
        setStatusMessage("");
        setOpen(false);
        setRequestUrl("");
    };

    const pollVerificationStatus = (reclaimClient, onVerified) => {
        const sessionId = reclaimClient.getSessionId();
        let attempts = 0;

        const intervalId = window.setInterval(async () => {
            attempts += 1;

            try {
                const response = await fetch(`/api/reclaim/status?sessionId=${encodeURIComponent(sessionId)}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.error || 'Failed to fetch Reclaim verification status');
                }

                const proofs = data?.session?.proofs;

                if (Array.isArray(proofs) && proofs.length > 0) {
                    window.clearInterval(intervalId);
                    void onVerified(proofs.length === 1 ? proofs[0] : proofs);
                    return;
                }

                if (attempts >= 40) {
                    window.clearInterval(intervalId);
                    setWaitingForVerification(false);
                    setStatusMessage('Verification timed out. Please try again.');
                }
            } catch (error) {
                console.error('Reclaim status polling failed:', error);
                window.clearInterval(intervalId);
                setWaitingForVerification(false);
                setStatusMessage('Unable to fetch verification status. Please try again.');
            }
        }, 3000);
    };

    const getVerificationReq = async () => {
        if (!username.trim()) {
            setStatusMessage('Enter your GitHub username to continue.');
            return;
        }

        setLoading(true);
        setRequestUrl("");
        setWaitingForVerification(false);
        setStatusMessage("");
        
        try {
            // Securely handshake with the backend to sign the request string without exposing app keys
            const res = await fetch('/api/reclaim/generate-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ providerId, username: username.trim() })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.details || data?.error || 'Failed to generate verification request');
            }
            
            if (data.requestUrl && data.reclaimClientJson) {
                const reclaimClient = await ReclaimProofRequest.fromJsonString(data.reclaimClientJson);
                let verificationHandled = false;
                const handleVerificationSuccess = (proof) => {
                    if (verificationHandled) {
                        return;
                    }

                    verificationHandled = true;
                    completeVerification(proof);
                };

                setRequestUrl(data.requestUrl);
                setWaitingForVerification(true);
                setStatusMessage('Scan the QR and complete GitHub verification in the Reclaim app. We will keep checking until it finishes.');
                pollVerificationStatus(reclaimClient, handleVerificationSuccess);

                await reclaimClient.startSession({
                    onSuccess: (proof) => {
                        void handleVerificationSuccess(proof);
                    },
                    onError: (error) => {
                        console.error('Zero-Knowledge Validation Failed:', error);
                        setWaitingForVerification(false);
                        setStatusMessage('Verification was interrupted. Please try again.');
                    }
                });
            } else {
                throw new Error('Verification request payload was incomplete');
            }
        } catch(e) {
            console.error("Verification Request Fault:", e);
            setWaitingForVerification(false);
            setStatusMessage(e.message || 'Failed to start verification.');
        } finally {
            setLoading(false);
        }
    };

    if (verified) {
        return (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold text-sm">{title} Verified! (Zero-Knowledge)</span>
            </div>
        );
    }

    return (
        <>
            <Button
                onClick={() => {
                    setOpen(true);
                    setStatusMessage("");
                }}
                variant="outline"
                className="flex items-center gap-2 bg-white hover:bg-slate-50 border-gray-200 text-gray-700 shadow-sm"
            >
                <Icon className="w-4 h-4 text-gray-600" /> {title}
            </Button>
            
            <Dialog open={open} onOpenChange={(nextOpen) => {
                if (!waitingForVerification) {
                    setOpen(nextOpen);
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            Strict Web2 Verification
                        </DialogTitle>
                        <DialogDescription>
                            Generate a Zero-Knowledge Proof mathematically guaranteeing your {title} statistics without giving TrustLayer your password.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex flex-col items-center justify-center p-6 space-y-6">
                        {!requestUrl && (
                            <div className="w-full space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">GitHub Username</label>
                                    <Input
                                        value={username}
                                        onChange={(event) => setUsername(event.target.value)}
                                        placeholder="Enter your GitHub username"
                                        disabled={loading || waitingForVerification}
                                    />
                                </div>
                                <Button
                                    onClick={getVerificationReq}
                                    disabled={loading || waitingForVerification || !username.trim()}
                                    className="w-full"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating QR...
                                        </>
                                    ) : (
                                        `Verify ${title}`
                                    )}
                                </Button>
                            </div>
                        )}

                        {loading && !requestUrl && (
                            <div className="flex flex-col items-center">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                                <p className="text-sm font-medium text-gray-500 animate-pulse">Requesting Cryptographic Signature...</p>
                            </div>
                        )}
                        
                        {requestUrl && (
                            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                                <p className="text-sm text-gray-600 mb-6 font-medium">
                                    Scan this QR Code with your mobile phone camera to securely prove your credentials locally via the Reclaim App!
                                </p>
                                <div className="bg-white p-5 rounded-2xl shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 mb-2">
                                    <QRCode value={requestUrl} size={200} />
                                </div>
                                <a 
                                    href={requestUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm mt-4 tracking-wide hover:underline decoration-blue-300 underline-offset-4"
                                >
                                    Or click here to open the physical link directly
                                </a>
                                <p className="text-xs text-gray-400 mt-6 max-w-[250px]">
                                    Your web browser will instantly unlock exactly when the app finishes the mathematical handshake.
                                </p>
                                {waitingForVerification && (
                                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 border border-blue-200">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Waiting for verification...
                                    </div>
                                )}
                            </div>
                        )}

                        {statusMessage && (
                            <p className="text-center text-sm text-gray-600">{statusMessage}</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
