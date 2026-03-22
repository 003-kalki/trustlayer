"use client";

import { motion } from "framer-motion";
import { Shield, Key, Database, Link as LinkIcon, CheckCircle } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-24">
      <div className="container mx-auto px-6 max-w-4xl">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6">
            The TrustLayer Architecture
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            A transparent breakdown of how we secure your transactions using mathematically enforced blockchain protocols without sacrificing user experience.
          </p>
        </motion.div>

        <div className="space-y-12">
          
          {/* Layer 1: Identity */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-8 border shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 shrink-0 rounded-xl bg-blue-100 flex items-center justify-center">
                <Key className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-3">1. Decentralized Identity (Web3Auth)</h2>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Traditional crypto websites force you to download complex browser extensions like MetaMask. We utilize <strong>Web3Auth</strong>, an enterprise-grade cryptographic protocol that allows you to log in cleanly using your standard Google or Email account. 
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 border">
                  <strong>How it works securely:</strong> When you log in with Google, the Web3Auth Multi-Party Computation (MPC) network dynamically computes a non-custodial Polygon wallet address specifically for you. We never see your private keys, and you never have to remember a 12-word seed phrase.
                </div>
              </div>
            </div>
          </motion.div>

          {/* Layer 2: Escrow */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 border shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 shrink-0 rounded-xl bg-green-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-3">2. The 50/50 Escrow Smart Contract</h2>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Our financial engine runs entirely on the <strong>Polygon Amoy Blockchain</strong>. Instead of trusting a centralized company to hold your money safely, your funds are securely locked inside immutable, mathematically enforced code (`TrustLayer.sol`).
                </p>
                <ul className="space-y-3 mb-4">
                  <li className="flex items-start gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <span><strong>Creation:</strong> The Employer deposits exactly 50% of the project's MATIC value upfront into the blockchain contract. This guarantees the freelancer that the money exists.</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <span><strong>Completion:</strong> Once the freelancer delivers the work, the Employer deposits the remaining 50%. The Smart Contract automatically releases 100% of the funds to the freelancer's wallet instantly, with no middlemen withdrawing fees.</span>
                  </li>
                </ul>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 border flex flex-col">
                  <strong>Live Transparency</strong>
                  <span>Anyone can verify that our Escrow code hasn't been tampered with. It permanently resides on the global Polygon Ledger.</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Layer 3: Reputation */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-8 border shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 shrink-0 rounded-xl bg-purple-100 flex items-center justify-center">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-3">3. Hybrid Web2 Storage (MariaDB)</h2>
                <p className="text-gray-600 leading-relaxed">
                  While your money and identity are strictly managed by Decentralized Web3 engines, storing massive strings of text (like your personal profile bio or job descriptions) natively on the blockchain is unnecessarily expensive due to "Gas Fees". 
                  <br/><br/>
                  We utilize a Lightning-Fast <strong>MariaDB Relational Database</strong> connected via Prisma ORM for your profile. Your MariaDB profile is definitively anchored to your `0x...` Wallet Address, creating a perfect permanent link between your cheap Web2 Data and your highly-secure Web3 Finances.
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
