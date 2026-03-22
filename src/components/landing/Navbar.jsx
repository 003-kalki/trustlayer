"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useWeb3Auth } from "@/components/AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Navbar = () => {
  const { login, logout, isConnected, address } = useWeb3Auth();

  const AuthButtons = () => (
    <div className="flex flex-col gap-4 py-4 items-center">
      <p className="text-sm text-center text-muted-foreground mb-2 px-2">
        TrustLayer does not use a traditional login system. We use <strong>Web3Auth</strong> to automatically generate a secure Polygon crypto wallet for you, giving you full control of your Decentralized Identity.
      </p>
      <Button
        onClick={login}
        className="w-full max-w-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
      >
        <Shield className="h-4 w-4" />
        Connect Web3 Identity
      </Button>
      <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-60 mt-2">
        <span>Powered by</span>
        <span className="font-semibold">Web3Auth</span>
      </div>
    </div>
  );

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">
            Trust<span className="text-primary">Layer</span>
          </span>
        </div>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 md:flex md:mr-4">
          <Link href="/how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-primary">How It Works</Link>
          <Link href="/#features" className="text-sm text-muted-foreground transition-colors hover:text-primary">Features</Link>
          <Link href="/#roadmap" className="text-sm text-muted-foreground transition-colors hover:text-primary">Roadmap</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <div className="hidden md:flex items-center mr-2 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
                {address.substring(0, 6)}...{address.substring(address.length - 4)}
              </div>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </Button>
              </Link>
              <Button size="sm" onClick={logout} variant="secondary">
                Disconnect
              </Button>
            </>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Log In
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center text-2xl">Welcome to TrustLayer</DialogTitle>
                  <DialogDescription className="text-center">
                    Sign in with Google to create your secure Web3 identity.
                  </DialogDescription>
                </DialogHeader>
                <AuthButtons />
              </DialogContent>
            </Dialog>
          )}

          {!isConnected && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Get Started
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center text-2xl">Join TrustLayer</DialogTitle>
                  <DialogDescription className="text-center">
                    Create a new account or sign in to continue.
                  </DialogDescription>
                </DialogHeader>
                <AuthButtons />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;