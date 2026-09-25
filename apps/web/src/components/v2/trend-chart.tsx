"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type TrendPoint = { label: string; value: number; secondary?: number };

export function TrendChart({ data, label = "Aktif öğrenen", secondaryLabel }: { data: TrendPoint[]; label?: string; secondaryLabel?: string }) {
  return (
    <div className="rv2-chart" role="img" aria-label={`${label} eğilimi: ${data.map((item) => `${item.label} ${item.value}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id="rv2Primary" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--rv2-primary)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--rv2-primary)" stopOpacity={0} /></linearGradient>
            <linearGradient id="rv2Accent" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--rv2-accent)" stopOpacity={0.24} /><stop offset="100%" stopColor="var(--rv2-accent)" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid stroke="var(--rv2-border)" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--rv2-text-soft)", fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--rv2-text-soft)", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "var(--rv2-surface-raised)", border: "1px solid var(--rv2-border)", borderRadius: 12, color: "var(--rv2-text)", boxShadow: "var(--rv2-shadow-md)" }} labelStyle={{ color: "var(--rv2-text-soft)" }} />
          <Area type="monotone" dataKey="value" name={label} stroke="var(--rv2-primary)" strokeWidth={2.5} fill="url(#rv2Primary)" />
          {secondaryLabel ? <Area type="monotone" dataKey="secondary" name={secondaryLabel} stroke="var(--rv2-accent)" strokeWidth={2} fill="url(#rv2Accent)" /> : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

