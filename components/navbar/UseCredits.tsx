"use client";
import { useEffect, useState } from "react";

export default function UserCredits() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch("/api/credits");
        const data = await res.json();
        if (data?.balance !== undefined) setBalance(data.balance);
      } catch {
        setBalance(null);
      }
    }
    fetchCredits();
  }, []);

  if (balance === null) return null;

  return (
    <div className="ml-3 flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-sm font-medium text-white shadow-inner ring-1 ring-white/20 backdrop-blur-md">
      <span> {balance}</span>
    </div>
  );
}
