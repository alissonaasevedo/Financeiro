import { and, eq } from "drizzle-orm";
import { db } from "./client";
import { categoriaMes, linhasCartao, parcelamentos, resumoMes } from "./schema";
import { MESES } from "@/lib/parser/workbook-map";

export async function getMesesDisponiveis(): Promise<string[]> {
  const rows = await db.select({ mes: resumoMes.mes }).from(resumoMes);
  const disponiveis = new Set(rows.map((r) => r.mes));
  return MESES.filter((m) => disponiveis.has(m));
}

export async function getResumoMes(mes: string) {
  const [row] = await db.select().from(resumoMes).where(eq(resumoMes.mes, mes));
  return row ?? null;
}

export async function getCategoriaMes(mes: string) {
  const rows = await db
    .select({ categoria: categoriaMes.categoria, valor: categoriaMes.valor })
    .from(categoriaMes)
    .where(eq(categoriaMes.mes, mes));
  return rows.filter((r) => r.valor > 0).sort((a, b) => b.valor - a.valor);
}

export async function getParceladasMes(mes: string) {
  return db
    .select()
    .from(linhasCartao)
    .where(and(eq(linhasCartao.mes, mes), eq(linhasCartao.tipo, "parcelada")));
}

export async function getTotalParcelamentosCadastrados() {
  const rows = await db.select({ id: parcelamentos.id }).from(parcelamentos);
  return rows.length;
}
