"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { ethers } from "ethers";

// Polygon Amoy Testnet Configuration
const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x13882", // hex of 80002 (Polygon Amoy)
    rpcTarget: "https://rpc-amoy.polygon.technology/",
    displayName: "Polygon Amoy Testnet",
    blockExplorerUrl: "https://amoy.polygonscan.com",
    ticker: "MATIC",
    tickerName: "Polygon Ecosystem Token",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
};

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;

const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig },
});

const web3auth = clientId
    ? new Web3Auth({
        clientId,
        web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
        privateKeyProvider,
    })
    : null;

export const Web3AuthContext = createContext({
    web3auth: null,
    provider: null,
    ethersProvider: null,
    login: async () => { },
    logout: async () => { },
    address: "",
    isConnected: false,
});

export const useWeb3Auth = () => useContext(Web3AuthContext);

// Proves wallet ownership to the API: reuses a valid session cookie, otherwise signs a server nonce.
async function ensureApiSession(eip1193Provider) {
    const accounts = await eip1193Provider.request({ method: "eth_accounts" });
    const walletAddress = accounts?.[0]?.toLowerCase();
    if (!walletAddress) {
        throw new Error("No wallet account available");
    }

    const current = await fetch("/api/auth/session", { cache: "no-store" }).then((res) => res.json()).catch(() => null);
    if (current?.address === walletAddress) {
        return walletAddress;
    }

    const nonceRes = await fetch(`/api/auth/nonce?address=${walletAddress}`, { cache: "no-store" });
    const { message, error } = await nonceRes.json();
    if (!nonceRes.ok) {
        throw new Error(error || "Could not start sign-in");
    }

    const signer = await new ethers.BrowserProvider(eip1193Provider).getSigner();
    const signature = await signer.signMessage(message);

    const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
    });
    if (!sessionRes.ok) {
        const data = await sessionRes.json().catch(() => ({}));
        throw new Error(data.error || "Wallet sign-in failed");
    }

    return walletAddress;
}

export default function AuthProvider({ children }) {
    const [provider, setProvider] = useState(null);
    const [ethersProvider, setEthersProvider] = useState(null);
    const [address, setAddress] = useState("");
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                if (!web3auth) {
                    console.error("NEXT_PUBLIC_WEB3AUTH_CLIENT_ID is not configured.");
                    return;
                }

                await web3auth.initModal();
                setProvider(web3auth.provider);
                if (web3auth.connected && web3auth.provider) {
                    await ensureApiSession(web3auth.provider);
                    setEthersProvider(new ethers.BrowserProvider(web3auth.provider));
                    await getAccounts();
                    setIsConnected(true);
                }
            } catch (error) {
                console.error("Error initializing Web3Auth", error);
            }
        };
        init();
    }, []);

    const getAccounts = async () => {
        if (!web3auth) return;
        if (!web3auth.provider) return;
        try {
            // Using raw RPC call since we'll use ethers.js later
            const accounts = await web3auth.provider.request({
                method: "eth_accounts",
            });
            if (accounts && accounts.length > 0) {
                setAddress(accounts[0]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const login = async () => {
        try {
            if (!web3auth) {
                throw new Error("NEXT_PUBLIC_WEB3AUTH_CLIENT_ID is not configured.");
            }

            const web3authProvider = await web3auth.connect();
            // The app counts as connected only once the API session is in place, so pages never call it unauthenticated.
            await ensureApiSession(web3authProvider);
            setProvider(web3authProvider);
            setEthersProvider(new ethers.BrowserProvider(web3authProvider));
            await getAccounts();
            setIsConnected(true);
        } catch (error) {
            console.error("Error logging in", error);
            if (web3auth?.connected) {
                await web3auth.logout().catch(() => { });
            }
        }
    };

    const logout = async () => {
        try {
            if (!web3auth) {
                return;
            }

            await fetch("/api/auth/session", { method: "DELETE" }).catch(() => { });
            await web3auth.logout();
            setProvider(null);
            setEthersProvider(null);
            setAddress("");
            setIsConnected(false);
        } catch (error) {
            console.error("Error logging out", error);
        }
    };

    return (
        <Web3AuthContext.Provider
            value={{
                web3auth,
                provider,
                ethersProvider,
                login,
                logout,
                address,
                isConnected,
            }}
        >
            {children}
        </Web3AuthContext.Provider>
    );
}
