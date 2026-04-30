"use client";

import { useState } from "react";
import { SURGEON_COLORS } from "@/lib/surgeon-colors";

interface Props {
  name: string;
  selected: string | null;
}

export default function ColorPicker({ name, selected }: Props) {
  const [picked, setPicked] = useState<string>(selected ?? "");

  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">Card color</p>
      <div className="flex flex-wrap gap-2">
        {/* No color option */}
        <button
          type="button"
          onClick={() => setPicked("")}
          className={[
            "flex items-center justify-center w-7 h-7 rounded-full border-2 text-xs transition-all",
            picked === "" ? "border-slate-500 text-slate-500" : "border-slate-200 text-slate-300",
          ].join(" ")}
          title="No color"
        >
          —
        </button>

        {SURGEON_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setPicked(c.id)}
            title={c.label}
            className="w-7 h-7 rounded-full border-2 transition-all"
            style={{
              backgroundColor: c.bg,
              borderColor: picked === c.id ? c.text : "transparent",
              boxShadow: picked === c.id ? `0 0 0 2px ${c.border}` : "none",
            }}
          />
        ))}

        {/* Hidden input carries the value into the form */}
        <input type="hidden" name={name} value={picked} />
      </div>
    </div>
  );
}
