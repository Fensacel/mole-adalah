"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface WinRateChartProps {
  mainHero: { name: string; win_rate: number };
  counterHeroes: Array<{ name: string; win_rate: number }>;
}

export default function WinRateChart({ mainHero, counterHeroes }: WinRateChartProps) {
  const data = [
    { name: mainHero.name, win_rate: +(mainHero.win_rate * 100).toFixed(1), isMain: true },
    ...counterHeroes.slice(0, 5).map((h) => ({
      name: h.name,
      win_rate: +(h.win_rate * 100).toFixed(1),
      isMain: false,
    })),
  ];

  return (
    <div className="bg-[#13151f] border border-white/5 rounded-xl p-5">
      <h3 className="font-bold text-sm text-gray-300 mb-4">Win Rate Comparison vs Counters</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[40, 65]}
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "#1a1d2e",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              fontSize: 12,
            }}
            labelStyle={{ color: "#e5e7eb" }}
            itemStyle={{ color: "#f97316" }}
            formatter={(v) => [`${v}%`, "Win Rate"]}
          />
          <ReferenceLine y={50} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
          <Bar dataKey="win_rate" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isMain ? "#f97316" : entry.win_rate >= 50 ? "#22c55e" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-gray-600 mt-2 text-center">
        Dashed line = 50% (average). Orange = selected hero, Green = WR ≥50%, Red = WR &lt;50%
      </p>
    </div>
  );
}
