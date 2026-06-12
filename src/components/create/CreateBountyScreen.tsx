"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTonConnectUI } from "@tonconnect/ui-react";
import {
  ArrowLeftIcon,
  TonDiamond,
  CheckIcon,
  SpinnerIcon,
  SwapArrowsIcon,
} from "@/components/icons";
import { SwapModal } from "@/components/bounty/SwapModal";
import { useWallet } from "@/hooks/useTonWallet";
import { cn } from "@/lib/utils";
import { createBounty } from "@/lib/api";
import type { CreateBountyFormData, BountyType, WinnerSelection } from "@/lib/types";

type Step = 1 | 2 | 3 | 4;

const CATEGORIES = ["Creative", "Social", "Analytics", "Dev"] as const;
const DURATIONS = [
  { label: "24 hours", value: 24 },
  { label: "48 hours", value: 48 },
  { label: "72 hours", value: 72 },
  { label: "1 week", value: 168 },
];
const WINNER_COUNTS = [1, 2, 3, 5, 10];
const BOUNTY_TYPES: { type: BountyType; label: string; desc: string }[] = [
  { type: "task", label: "Task", desc: "Complete a specific action" },
  { type: "creative", label: "Creative", desc: "Design or art submission" },
  { type: "quiz", label: "Quiz", desc: "Answer questions correctly" },
];

// Reads at call time so a dev-server restart isn't needed when .env.local changes.
function getEscrowAddress() {
  return process.env.NEXT_PUBLIC_ESCROW_ADDRESS ?? "";
}

