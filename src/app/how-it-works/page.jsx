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
            A transparent breakdown of how TrustLayer combines wallet identity, on-chain escrow, off-chain trust storage, and proof-based verification.
          </p>
        </motion.div>

        <div className="space-y-12">
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
                <h2 className="text-2xl font-semibold mb-3">1. Wallet Identity with Web3Auth</h2>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  TrustLayer uses <strong>Web3Auth</strong> so users can access a Polygon wallet identity without installing a browser wallet or managing a seed phrase from day one.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 border">
                  <strong>How it works securely:</strong> Web3Auth's MPC flow creates a non-custodial wallet-backed identity. The app uses the resulting wallet address as the account anchor across profiles, contracts, and trust history.
                </div>
              </div>
            </div>
          </motion.div>

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
                  The payment rail runs on <strong>Polygon Amoy</strong>. Employers deposit 50% when a job is created, and the remaining 50% when the work is complete. The contract then releases the full amount to the freelancer.
                </p>
                <ul className="space-y-3 mb-4">
                  <li className="flex items-start gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <span><strong>Creation:</strong> The employer proves funds exist by locking the first half of the agreement value on-chain.</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    <span><strong>Completion:</strong> When the employer submits the remaining half, the contract pays the freelancer the full project amount in one transaction.</span>
                  </li>
                </ul>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 border flex flex-col">
                  <strong>Live transparency</strong>
                  <span>The contract enforces payment movement, while the TrustLayer app adds the richer human-readable trust workflow on top.</span>
                </div>
              </div>
            </div>
          </motion.div>

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
                <h2 className="text-2xl font-semibold mb-3">3. Off-Chain Trust Storage</h2>
                <p className="text-gray-600 leading-relaxed">
                  Contract titles, descriptions, profile details, verification flags, and trust outcomes live in MySQL/MariaDB through the app's API layer. That keeps the user experience fast and avoids paying blockchain fees for every piece of text metadata.
                  <br /><br />
                  In practice, TrustLayer uses blockchain for funds and SQL storage for readable context, trust history, and richer state transitions like pending acceptance, review, dispute, and abandonment.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-8 border shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 shrink-0 rounded-xl bg-amber-100 flex items-center justify-center">
                <LinkIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-3">4. Proof-Based Verification</h2>
                <p className="text-gray-600 leading-relaxed">
                  TrustLayer currently uses <strong>Reclaim</strong> to verify signals like GitHub activity. The user completes a proof flow, the backend validates it, and the profile is marked as verified without requiring direct account credentials.
                  <br /><br />
                  This is the first step toward richer portable credentials. The current build stores the verification result on the trust profile and surfaces it in the dashboard, verification page, and credentials page.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
