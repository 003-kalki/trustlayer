"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

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

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "BPi5PB_UiIZ-cPz1DpV5TbDbcYyAS5nQxMEhI_H0u2bYY-eD2f5J6XQvYgV8xGvXJ5B-R-6-Gz_Z_c6M-Uhw";

const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig },
});

const web3auth = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    privateKeyProvider,
});

export const Web3AuthContext = createContext({
    web3auth: null,
    provider: null,
    login: async () => { },
    logout: async () => { },
    address: "",
    isConnected: false,
});

export const useWeb3Auth = () => useContext(Web3AuthContext);

export default function AuthProvider({ children }) {
    const [provider, setProvider] = useState(null);
    const [address, setAddress] = useState("");
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                await web3auth.initModal();
                setProvider(web3auth.provider);
                if (web3auth.connected) {
                    setIsConnected(true);
                    getAccounts();
                }
            } catch (error) {
                console.error("Error initializing Web3Auth", error);
            }
        };
        init();
    }, []);

    const getAccounts = async () => {
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
            const web3authProvider = await web3auth.connect();
            setProvider(web3authProvider);
            setIsConnected(true);
            await getAccounts();
        } catch (error) {
            console.error("Error logging in", error);
        }
    };

    const logout = async () => {
        try {
            await web3auth.logout();
            setProvider(null);
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
