"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const phases = [
  {
    phase: "Phase 1",
    title: "Wallet Identity and Escrow MVP",
    timeline: "Live now",
    status: "completed",
    items: [
      "Web3Auth wallet-backed sign-in",
      "Profile creation tied to wallet address",
      "On-chain 50/50 escrow on Polygon Amoy",
      "Dashboard trust history and contract states",
    ],
  },
  {
    phase: "Phase 2",
    title: "Verification and Portable Profiles",
    timeline: "Current build",
    status: "in-progress",
    items: [
      "Reclaim-based GitHub verification",
      "Dedicated verification workspace",
      "Portable credentials summary page",
      "Selective disclosure-oriented trust record design",
    ],
  },
  {
    phase: "Phase 3",
    title: "Richer Credential Issuance",
    timeline: "Next",
    status: "upcoming",
    items: [
      "Completion certificates for delivered work",
      "Additional marketplace proof adapters",
      "Employer attestations and reusable references",
      "Sharable credential bundles per wallet identity",
    ],
  },
  {
    phase: "Phase 4",
    title: "Integrations and Indexing",
    timeline: "Future",
    status: "upcoming",
    items: [
      "Discord, Reddit, and X integrations",
      "Public API for third-party marketplaces",
      "Indexed on-chain reads instead of full contract scans",
      "Improved analytics and reputation export flows",
    ],
  },
  {
    phase: "Phase 5",
    title: "Advanced Trust Infrastructure",
    timeline: "Future",
    status: "upcoming",
    items: [
      "More advanced dispute workflows",
      "Expanded selective disclosure controls",
      "Standards-based credential interoperability",
      "Mobile and cross-platform trust wallet experiences",
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
            From the current escrow MVP to a broader portable trust ecosystem.
          </p>
        </motion.div>

        <div className="relative mt-16">
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
