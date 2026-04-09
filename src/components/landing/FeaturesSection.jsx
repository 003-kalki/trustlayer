"use client";

import { motion } from "framer-motion";
import {
  Fingerprint,
  Globe,
  FileCheck,
  ShieldCheck,
  Zap,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: Fingerprint,
    title: "Wallet-Backed Identity",
    description:
      "Web3Auth creates a secure Polygon wallet identity without forcing users through seed phrases or browser wallet setup.",
  },
  {
    icon: FileCheck,
    title: "Trust Record Storage",
    description:
      "Contract metadata, profile details, and trust outcomes are stored off-chain so the product stays usable and affordable.",
  },
  {
    icon: ShieldCheck,
    title: "Proof-Based Verification",
    description:
      "Reclaim verification lets users prove signals like GitHub activity without handing over passwords or raw account access.",
  },
  {
    icon: Globe,
    title: "Portable Reputation",
    description:
      "Each wallet profile accumulates a readable trust history that can eventually travel into broader marketplace integrations.",
  },
  {
    icon: Lock,
    title: "Privacy-First Design",
    description:
      "The app is designed to prove reliability with minimal oversharing, instead of asking users to expose full resumes or personal details.",
  },
  {
    icon: Zap,
    title: "Escrow and Disputes",
    description:
      "The payment rail lives on-chain, while disputes, abandonment, and review states are tracked in the app's trust layer.",
  },
];

const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="relative border-t border-border/30 bg-background py-24"
    >
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-medium uppercase tracking-widest text-primary">
            Features
          </span>

          <h2 className="mt-4 font-display text-3xl font-bold text-foreground md:text-5xl">
            Built for the Trustless Economy
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>

                <h3 className="font-display text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
