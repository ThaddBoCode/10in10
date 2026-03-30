import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

type WeightChartProps = {
  entries: { date: string; weight: number }[];
  startWeight: number;
  targetWeight: number;
  weeks: number;
  startDate: string;
};

export function WeightChart({
  entries,
  startWeight,
  targetWeight,
  weeks,
  startDate,
}: WeightChartProps) {
  // Build chart data: one point per day with actual, planned, and average
  const start = new Date(startDate);
  const totalDays = weeks * 7;
  const lossPerDay = (startWeight - targetWeight) / totalDays;

  // Map entries by date
  const entryMap = new Map(entries.map((e) => [e.date, e.weight]));

  // Calculate 7-day moving average
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const data: {
    label: string;
    date: string;
    actual?: number;
    planned: number;
    average?: number;
  }[] = [];

  const today = new Date();
  const daysToShow = Math.min(
    Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 7,
    totalDays
  );

  for (let d = 0; d <= daysToShow; d++) {
    const date = new Date(start);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split("T")[0];
    const isPast = date <= today;

    const weekNum = Math.floor(d / 7) + 1;
    const label = d % 7 === 0 ? `W${weekNum}` : "";

    const planned = Math.round((startWeight - lossPerDay * d) * 10) / 10;
    const actual = isPast ? entryMap.get(dateStr) : undefined;

    // 7-day average
    let average: number | undefined;
    if (isPast && sortedEntries.length > 0) {
      const recentEntries = sortedEntries.filter((e) => {
        const eDate = new Date(e.date);
        const diff = (date.getTime() - eDate.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff < 7;
      });
      if (recentEntries.length > 0) {
        average =
          Math.round(
            (recentEntries.reduce((s, e) => s + e.weight, 0) /
              recentEntries.length) *
              10
          ) / 10;
      }
    }

    data.push({ label, date: dateStr, actual, planned, average });
  }

  // Find weight range for Y axis
  const allWeights = data
    .flatMap((d) => [d.actual, d.planned, d.average])
    .filter((w): w is number => w !== undefined);
  const minW = Math.floor(Math.min(...allWeights, targetWeight) - 1);
  const maxW = Math.ceil(Math.max(...allWeights) + 1);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}.${d.getMonth() + 1}`;
  };

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />

        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-body)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          interval={6}
        />

        <YAxis
          domain={[minW, maxW]}
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
          labelFormatter={(label) => formatDate(String(label))}
          formatter={(value, name) => {
            const labels: Record<string, string> = {
              actual: "Gewicht",
              planned: "Soll",
              average: "\u00D8 7 Tage",
            };
            return [`${value} kg`, labels[String(name)] || String(name)];
          }}
        />

        {/* Target weight line */}
        <ReferenceLine
          y={targetWeight}
          stroke="var(--danger)"
          strokeDasharray="6 4"
          strokeWidth={1.5}
          label={{
            value: `Ziel: ${targetWeight} kg`,
            position: "right",
            fill: "var(--danger)",
            fontSize: 10,
            fontFamily: "var(--font-body)",
          }}
        />

        {/* Planned (Soll) line */}
        <Line
          type="monotone"
          dataKey="planned"
          stroke="var(--primary-light)"
          strokeWidth={1.5}
          strokeDasharray="8 4"
          dot={false}
          opacity={0.4}
        />

        {/* Area fill under actual */}
        <Area
          type="monotone"
          dataKey="average"
          fill="url(#weightAreaGrad)"
          stroke="none"
        />

        {/* 7-day average line */}
        <Line
          type="monotone"
          dataKey="average"
          stroke="var(--accent)"
          strokeWidth={2.5}
          dot={false}
          connectNulls
        />

        {/* Actual weight dots */}
        <Line
          type="monotone"
          dataKey="actual"
          stroke="var(--primary)"
          strokeWidth={0}
          dot={{ fill: "var(--primary)", r: 3, strokeWidth: 0 }}
          activeDot={{ fill: "var(--primary-light)", r: 5, stroke: "white", strokeWidth: 2 }}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
