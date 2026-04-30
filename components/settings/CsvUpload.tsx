"use client";

import { useRef, useState, useTransition } from "react";

interface Props {
  action: (csvText: string) => Promise<{ count: number }>;
}

export default function CsvUpload({ action }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      startTransition(async () => {
        try {
          const result = await action(text);
          setMessage({ type: "success", text: `Imported ${result.count} clinic${result.count !== 1 ? "s" : ""}.` });
        } catch (err: unknown) {
          setMessage({ type: "error", text: err instanceof Error ? err.message : "Import failed." });
        }
        if (inputRef.current) inputRef.current.value = "";
      });
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-2">
      <label className={[
        "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 cursor-pointer transition-colors",
        isPending ? "border-slate-200 bg-slate-50" : "border-slate-300 hover:border-brand-400 hover:bg-brand-50",
      ].join(" ")}>
        <input ref={inputRef} type="file" accept=".csv,.txt" onChange={handleFile} disabled={isPending} className="sr-only" />
        <span className="text-sm text-slate-600">
          {isPending ? "Importing…" : "Click to select CSV file"}
        </span>
      </label>
      {message && (
        <p className={`text-sm rounded-lg px-3 py-2 ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
