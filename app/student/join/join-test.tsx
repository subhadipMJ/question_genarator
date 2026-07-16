"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function JoinTest() {
  const [token, setToken] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const getHashToken = () => {
      const hash = window.location.hash;
      return new URLSearchParams(hash.slice(1)).get("token") ?? "";
    };
    setToken(getHashToken());

    const handleHashChange = () => {
      setToken(getHashToken());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  async function start() {
    if (!token) return;
    setBusy(true);
    try {
      const r = await fetch("/api/backend/student/test-series/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_token: token })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail ?? "Unable to join test.");
      history.replaceState(null, "", location.pathname);
      router.push(`/student/attempts/${d.id}`);
    } catch (x) {
      toast.error(x instanceof Error ? x.message : "Unable to join test.");
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) {
    return (
      <div className="rounded-xl border p-6 text-center">
        <h1 className="text-2xl font-bold">Join invited test</h1>
        <p className="text-muted-foreground my-4">Confirm when you are ready. The timer starts after you press the button.</p>
        <Button disabled={true}>Loading...</Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-6 text-center">
      <h1 className="text-2xl font-bold">Join invited test</h1>
      <p className="text-muted-foreground my-4">Confirm when you are ready. The timer starts after you press the button.</p>
      <Button disabled={!token || busy} onClick={start}>
        {busy ? "Starting..." : "Start test"}
      </Button>
      {!token && (
        <p className="text-destructive mt-3">This invite link is missing its token.</p>
      )}
    </div>
  );
}
