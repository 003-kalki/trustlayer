"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Github, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useWeb3Auth } from "@/components/AuthProvider";
import { ReclaimVerifyButton } from "@/components/dashboard/ReclaimVerifyButton";
import { Button } from "@/components/ui/button";
import { profileApi } from "@/services/api";
import { shortenWalletAddress } from "@/services/auth";

const GITHUB_RECLAIM_PROVIDER_ID = "8573efb4-4529-47d3-80da-eaa7384dac19";

export default function VerifyPage() {
  const { isConnected, address, login } = useWeb3Auth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setProfileData(null);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      try {
        const data = await profileApi.upsert(address);
        if (!cancelled) {
          setProfileData(data.user);
        }
      } catch (error) {
        console.error("Failed to load verification profile", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isConnected, address]);

  const handleGithubVerified = async (proofs) => {
    try {
      await profileApi.verifyCredential({
        walletAddress: address,
        type: "github",
        proofs,
      });

      setProfileData((previous) => ({
        ...previous,
        profile: {
          ...previous?.profile,
          githubVerified: true,
        },
      }));

      return true;
    } catch (error) {
      console.error("GitHub verification update failed", error);
      return false;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Verify your trust profile</h1>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Connect your wallet-backed identity first, then add proof-based credentials that future clients and collaborators can trust.
            </p>
            <Button onClick={login} className="mt-6">
              Connect Web3 Identity
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-16">
      <div className="container mx-auto max-w-5xl px-4 space-y-8">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <LockKeyhole className="h-3.5 w-3.5" />
                Proof-based verification
              </div>
              <h1 className="mt-4 text-3xl font-bold text-gray-900">Verification Center</h1>
              <p className="mt-3 max-w-2xl text-gray-600">
                TrustLayer uses Reclaim proofs to verify signals like GitHub activity without asking for passwords or storing private account access.
              </p>
            </div>
            <div className="rounded-2xl border bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Connected as <span className="font-mono text-gray-900">{shortenWalletAddress(address, 8, 6)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">GitHub Activity Proof</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Prove GitHub contribution history with a zero-knowledge flow and attach that result to your TrustLayer profile.
                </p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold border ${profileData?.profile?.githubVerified ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                {profileData?.profile?.githubVerified ? "Verified" : "Pending"}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border bg-gray-50 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white p-3 border">
                  <Github className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">GitHub contributions</div>
                  <div className="text-sm text-gray-500">
                    Current profile flag: {profileData?.profile?.githubVerified ? "verified and stored" : loading ? "loading profile" : "not verified yet"}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                {profileData?.profile?.githubVerified ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    Your GitHub proof is already attached to this trust identity. You can review how it appears on the credentials page.
                  </div>
                ) : (
                  <ReclaimVerifyButton
                    title="GitHub"
                    icon={Github}
                    providerId={GITHUB_RECLAIM_PROVIDER_ID}
                    onSuccess={handleGithubVerified}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">How it works</h3>
              <div className="mt-4 space-y-4 text-sm text-gray-600">
                <div className="flex gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                  <p>TrustLayer requests a signed proof payload from the backend.</p>
                </div>
                <div className="flex gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                  <p>You complete the Reclaim verification flow by scanning the QR code.</p>
                </div>
                <div className="flex gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                  <p>The backend validates the proof and marks your profile as verified.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Next step</h3>
              <p className="mt-3 text-sm text-gray-600">
                After verification, open your credentials page to see the portable trust summary generated from your profile and contract history.
              </p>
              <Link href="/credentials" className="mt-4 inline-block">
                <Button variant="outline">Open Credentials</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
