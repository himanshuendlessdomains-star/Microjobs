"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ReferralLandingPage() {
  const router = useRouter();
  const params = useParams();
  const code = typeof params.code === "string" ? params.code : "";

  useEffect(() => {
    if (code) {
      try {
        localStorage.setItem("refCode", code);
      } catch {
        // localStorage may be unavailable in some contexts
      }
    }
    router.replace("/");
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F4FA]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-lime-subtle flex items-center justify-center animate-pulse">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 22,9 18,22 6,22 2,9" fill="#B5F23A" />
          </svg>
        </div>
        <p className="text-slate-500 text-sm">Joining BountyHive...</p>
      </div>
    </div>
  );
}
