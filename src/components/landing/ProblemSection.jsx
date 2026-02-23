"use client";

import { motion } from "framer-motion";
import { AlertTriangle, UserX, FileWarning, Eye } from "lucide-react";

const problems = [
  {
    icon: AlertTriangle,
    title: "No Deal Protection",
    description:
      "Freelancers and employers on Reddit, Discord, and Twitter have zero recourse when deals go sideways.",
  },
  {
    icon: UserX,
    title: "Abandoned Projects",
    description:
      "Either party can vanish mid-project with no accountability, leaving the other with wasted time and money.",
  },
  {
    icon: FileWarning,
    title: "Portfolio Oversharing",
    description:
      "Traditional portfolios and resumes expose personal information on unregulated, potentially unsafe platforms.",
  },
  {
    icon: Eye,
    title: "Zero Privacy",
    description:
      "Your identity, work history, and personal details are broadcast publicly just to prove you're competent.",
  },
];

const ProblemSection = () => {
  return (
    <section className="relative border-t border-border/30 bg-background py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-medium uppercase tracking-widest text-destructive">
            The Problem
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-foreground md:text-5xl">
            Unregulated Markets Are Broken
          </h2>
          <p className="mt-4 text-muted-foreground">
            Billions in freelance deals happen on social platforms with zero infrastructure for trust.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-destructive/30 hover:bg-card/80"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-destructive/10 p-2.5">
                  <problem.icon className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {problem.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {problem.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;