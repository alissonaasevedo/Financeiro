"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface CategoriaChartProps {
  dados: { categoria: string; valor: number }[];
}

const formatarReais = (valor: unknown) =>
  typeof valor === "number"
    ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    : "";

export function CategoriaChart({ dados }: CategoriaChartProps) {
  if (dados.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem gastos categorizados neste mês.</p>;
  }

  const altura = Math.max(dados.length * 36, 120);

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 4 }} barCategoryGap={6}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="categoria"
          width={140}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "var(--accent)" }}
          formatter={(value) => formatarReais(value)}
          labelFormatter={() => ""}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
        />
        <Bar dataKey="valor" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {dados.map((d) => (
            <Cell key={d.categoria} fill="var(--chart-categoria-400)" />
          ))}
          <LabelList
            dataKey="valor"
            position="right"
            formatter={(value) => formatarReais(value)}
            style={{ fill: "var(--foreground)", fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
