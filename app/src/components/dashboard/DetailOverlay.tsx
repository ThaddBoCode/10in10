"use client";

import { ArrowLeft } from "lucide-react";

type DetailRow = {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
};

type DetailOverlayProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  bigValue: string;
  bigUnit: string;
  sections: {
    title: string;
    rows: DetailRow[];
  }[];
};

export function DetailOverlay({
  open,
  onClose,
  title,
  subtitle,
  bigValue,
  bigUnit,
  sections,
}: DetailOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]" style={{ background: "var(--bg)" }}>
      <div className="h-full overflow-y-auto p-5 pb-24">
        <button
          onClick={onClose}
          className="font-body mb-4 flex items-center gap-2 py-2 text-sm font-semibold"
          style={{ color: "var(--primary-light)", background: "none", border: "none" }}
        >
          <ArrowLeft size={16} /> Zurueck
        </button>

        <h1 className="font-heading text-2xl" style={{ color: "var(--text)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="font-body mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        )}

        <div className="my-6 text-center">
          <p
            className="font-numbers text-[56px] leading-none"
            style={{
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {bigValue}
          </p>
          <p className="font-numbers mt-1 text-xl" style={{ color: "var(--text-secondary)" }}>
            {bigUnit}
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="mt-6">
            <h3
              className="font-body mb-3 text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {section.title}
            </h3>
            <div className="card p-4">
              {section.rows.map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3"
                  style={{
                    borderBottom:
                      i < section.rows.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <span className="font-body text-sm" style={{ color: "var(--text-secondary)" }}>
                    {row.label}
                  </span>
                  <span
                    className="font-numbers text-[15px]"
                    style={{
                      color: row.color || "var(--text)",
                      fontWeight: row.bold ? 800 : 600,
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
