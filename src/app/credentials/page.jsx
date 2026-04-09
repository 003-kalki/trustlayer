"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Briefcase, Github, ShieldCheck, Wallet } from "lucide-react";
import { useWeb3Auth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { profileApi } from "@/services/api";
import { buildPortableTrustRecord, getCredentialCompletion } from "@/services/did";

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="mt-3 text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

export default function CredentialsPage() {
  const { isConnected, address, login } = useWeb3Auth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setRecord(null);
      return;
    }

    let cancelled = false;

    async function loadRecord() {
      setLoading(true);
      try {
        const data = await profileApi.upsert(address);
        if (!cancelled) {
          setRecord(buildPortableTrustRecord(data.user));
        }
      } catch (error) {
        console.error("Failed to load credentials record", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRecord();

    return () => {
      cancelled = true;
    };
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Portable credentials</h1>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Connect your wallet-backed profile to view the trust signals and credentials that already belong to your TrustLayer account.
            </p>
            <Button onClick={login} className="mt-6">
              Connect Web3 Identity
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const completion = getCredentialCompletion(record);

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-16">
      <div className="container mx-auto max-w-6xl px-4 space-y-8">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Portable trust record
              </div>
              <h1 className="mt-4 text-3xl font-bold text-gray-900">Credentials</h1>
              <p className="mt-3 max-w-2xl text-gray-600">
                This page turns your wallet identity, verification flags, and trust history into a portable summary you can share across future marketplaces and client conversations.
              </p>
            </div>

            <div className="rounded-2xl border bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {loading ? "Refreshing trust record..." : record?.identity?.shortAddress || address}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <MetricCard icon={Briefcase} label="Total contracts" value={record?.stats?.totalContracts ?? 0} />
          <MetricCard icon={Award} label="Completed" value={record?.stats?.completedContracts ?? 0} />
          <MetricCard icon={ShieldCheck} label="Trust tier" value={record?.stats?.trustTier || "New"} />
          <MetricCard icon={Github} label="Verified credentials" value={`${completion?.verifiedCount ?? 0}/${completion?.total ?? 0}`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Identity summary</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Display name</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">{record?.identity?.displayName || "Anonymous User"}</div>
              </div>
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Handle</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">{record?.identity?.handle || "Not set yet"}</div>
              </div>
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">{record?.identity?.role || "BOTH"}</div>
              </div>
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Privacy mode</div>
                <div className="mt-2 text-lg font-semibold text-gray-900">{record?.identity?.privacyMode || "SELECTIVE"}</div>
              </div>
            </div>

            <h3 className="mt-8 text-lg font-semibold text-gray-900">Credential slots</h3>
            <div className="mt-4 space-y-3">
              {(record?.credentials || []).map((credential) => (
                <div key={credential.id} className="flex items-center justify-between rounded-2xl border p-4">
                  <div>
                    <div className="font-medium text-gray-900">{credential.label}</div>
                    <div className="text-sm text-gray-500">{credential.visibility}</div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold border ${credential.verified ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
                    {credential.verified ? "Verified" : "Empty"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Trust history snapshot</h3>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between rounded-xl border bg-gray-50 px-4 py-3">
                  <span>Active contracts</span>
                  <span className="font-semibold text-gray-900">{record?.stats?.activeContracts ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border bg-gray-50 px-4 py-3">
                  <span>Disputes</span>
                  <span className="font-semibold text-gray-900">{record?.stats?.disputedContracts ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border bg-gray-50 px-4 py-3">
                  <span>Abandoned by you</span>
                  <span className="font-semibold text-gray-900">{record?.stats?.abandonedByUser ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border bg-gray-50 px-4 py-3">
                  <span>Abandoned by counterparty</span>
                  <span className="font-semibold text-gray-900">{record?.stats?.abandonedByCounterparty ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Improve this record</h3>
              <p className="mt-3 text-sm text-gray-600">
                Add more verified signals and complete more contracts to make this wallet identity more useful in future collaborations.
              </p>
              <div className="mt-4 flex gap-3">
                <Link href="/verify">
                  <Button>Verify Signals</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline">Open Dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
