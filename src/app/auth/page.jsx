"use client";

import { useWeb3Auth } from "@/components/AuthProvider";
import { Shield } from "lucide-react";

export default function AuthPage() {
    const { login, logout, isConnected, address } = useWeb3Auth();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="p-8 bg-white border rounded-lg shadow-md max-w-sm w-full text-center">
                <h1 className="text-2xl font-bold mb-4">Welcome to TrustLayer</h1>
                {isConnected ? (
                    <div>
                        <p className="mb-4 text-gray-700">Connected Wallet:</p>
                        <p className="mb-6 text-sm font-mono bg-gray-100 p-2 rounded break-all">{address}</p>
                        <button
                            onClick={logout}
                            className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 w-full"
                        >
                            Disconnect Output
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="mb-6 text-gray-500">Please sign in to continue</p>
                        <button
                            onClick={login}
                            className="px-4 py-2 text-white bg-primary rounded hover:bg-primary/90 w-full flex items-center justify-center gap-2"
                        >
                            <Shield className="h-4 w-4" />
                            Connect Web3 Identity
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
