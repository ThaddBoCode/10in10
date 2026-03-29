"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type CalorieBarChartProps = {
  data: { label: string; bmr: number; training: number }[];
};

export function CalorieBarChart({ data }: CalorieBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={1} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

        <XAxis
          dataKey="label"
          tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-body)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />

        <YAxis
          tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-numbers)" }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip
          contentStyle={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "var(--text)",
          }}
          formatter={(value, name) => {
            const labels: Record<string, string> = { bmr: "Grundumsatz", training: "Training" };
            return [`${value} kcal`, labels[String(name)] || String(name)];
          }}
        />

        <Bar dataKey="bmr" stackId="cal" fill="var(--primary)" opacity={0.4} radius={[0, 0, 0, 0]} />
        <Bar dataKey="training" stackId="cal" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
