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
    title: "Decentralized Identity (DID)",
    description:
      "Self-sovereign identity built on Hyperledger Indy. You own your credentials — no platform lock-in.",
  },
  {
    icon: FileCheck,
    title: "Verifiable Credentials",
    description:
      "Employer-signed completion certificates that prove your work without exposing personal details.",
  },
  {
    icon: ShieldCheck,
    title: "Zero-Knowledge Proofs",
    description:
      "Prove you have 5+ completed projects without revealing which ones or who you worked with.",
  },
  {
    icon: Globe,
    title: "Cross-Platform Portable",
    description:
      "Use your trust score on Reddit, Discord, Twitter, or any marketplace — it follows you everywhere.",
  },
  {
    icon: Lock,
    title: "Privacy-First Design",
    description:
      "No resumes, no portfolios, no personal data leaks. Only cryptographic proof of competence.",
  },
  {
    icon: Zap,
    title: "Dispute Resolution",
    description:
      "Automated flagging when deals are abandoned. On-chain evidence protects both parties.",
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