import { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070809] p-4">
      <div
        className="relative flex flex-col overflow-hidden bg-[#0D0E10]"
        style={{
          width: 390,
          height: 844,
          borderRadius: 40,
          boxShadow:
            "0 40px 100px #000000CC, 0 0 0 1px #1E2127, inset 0 1px 0 #2A2D35",
        }}
      >
        {children}
      </div>
    </div>
  );
}
