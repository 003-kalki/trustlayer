"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Navbar = () => {
  const { data: session } = useSession();

  const AuthButtons = () => (
    <div className="flex flex-col gap-4 py-4 items-center">
      <Button
        onClick={() => signIn("google")}
        className="w-full max-w-sm flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" className="fill-current">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        Continue with Google
      </Button>
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
            Trust<span className="text-primary">Chain</span>
          </span>
        </div>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {["How It Works", "Features", "Roadmap"].map((item) => {
            const href = `#${item.toLowerCase().replace(/\s/g, "-")}`;
            return (
              <Link
                key={item}
                href={href}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {item}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </Button>
              </Link>
              <Button size="sm" onClick={() => signOut()} variant="secondary">
                Sign Out
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
                    Sign in or create a new account to continue.
                  </DialogDescription>
                </DialogHeader>
                <AuthButtons />
              </DialogContent>
            </Dialog>
          )}

          {!session && (
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