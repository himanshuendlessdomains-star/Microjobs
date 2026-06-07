"use client";

import { useState } from "react";
import { CheckIcon, TextIcon, LinkIcon, ImageIcon } from "@/components/icons";
import type { ProofType, ProofSubmission } from "@/lib/types";

interface ProofSubmitModalProps {
  bountyId: string;
  bountyTitle: string;
  onClose: () => void;
  onSubmit: (submission: ProofSubmission) => void;
}

const PROOF_TYPES: { type: ProofType; label: string; icon: React.ReactNode; placeholder: string }[] = [
  {
    type: "text",
    label: "Write-up",
    icon: <TextIcon size={16} />,
    placeholder: "Describe your submission in detail. Include links, screenshots, or any relevant information...",
  },
  {
    type: "link",
    label: "Link",
    icon: <LinkIcon size={16} />,
    placeholder: "https://example.com/your-submission",
  },
  {
    type: "image",
    label: "Image URL",
    icon: <ImageIcon size={16} />,
    placeholder: "https://example.com/screenshot.png",
  },
];

export function ProofSubmitModal({ bountyId, bountyTitle, onClose, onSubmit }: ProofSubmitModalProps) {
  const [proofType, setProofType] = useState<ProofType>("text");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const active = PROOF_TYPES.find((p) => p.type === proofType)!;
  const canSubmit = content.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({ bountyId, proofType, content: content.trim(), notes: notes.trim() });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.72)" }}>
        <div
          className="w-full max-w-[390px] rounded-t-3xl p-6 flex flex-col items-center gap-4"
          style={{ background: "#111317", border: "1px solid #1E2127" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mt-2"
            style={{ background: "#B5F23A1A", border: "1.5px solid #B5F23A40" }}
          >
            <CheckIcon size={30} color="#B5F23A" />
          </div>
          <p className="text-lg font-bold text-[#EAEAEA] text-center">Proof Submitted!</p>
          <p className="text-sm text-[#9CA3AF] text-center leading-relaxed">
            Your submission for{" "}
            <span className="text-[#EAEAEA] font-semibold">&ldquo;{bountyTitle}&rdquo;</span>{" "}
            has been recorded. You&apos;ll be notified when winners are selected.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-bold text-[#0D0E10] press-scale mt-2"
            style={{ background: "#B5F23A" }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.72)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[390px] rounded-t-3xl pb-6"
        style={{ background: "#111317", border: "1px solid #1E2127" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "#2E333D" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <p className="font-bold text-base text-[#EAEAEA]">Submit Proof</p>
          <button onClick={onClose} className="text-[#9CA3AF] text-sm font-semibold press-scale">Cancel</button>
        </div>

        <div className="px-5 flex flex-col gap-4">
          {/* Proof type selector */}
          <div
            className="flex gap-2 p-1 rounded-xl"
            style={{ background: "#0D0E10", border: "1px solid #1E2127" }}
          >
            {PROOF_TYPES.map((pt) => (
              <button
                key={pt.type}
                onClick={() => { setProofType(pt.type); setContent(""); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold press-scale transition-all"
                style={{
                  background: proofType === pt.type ? "#1A1D22" : "transparent",
                  color: proofType === pt.type ? "#B5F23A" : "#5A6070",
                  border: proofType === pt.type ? "1px solid #B5F23A30" : "1px solid transparent",
                }}
              >
                {pt.icon}
                {pt.label}
              </button>
            ))}
          </div>

          {/* Content input */}
          <div>
            <label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wide mb-1.5 block">
              {proofType === "text" ? "Your Submission" : proofType === "link" ? "Submission URL" : "Image URL"}
            </label>
            {proofType === "text" ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={active.placeholder}
                rows={5}
                className="w-full px-4 py-3 rounded-xl text-sm text-[#EAEAEA] resize-none outline-none"
                style={{
                  background: "#0D0E10",
                  border: "1px solid #1E2127",
                  color: "#EAEAEA",
                  lineHeight: "1.6",
                }}
              />
            ) : (
              <input
                type="url"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={active.placeholder}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: "#0D0E10",
                  border: "1px solid #1E2127",
                  color: "#EAEAEA",
                }}
              />
            )}
          </div>

          {/* Optional notes */}
          <div>
            <label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wide mb-1.5 block">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context for the reviewer..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: "#0D0E10",
                border: "1px solid #1E2127",
                color: "#EAEAEA",
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-2xl font-bold text-sm press-scale transition-all"
            style={{
              background: canSubmit ? "#B5F23A" : "#1A1D22",
              color: canSubmit ? "#0D0E10" : "#5A6070",
              border: canSubmit ? "none" : "1px solid #2E333D",
            }}
          >
            Submit Proof
          </button>
        </div>
      </div>
    </div>
  );
}
