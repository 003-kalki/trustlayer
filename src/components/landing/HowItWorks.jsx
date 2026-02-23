"use client";

import { motion } from "framer-motion";
import {
  UserPlus,
  Handshake,
  CheckCircle2,
  Award,
  ShieldAlert,
} from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Your DID",
    description:
      "Generate a Decentralized Identifier using Hyperledger Indy. No personal data stored — only cryptographic proofs.",
  },
  {
    icon: Handshake,
    step: "02",
    title: "Initiate a Deal",
    description:
      "Both parties agree to terms on-chain. The deal contract is immutable and transparent to both sides.",
  },
  {
    icon: CheckCircle2,
    step: "03",
    title: "Complete & Certify",
    description:
      "Upon work completion, the employer signs a verifiable credential certifying the freelancer's successful delivery.",
  },
  {
    icon: Award,
    step: "04",
    title: "Build Reputation",
    description:
      "Credentials accumulate as portable, privacy-preserving proof of your track record across any platform.",
  },
  {
    icon: ShieldAlert,
    step: "05",
    title: "Dispute Resolution",
    description:
      "If a party abandons the project, the system flags it and triggers a resolution protocol with evidence on-chain.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative border-t border-border/30 py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-medium uppercase tracking-widest text-primary">
            How It Works
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-foreground md:text-5xl">
            Five Steps to Trustless Trust
          </h2>
        </motion.div>

        <div className="relative mt-16">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent md:left-1/2 md:block" />

          <div className="space-y-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex flex-col items-center gap-8 md:flex-row ${
                  i % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex-1 ${
                    i % 2 === 1 ? "md:text-left" : "md:text-right"
                  }`}
                >
                  <div className="rounded-xl border border-border/50 bg-card p-6 glow-border transition-all hover:border-primary/30">
                    <div className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-primary">
                      Step {step.step}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Center icon */}
                <div className="z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-background">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>

                <div className="hidden flex-1 md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;