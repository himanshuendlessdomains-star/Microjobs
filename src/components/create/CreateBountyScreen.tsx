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
    <div className="flex items-center gap-2 px-5 pb-4">
      {steps.map((label, idx) => {
        const s = (idx + 1) as Step;
        const done = step > s;
        const active = step === s;
        return (
          <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: done ? "#B5F23A" : active ? "#B5F23A18" : "#1A1D22",
                  border: active ? "1.5px solid #B5F23A" : done ? "none" : "1px solid #2E333D",
                  color: done ? "#0D0E10" : active ? "#B5F23A" : "#5A6070",
                }}
              >
                {done ? <CheckIcon size={12} color="#0D0E10" /> : s}
              </div>
              <span
                className="text-xs font-semibold"
                style={{ color: active ? "#EAEAEA" : done ? "#B5F23A" : "#5A6070" }}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-px" style={{ background: step > s ? "#B5F23A40" : "#1E2127" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-[#5A6070] mb-2">{children}</p>
  );
}

function InputBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#0D0E10", border: "1px solid #1E2127" }}>
      {children}
    </div>
  );
}

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

  const perWinner =
    form.poolAmount && form.winnerCount
      ? (parseFloat(form.poolAmount) / form.winnerCount).toFixed(2)
      : "—";

  function patch<K extends keyof CreateBountyFormData>(key: K, val: CreateBountyFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const step1Valid = form.title.trim().length >= 3 && form.description.trim().length >= 10;
  const step2Valid = parseFloat(form.poolAmount) > 0;

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
      await createBounty({ ...form, creatorAddress: rawAddress });
    } catch {
      // Funds already sent on-chain — show success anyway so user isn't confused.
    }

    setLaunching(false);
    setLaunched(true);
  }

  if (launched) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-8 gap-5" style={{ background: "#0D0E10" }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "#B5F23A18", border: "2px solid #B5F23A40" }}
        >
          <CheckIcon size={36} color="#B5F23A" />
        </div>
        <p className="text-xl font-bold text-[#EAEAEA] text-center">Bounty Launched! 🎉</p>
        <p className="text-sm text-[#9CA3AF] text-center leading-relaxed">
          <span className="text-[#EAEAEA] font-semibold">&ldquo;{form.title}&rdquo;</span> is now live with a{" "}
          <span className="text-[#B5F23A] font-semibold">{form.poolAmount} TON</span> pool.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-8 py-3.5 rounded-2xl font-bold text-sm text-[#0D0E10] press-scale"
          style={{ background: "#B5F23A" }}
        >
          Back to Discover
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#0D0E10" }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-5 pb-3 flex-shrink-0">
        <button
          onClick={step === 1 ? () => router.back() : () => setStep((s) => (s - 1) as Step)}
          className="w-9 h-9 rounded-full flex items-center justify-center press-scale"
          style={{ background: "#1A1D22", border: "1px solid #2E333D" }}
        >
          <ArrowLeftIcon size={18} />
        </button>
        <p className="font-bold text-base text-[#EAEAEA]">Create Bounty</p>
      </header>

      <StepIndicator step={step} />

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-6 flex flex-col gap-4">
        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <>
            <div>
              <FieldLabel>Bounty Title</FieldLabel>
              <InputBox>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => patch("title", e.target.value)}
                  placeholder="e.g. Design a logo for BountyHive"
                  maxLength={80}
                  className="w-full px-4 py-3 bg-transparent text-sm text-[#EAEAEA] outline-none"
                  style={{ caretColor: "#B5F23A" }}
                />
              </InputBox>
              <p className="text-right text-xs text-[#5A6070] mt-1">{form.title.length}/80</p>
            </div>

            <div>
              <FieldLabel>Description</FieldLabel>
              <InputBox>
                <textarea
                  value={form.description}
                  onChange={(e) => patch("description", e.target.value)}
                  placeholder="Describe what participants need to do, what makes a winning submission, and any rules..."
                  rows={5}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-transparent text-sm text-[#EAEAEA] outline-none resize-none"
                  style={{ caretColor: "#B5F23A", lineHeight: "1.6" }}
                />
              </InputBox>
              <p className="text-right text-xs text-[#5A6070] mt-1">{form.description.length}/500</p>
            </div>

            <div>
              <FieldLabel>Category</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => patch("category", cat)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold press-scale transition-all"
                    style={{
                      background: form.category === cat ? "#B5F23A18" : "#1A1D22",
                      color: form.category === cat ? "#B5F23A" : "#9CA3AF",
                      border: form.category === cat ? "1.5px solid #B5F23A50" : "1px solid #2E333D",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Bounty Type</FieldLabel>
              <div className="flex flex-col gap-2">
                {BOUNTY_TYPES.map((bt) => (
                  <button
                    key={bt.type}
                    onClick={() => patch("type", bt.type)}
                    className="flex items-center gap-3 p-3 rounded-xl press-scale transition-all text-left"
                    style={{
                      background: form.type === bt.type ? "#B5F23A10" : "#111317",
                      border: form.type === bt.type ? "1.5px solid #B5F23A50" : "1.5px solid #1E2127",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                      style={{ background: form.type === bt.type ? "#B5F23A20" : "#1A1D22" }}
                    >
                      {bt.type === "task" ? "✅" : bt.type === "creative" ? "🎨" : "🧠"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: form.type === bt.type ? "#B5F23A" : "#EAEAEA" }}>
                        {bt.label}
                      </p>
                      <p className="text-xs text-[#5A6070]">{bt.desc}</p>
                    </div>
                    {form.type === bt.type && (
                      <div className="ml-auto">
                        <CheckIcon size={16} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Duration</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => patch("durationHours", d.value)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold press-scale transition-all"
                    style={{
                      background: form.durationHours === d.value ? "#B5F23A18" : "#1A1D22",
                      color: form.durationHours === d.value ? "#B5F23A" : "#9CA3AF",
                      border: form.durationHours === d.value ? "1.5px solid #B5F23A50" : "1px solid #2E333D",
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Rewards ── */}
        {step === 2 && (
          <>
            <div>
              <FieldLabel>Total Pool Amount</FieldLabel>
              <div
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                style={{ background: "#0D0E10", border: "1px solid #1E2127" }}
              >
                <TonDiamond size={18} />
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.poolAmount}
                  onChange={(e) => patch("poolAmount", e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-xl font-bold text-[#EAEAEA] outline-none"
                  style={{ caretColor: "#B5F23A" }}
                />
                <span className="text-sm text-[#5A6070] font-semibold">TON</span>
              </div>

              <button
                onClick={() => setShowSwapModal(true)}
                className="w-full mt-2 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 press-scale"
                style={{
                  background: "#111317",
                  color: "#B5F23A",
                  border: "1px solid #B5F23A30",
                }}
              >
                <SwapArrowsIcon size={14} />
                Fund with another token via Omniston
              </button>
            </div>

            <div>
              <FieldLabel>Number of Winners</FieldLabel>
              <div className="flex gap-2 flex-wrap">
                {WINNER_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => patch("winnerCount", n)}
                    className="w-12 h-12 rounded-xl font-bold text-sm press-scale transition-all"
                    style={{
                      background: form.winnerCount === n ? "#B5F23A18" : "#1A1D22",
                      color: form.winnerCount === n ? "#B5F23A" : "#9CA3AF",
                      border: form.winnerCount === n ? "1.5px solid #B5F23A50" : "1px solid #2E333D",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Winner Selection</FieldLabel>
              <div
                className="flex p-1 rounded-xl"
                style={{ background: "#0D0E10", border: "1px solid #1E2127" }}
              >
                {(["draw", "manual"] as WinnerSelection[]).map((ws) => (
                  <button
                    key={ws}
                    onClick={() => patch("winnerSelection", ws)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold press-scale transition-all capitalize"
                    style={{
                      background: form.winnerSelection === ws ? "#1A1D22" : "transparent",
                      color: form.winnerSelection === ws ? "#B5F23A" : "#5A6070",
                      border: form.winnerSelection === ws ? "1px solid #B5F23A30" : "1px solid transparent",
                    }}
                  >
                    {ws === "draw" ? "🎲 Draw" : "👤 Manual"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#5A6070] mt-2 px-1">
                {form.winnerSelection === "draw"
                  ? "Winners are selected randomly from all valid submissions."
                  : "You manually choose winners after reviewing submissions."}
              </p>
            </div>

            {/* Per winner preview */}
            {form.poolAmount && (
              <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: "#111317", border: "1px solid #1E2127" }}
              >
                <div>
                  <p className="text-xs text-[#5A6070] font-semibold uppercase tracking-wide">Per Winner</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <TonDiamond size={14} />
                    <p className="font-bold text-base text-[#B5F23A]">{perWinner} TON</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#5A6070] font-semibold uppercase tracking-wide">Total Pool</p>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <TonDiamond size={14} />
                    <p className="font-bold text-base text-[#EAEAEA]">{form.poolAmount} TON</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Step 3: Review & Fund ── */}
        {step === 3 && (
          <>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1E2127" }}>
              {[
                { label: "Title", value: form.title },
                { label: "Category", value: form.category },
                { label: "Type", value: form.type.charAt(0).toUpperCase() + form.type.slice(1) },
                { label: "Duration", value: DURATIONS.find((d) => d.value === form.durationHours)?.label ?? "" },
                {
                  label: "Pool",
                  value: (
                    <div className="flex items-center gap-1.5">
                      <TonDiamond size={13} />
                      <span className="text-[#B5F23A] font-bold">{form.poolAmount} TON</span>
                    </div>
                  ),
                },
                { label: "Winners", value: `${form.winnerCount} (${form.winnerSelection})` },
                {
                  label: "Per Winner",
                  value: (
                    <div className="flex items-center gap-1.5">
                      <TonDiamond size={13} />
                      <span className="text-[#EAEAEA] font-semibold">{perWinner} TON</span>
                    </div>
                  ),
                },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    background: i % 2 === 0 ? "#111317" : "#0D0E10",
                    borderBottom: i < arr.length - 1 ? "1px solid #1E2127" : "none",
                  }}
                >
                  <span className="text-xs text-[#5A6070] font-semibold uppercase tracking-wide">{row.label}</span>
                  {typeof row.value === "string" ? (
                    <span className="text-sm font-semibold text-[#C8CDD8] text-right max-w-[200px] truncate">
                      {row.value}
                    </span>
                  ) : (
                    row.value
                  )}
                </div>
              ))}
            </div>

            {/* Description preview */}
            <div className="rounded-xl p-4" style={{ background: "#111317", border: "1px solid #1E2127" }}>
              <p className="text-xs text-[#5A6070] font-semibold uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-[#C8CDD8] leading-relaxed">{form.description}</p>
            </div>

            {/* Wallet check */}
            {!isConnected && (
              <div
                className="p-4 rounded-xl flex items-center gap-3"
                style={{ background: "#1A0A0A", border: "1px solid #F8717140" }}
              >
                <span className="text-lg">⚠️</span>
                <p className="text-xs text-[#F87171]">
                  Connect your wallet in Profile before launching a bounty.
                </p>
              </div>
            )}

            {launchError && (
              <p className="text-xs text-red-400 text-center px-2">{launchError}</p>
            )}

            {/* Fund & Launch */}
            <button
              onClick={handleLaunch}
              disabled={!isConnected || launching}
              className="w-full py-4 rounded-2xl font-bold text-sm press-scale flex items-center justify-center gap-2 transition-all"
              style={{
                background: isConnected && !launching ? "#B5F23A" : "#1A1D22",
                color: isConnected && !launching ? "#0D0E10" : "#5A6070",
                border: isConnected && !launching ? "none" : "1px solid #2E333D",
                boxShadow: isConnected && !launching ? "0 0 18px 3px #B5F23A30" : "none",
              }}
            >
              {launching && <SpinnerIcon size={16} color="#0D0E10" />}
              {launching ? "Sending Transaction..." : `Fund & Launch · ${form.poolAmount || "0"} TON`}
            </button>

            <p className="text-[10px] text-[#5A6070] text-center leading-relaxed px-2">
              Funds are sent to the BountyHive escrow contract and released automatically when winners are selected.
            </p>
          </>
        )}
      </div>

      {/* ── Bottom CTA ── */}
      {step < 3 && (
        <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid #1E2127" }}>
          <button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={step === 1 ? !step1Valid : !step2Valid}
            className={cn("w-full py-3.5 rounded-2xl font-bold text-sm press-scale transition-all")}
            style={{
              background: (step === 1 ? step1Valid : step2Valid) ? "#B5F23A" : "#1A1D22",
              color: (step === 1 ? step1Valid : step2Valid) ? "#0D0E10" : "#5A6070",
              border: (step === 1 ? step1Valid : step2Valid) ? "none" : "1px solid #2E333D",
            }}
          >
            Continue
          </button>
        </div>
      )}

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