function StepIndicator({ step }: { step: Step }) {
  const steps = ["Details", "Rewards", "Review"];
  return (
    <div className="flex items-center mb-8 px-2">
      {steps.map((label, idx) => {
        const s = (idx + 1) as Step;
        const done = step > s;
        const active = step === s;
        return (
          <div key={label} className={cn("flex items-center", idx > 0 && "flex-1")}>
            {idx > 0 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2",
                  step >= s ? "bg-dark-DEFAULT" : "bg-surface-border"
                )}
                style={{ background: step >= s ? "#0D0E12" : undefined }}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all",
                  done && "bg-dark-DEFAULT text-white",
                  active && "bg-lime-DEFAULT text-dark-DEFAULT font-black",
                  !done && !active && "bg-white border-2 border-surface-border text-slate-400 font-semibold"
                )}
                style={{
                  background: done ? "#0D0E12" : active ? "#B5F23A" : undefined,
                  color: done ? "#FFFFFF" : active ? "#0D0E12" : undefined,
                }}
              >
                {done ? <CheckIcon size={14} color="#FFFFFF" /> : s}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  active ? "text-slate-900" : done ? "text-slate-700" : "text-slate-400"
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{children}</label>;
}

const inputClass =
  "w-full border border-surface-border rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:outline-none focus:border-lime-DEFAULT focus:ring-2 focus:ring-lime-subtle transition-colors";

export function CreateBountyScreen() {
  const router = useRouter();
  const { isConnected, isMainnet, rawAddress } = useWallet();
  const [tonConnectUI] = useTonConnectUI();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<CreateBountyFormData>({
    title: "",
    description: "",
    category: "Creative",
    type: "task",
    poolAmount: "",
    winnerCount: 1,
    winnerSelection: "draw",
    durationHours: 48,
  });
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [launchError, setLaunchError] = useState("");
  const [createdBountyId, setCreatedBountyId] = useState<string | null>(null);

  const perWinner =
    form.poolAmount && form.winnerCount
      ? (parseFloat(form.poolAmount) / form.winnerCount).toFixed(2)
      : "—";

  function patch<K extends keyof CreateBountyFormData>(key: K, val: CreateBountyFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const step1Valid = form.title.trim().length >= 3 && form.description.trim().length >= 10;
  const step2Valid = parseFloat(form.poolAmount) > 0;

  function adjustWinnerCount(delta: number) {
    const sorted = [...WINNER_COUNTS];
    const idx = sorted.indexOf(form.winnerCount);
    const next = sorted[Math.min(Math.max(idx + delta, 0), sorted.length - 1)];
    patch("winnerCount", next);
  }

  async function handleLaunch() {
    if (!isConnected || !rawAddress) return;
    const escrowAddress = getEscrowAddress();
    if (!escrowAddress) {
      setLaunchError("Escrow address not configured. Set NEXT_PUBLIC_ESCROW_ADDRESS in .env.local.");
      return;
    }
    if (!isMainnet) {
      setLaunchError("Your wallet is on testnet. Switch to TON Mainnet to fund a bounty.");
      return;
    }
    setLaunching(true);
    setLaunchError("");

    const nanotons = Math.floor(parseFloat(form.poolAmount) * 1e9).toString();

    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: escrowAddress, amount: nanotons }],
      });
    } catch (txErr) {
      setLaunchError(txErr instanceof Error ? txErr.message : "Wallet rejected the transaction.");
      setLaunching(false);
      return;
    }

    try {
      const bounty = await createBounty({ ...form, creatorAddress: rawAddress });
      setCreatedBountyId(bounty?.id ?? null);
      setLaunched(true);
    } catch (dbErr) {
      setLaunchError(
        `Funds sent! But the bounty could not be saved: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}. Check your Supabase setup and try again.`
      );
    } finally {
      setLaunching(false);
    }
  }

  /* ── Success state ── */
  if (launched) {
    return (
      <div className="min-h-screen px-4 py-6 md:py-12 flex items-center justify-center">
        <div className="max-w-xl w-full mx-auto">
          <div className="bg-white rounded-3xl shadow-md p-8 flex flex-col items-center text-center gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "#B5F23A", boxShadow: "0 0 20px 4px rgba(181,242,58,0.25)" }}
            >
              <CheckIcon size={40} color="#0D0E12" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Bounty Live!</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              <span className="text-slate-900 font-semibold">&ldquo;{form.title}&rdquo;</span> is now
              live with a <span className="font-bold text-slate-900">{form.poolAmount} TON</span>{" "}
              pool. Participants can start submitting right away.
            </p>
            <div className="flex flex-col gap-3 w-full mt-2">
              <button
                onClick={() =>
                  router.push(createdBountyId ? `/bounty/${createdBountyId}` : "/")
                }
                className="w-full font-bold rounded-xl py-3 px-5 press-scale text-sm"
                style={{ background: "#B5F23A", color: "#0D0E12" }}
              >
                View Bounty
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full border border-surface-border text-slate-700 hover:bg-surface-hover rounded-xl py-3 px-5 font-semibold press-scale text-sm transition-colors"
              >
                Back to Discover
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:py-12 pb-24 md:pb-12">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={step === 1 ? () => router.back() : () => setStep((s) => (s - 1) as Step)}
            className="w-9 h-9 rounded-full flex items-center justify-center press-scale bg-white border border-surface-border shadow-sm"
          >
            <ArrowLeftIcon size={18} color="#0D0E12" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Create Bounty</h1>
        </div>

        <StepIndicator step={step} />

        {/* ── Form card ── */}
        <div className="bg-white rounded-3xl shadow-md p-6">
          {/* ── Step 1: Details ── */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Bounty details</h2>
                <p className="text-sm text-slate-500 mb-5">
                  Tell participants what to do and how to win.
                </p>

                <FieldLabel>Bounty Title</FieldLabel>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => patch("title", e.target.value)}
                  placeholder="e.g. Design a logo for BountyHive"
                  maxLength={80}
                  className={inputClass}
                />
                <p className="text-right text-xs text-slate-400 mt-1">{form.title.length}/80</p>
              </div>

              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea
                  value={form.description}
                  onChange={(e) => patch("description", e.target.value)}
                  placeholder="Describe what participants need to do, what makes a winning submission, and any rules..."
                  rows={5}
                  maxLength={500}
                  className={cn(inputClass, "min-h-[100px] resize-none leading-relaxed")}
                />
                <p className="text-right text-xs text-slate-400 mt-1">
                  {form.description.length}/500
                </p>
              </div>

              <div>
                <FieldLabel>Category</FieldLabel>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => {
                    const selected = form.category === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => patch("category", cat)}
                        className={cn(
                          "border rounded-xl px-3 py-3 flex flex-col items-center gap-1 cursor-pointer press-scale transition-all",
                          selected
                            ? "border-lime-DEFAULT bg-lime-subtle shadow-sm"
                            : "border-surface-border bg-white hover:bg-surface-tint"
                        )}
                        style={
                          selected
                            ? { borderColor: "#B5F23A", background: "#B5F23A15" }
                            : undefined
                        }
                      >
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            selected ? "text-slate-700" : "text-slate-400"
                          )}
                        >
                          {cat}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <FieldLabel>Bounty Type</FieldLabel>
                <div className="grid grid-cols-1 gap-2">
                  {BOUNTY_TYPES.map((bt) => {
                    const selected = form.type === bt.type;
                    return (
                      <button
                        key={bt.type}
                        onClick={() => patch("type", bt.type)}
                        className={cn(
                          "border rounded-xl px-3 py-3 flex items-center gap-3 cursor-pointer press-scale transition-all text-left",
                          selected
                            ? "shadow-sm"
                            : "border-surface-border bg-white hover:bg-surface-tint"
                        )}
                        style={
                          selected
                            ? { borderColor: "#B5F23A", background: "#B5F23A15" }
                            : undefined
                        }
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                          style={{ background: selected ? "#B5F23A28" : "#EDF0FA" }}
                        >
                          {bt.type === "task" ? "✅" : bt.type === "creative" ? "🎨" : "🧠"}
                        </div>
                        <div className="flex-1">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              selected ? "text-slate-700" : "text-slate-400"
                            )}
                          >
                            {bt.label}
                          </p>
                          <p className="text-xs text-slate-400">{bt.desc}</p>
                        </div>
                        {selected && <CheckIcon size={16} color="#8BBD1E" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <FieldLabel>Duration</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map((d) => {
                    const selected = form.durationHours === d.value;
                    return (
                      <button
                        key={d.value}
                        onClick={() => patch("durationHours", d.value)}
                        className={cn(
                          "border rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer press-scale transition-all",
                          selected
                            ? "text-slate-700 shadow-sm"
                            : "border-surface-border bg-white text-slate-400 hover:bg-surface-tint"
                        )}
                        style={
                          selected
                            ? { borderColor: "#B5F23A", background: "#B5F23A15" }
                            : undefined
                        }
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Rewards ── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Rewards</h2>
                <p className="text-sm text-slate-500 mb-5">
                  Set the prize pool and how winners get picked.
                </p>

                <FieldLabel>Total Pool Amount</FieldLabel>
                <div className="border border-surface-border rounded-2xl px-5 py-4 bg-white focus-within:border-lime-DEFAULT transition-colors">
                  <div className="flex items-center gap-3">
                    <TonDiamond size={24} />
                    <input
                      type="number"
                      inputMode="decimal"
                      value={form.poolAmount}
                      onChange={(e) => patch("poolAmount", e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-4xl font-black text-slate-900 outline-none min-w-0 placeholder:text-slate-300"
                    />
                    <span className="text-sm text-slate-400 font-bold">TON</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowSwapModal(true)}
                  className="w-full mt-2 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 press-scale border transition-colors hover:bg-surface-tint"
                  style={{ borderColor: "#B5F23A40", color: "#8BBD1E" }}
                >
                  <SwapArrowsIcon size={14} color="#8BBD1E" />
                  Fund with another token via Omniston
                </button>
              </div>

              <div>
                <FieldLabel>Number of Winners</FieldLabel>
                <div className="bg-white border border-surface-border rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                  <button
                    onClick={() => adjustWinnerCount(-1)}
                    disabled={form.winnerCount === WINNER_COUNTS[0]}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold text-slate-700 press-scale disabled:opacity-30 transition-colors hover:bg-surface-hover"
                    style={{ background: "#EDF0FA" }}
                  >
                    −
                  </button>
                  <div className="text-center">
                    <p className="text-2xl font-black text-slate-900">{form.winnerCount}</p>
                    <p className="text-xs text-slate-400 font-semibold">
                      {form.winnerCount === 1 ? "winner" : "winners"}
                    </p>
                  </div>
                  <button
                    onClick={() => adjustWinnerCount(1)}
                    disabled={form.winnerCount === WINNER_COUNTS[WINNER_COUNTS.length - 1]}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold text-slate-700 press-scale disabled:opacity-30 transition-colors hover:bg-surface-hover"
                    style={{ background: "#EDF0FA" }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <FieldLabel>Winner Selection</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {(["draw", "manual"] as WinnerSelection[]).map((ws) => {
                    const selected = form.winnerSelection === ws;
                    return (
                      <button
                        key={ws}
                        onClick={() => patch("winnerSelection", ws)}
                        className={cn(
                          "border rounded-xl px-3 py-4 flex flex-col items-center gap-1.5 cursor-pointer press-scale transition-all",
                          selected
                            ? "shadow-sm"
                            : "border-surface-border bg-white hover:bg-surface-tint"
                        )}
                        style={
                          selected
                            ? { borderColor: "#B5F23A", background: "#B5F23A15" }
                            : undefined
                        }
                      >
                        <span className="text-xl">{ws === "draw" ? "🎲" : "👤"}</span>
                        <span
                          className={cn(
                            "text-sm font-semibold capitalize",
                            selected ? "text-slate-700" : "text-slate-400"
                          )}
                        >
                          {ws === "draw" ? "Random Draw" : "Manual Pick"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2 px-1">
                  {form.winnerSelection === "draw"
                    ? "Winners are selected randomly from all valid submissions."
                    : "You manually choose winners after reviewing submissions."}
                </p>
              </div>

              {/* Per winner preview */}
              {form.poolAmount && (
                <div className="bg-surface-tint border border-surface-border rounded-xl p-4 flex items-center justify-between" style={{ background: "#EDF0FA" }}>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                      Per Winner
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <TonDiamond size={14} />
                      <p className="font-black text-base text-slate-900">{perWinner} TON</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                      Total Pool
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <TonDiamond size={14} />
                      <p className="font-bold text-base text-slate-700">{form.poolAmount} TON</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Review & Fund ── */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Review &amp; launch</h2>
                <p className="text-sm text-slate-500 mb-5">
                  Double check everything before funding the escrow.
                </p>

                <div className="bg-white border border-surface-border rounded-2xl px-4 divide-y divide-surface-border">
                  {[
                    { label: "Title", value: form.title },
                    { label: "Category", value: form.category },
                    {
                      label: "Type",
                      value: form.type.charAt(0).toUpperCase() + form.type.slice(1),
                    },
                    {
                      label: "Duration",
                      value: DURATIONS.find((d) => d.value === form.durationHours)?.label ?? "",
                    },
                    {
                      label: "Pool",
                      value: (
                        <div className="flex items-center gap-1.5">
                          <TonDiamond size={13} />
                          <span className="text-slate-900 font-black">{form.poolAmount} TON</span>
                        </div>
                      ),
                    },
                    { label: "Winners", value: `${form.winnerCount} (${form.winnerSelection})` },
                    {
                      label: "Per Winner",
                      value: (
                        <div className="flex items-center gap-1.5">
                          <TonDiamond size={13} />
                          <span className="text-slate-900 font-semibold">{perWinner} TON</span>
                        </div>
                      ),
                    },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center text-sm py-3">
                      <span className="text-slate-500">{row.label}</span>
                      {typeof row.value === "string" ? (
                        <span className="text-slate-900 font-semibold text-right max-w-[220px] truncate">
                          {row.value}
                        </span>
                      ) : (
                        row.value
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Description preview */}
              <div className="rounded-xl p-3" style={{ background: "#EDF0FA" }}>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5">
                  Description
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">{form.description}</p>
              </div>

              {/* Wallet gate */}
              {!isConnected && (
                <div className="rounded-xl p-4 flex items-center gap-3 border" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
                  <span className="text-lg">⚠️</span>
                  <p className="text-xs font-medium" style={{ color: "#F87171" }}>
                    Connect your wallet in Profile before launching a bounty.
                  </p>
                </div>
              )}

              {isConnected && !isMainnet && (
                <div className="rounded-xl p-4 flex items-center gap-3 border" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
                  <span className="text-lg">🔁</span>
                  <p className="text-xs font-medium" style={{ color: "#B45309" }}>
                    Your wallet is on testnet. Switch to TON Mainnet to fund this bounty.
                  </p>
                </div>
              )}

              {launchError && (
                <p className="text-xs text-red-500 text-center px-2">{launchError}</p>
              )}

              <p className="text-[11px] text-slate-400 text-center leading-relaxed px-2">
                Funds are sent to the BountyHive escrow contract and released automatically when
                winners are selected.
              </p>
            </div>
          )}

          {/* ── Nav buttons ── */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={step === 1 ? () => router.back() : () => setStep((s) => (s - 1) as Step)}
              className="flex-1 border border-surface-border text-slate-700 rounded-xl px-5 py-3 font-semibold press-scale text-sm transition-colors hover:bg-surface-hover"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={step === 1 ? !step1Valid : !step2Valid}
                className={cn(
                  "flex-1 font-bold rounded-xl px-5 py-3 press-scale text-sm transition-all",
                  (step === 1 ? step1Valid : step2Valid)
                    ? ""
                    : "cursor-not-allowed"
                )}
                style={{
                  background: (step === 1 ? step1Valid : step2Valid) ? "#B5F23A" : "#EDF0FA",
                  color: (step === 1 ? step1Valid : step2Valid) ? "#0D0E12" : "#A8AEBF",
                }}
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleLaunch}
                disabled={!isConnected || launching}
                className="flex-1 font-bold rounded-xl px-5 py-3 press-scale text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: isConnected && !launching ? "#B5F23A" : "#EDF0FA",
                  color: isConnected && !launching ? "#0D0E12" : "#A8AEBF",
                  boxShadow:
                    isConnected && !launching ? "0 0 20px 4px rgba(181,242,58,0.25)" : "none",
                }}
              >
                {launching && <SpinnerIcon size={16} color="#0D0E12" />}
                {launching
                  ? "Sending Transaction..."
                  : `Fund & Launch · ${form.poolAmount || "0"} TON`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Omniston Swap Modal for funding */}
      {showSwapModal && (
        <SwapModal
          targetTon={form.poolAmount || "1"}
          walletAddress={rawAddress}
          onClose={() => setShowSwapModal(false)}
          onSuccess={(received) => {
            patch("poolAmount", received);
            setShowSwapModal(false);
          }}
        />
      )}
    </div>
  );
}
