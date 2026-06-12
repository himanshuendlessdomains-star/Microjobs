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
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mt-2 bg-lime-subtle border border-lime-border">
            <CheckIcon size={30} color="#8BBD1E" />
          </div>
          <p className="text-lg font-bold text-slate-900 text-center">Proof Submitted!</p>
          <p className="text-sm text-slate-500 text-center leading-relaxed">
            Your submission for{" "}
            <span className="text-slate-900 font-semibold">&ldquo;{bountyTitle}&rdquo;</span>{" "}
            has been recorded. You&apos;ll be notified when winners are selected.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold bg-lime text-dark press-scale mt-2"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <p className="font-bold text-lg text-slate-900">Submit Proof</p>
          <button onClick={onClose} className="text-slate-500 text-sm font-semibold press-scale">Cancel</button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Proof type selector */}
          <div className="flex gap-2">
            {PROOF_TYPES.map((pt) => (
              <button
                key={pt.type}
                onClick={() => { setProofType(pt.type); setContent(""); }}
                className={
                  proofType === pt.type
                    ? "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-lime text-dark press-scale transition-all"
                    : "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border border-surface-border text-slate-500 press-scale transition-all hover:bg-surface-hover"
                }
              >
                {pt.icon}
                {pt.label}
              </button>
            ))}
          </div>

          {/* Content input */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              {proofType === "text" ? "Your Submission" : proofType === "link" ? "Submission URL" : "Image URL"}
            </label>
            {proofType === "text" ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={active.placeholder}
                rows={5}
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 resize-none outline-none border border-surface-border focus:border-lime transition-colors leading-relaxed bg-white"
              />
            ) : (
              <input
                type="url"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={active.placeholder}
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 outline-none border border-surface-border focus:border-lime transition-colors bg-white"
              />
            )}
          </div>

          {/* Optional notes */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context for the reviewer..."
              className="w-full px-4 py-3 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 outline-none border border-surface-border focus:border-lime transition-colors bg-white"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={
              canSubmit
                ? "w-full py-3 rounded-xl font-bold text-sm bg-lime text-dark press-scale transition-all"
                : "w-full py-3 rounded-xl font-bold text-sm bg-surface-tint text-slate-300 border border-surface-border transition-all"
            }
          >
            Submit Proof
          </button>
        </div>
      </div>
    </div>
  );
}
