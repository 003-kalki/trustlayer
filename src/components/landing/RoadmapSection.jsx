"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const phases = [
  {
    phase: "Phase 1",
    title: "Foundation & DID Infrastructure",
    timeline: "Q1 2026",
    status: "in-progress",
    items: [
      "Set up Hyperledger Indy network nodes",
      "Implement DID creation & wallet management",
      "Build basic identity verification flow",
      "Design credential schema for work completion",
    ],
  },
  {
    phase: "Phase 2",
    title: "Deal Smart Contracts & Certification",
    timeline: "Q2 2026",
    status: "upcoming",
    items: [
      "Build deal initiation & agreement protocol",
      "Implement employer-signed completion certificates",
      "Create verifiable credential issuance pipeline",
      "Add milestone-based deal tracking",
    ],
  },
  {
    phase: "Phase 3",
    title: "Dispute Resolution & Reputation",
    timeline: "Q3 2026",
    status: "upcoming",
    items: [
      "Build abandonment detection system",
      "Implement dispute resolution protocol",
      "Create portable reputation scoring (ZKP-based)",
      "Add arbitration DAO for complex disputes",
    ],
  },
  {
    phase: "Phase 4",
    title: "Platform Integrations & Scale",
    timeline: "Q4 2026",
    status: "upcoming",
    items: [
      "Discord bot for deal verification",
      "Reddit integration via browser extension",
      "Twitter/X verification badges",
      "Public API for third-party marketplaces",
    ],
  },
  {
    phase: "Phase 5",
    title: "Ecosystem & Governance",
    timeline: "Q1 2027",
    status: "upcoming",
    items: [
      "Community governance token launch",
      "Decentralized arbitrator network",
      "Cross-chain credential bridging",
      "Mobile wallet app release",
    ],
  },
];

const statusIcon = (status) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-primary" />;
    case "in-progress":
      return <Clock className="h-5 w-5 text-accent" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground/50" />;
  }
};

const statusBadge = (status) => {
  const styles = {
    completed: "bg-primary/10 text-primary border-primary/20",
    "in-progress": "bg-accent/10 text-accent border-accent/20",
    upcoming: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status === "in-progress"
        ? "In Progress"
        : status === "completed"
        ? "Completed"
        : "Upcoming"}
    </span>
  );
};

const RoadmapSection = () => {
  return (
    <section id="roadmap" className="relative border-t border-border/30 py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-medium uppercase tracking-widest text-primary">
            Roadmap
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-foreground md:text-5xl">
            The Path Forward
          </h2>
          <p className="mt-4 text-muted-foreground">
            From identity infrastructure to a full decentralized trust ecosystem.
          </p>
        </motion.div>

        <div className="relative mt-16">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-primary/40 via-accent/20 to-transparent md:block" />

          <div className="space-y-8">
            {phases.map((phase, i) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative md:pl-16"
              >
                {/* Timeline dot */}
                <div className="absolute left-4 top-6 hidden md:block">
                  {statusIcon(phase.status)}
                </div>

                <div
                  className={`rounded-xl border bg-card p-6 transition-all hover:border-primary/20 ${
                    phase.status === "in-progress"
                      ? "border-accent/30 glow-border"
                      : "border-border/50"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-sm font-bold uppercase tracking-widest text-primary">
                      {phase.phase}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {phase.timeline}
                    </span>
                    {statusBadge(phase.status)}
                  </div>

                  <h3 className="mt-3 font-display text-xl font-semibold text-foreground">
                    {phase.title}
                  </h3>

                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {phase.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;