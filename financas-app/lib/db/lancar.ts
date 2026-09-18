// lancar.ts
// Lançamento rápido de um gasto avulso: grava a linha em linhas_cartao e
// atualiza os agregados (resumo_mes, categoria_mes) na hora, para o
// dashboard refletir o lançamento sem precisar reimportar a planilha.

import { and, eq } from "drizzle-orm";
import { db } from "./client";
import { categoriaMes, linhasCartao, resumoMes } from "./schema";
import type { Cartao } from "@/lib/parser/types";

export interface LancarGastoAvulsoInput {
  mes: string;
  cartao: Cartao;
  descricao: string;
  categoria: string;
  valor: number;
}

const CAMPO_TOTAL_POR_CARTAO: Record<Cartao, "totalNubank" | "totalXP" | "totalBradesco"> = {
  Nubank: "totalNubank",
  XP: "totalXP",
  Bradesco: "totalBradesco",
};

export async function lancarGastoAvulso(input: LancarGastoAvulsoInput) {
  const [resumo] = await db.select().from(resumoMes).where(eq(resumoMes.mes, input.mes));
  if (!resumo) {
    throw new Error(`Mês "${input.mes}" não encontrado — importe a planilha antes de lançar gastos.`);
  }

  await db.insert(linhasCartao).values({
    mes: input.mes,
    cartao: input.cartao,
    tipo: "avulsa",
    descricao: input.descricao,
    categoria: input.categoria,
    parcelaAtual: null,
    qtd: 1,
    custoPorParcela: input.valor,
    valorParcial: input.valor,
  });

  const campoCartao = CAMPO_TOTAL_POR_CARTAO[input.cartao];
  await db
    .update(resumoMes)
    .set({
      [campoCartao]: resumo[campoCartao] + input.valor,
      totalCartoes: resumo.totalCartoes + input.valor,
      balancoFinal: resumo.balancoFinal - input.valor,
      sobraReal: resumo.sobraReal - input.valor,
    })
    .where(eq(resumoMes.mes, input.mes));

  const [categoriaExistente] = await db
    .select()
    .from(categoriaMes)
    .where(and(eq(categoriaMes.mes, input.mes), eq(categoriaMes.categoria, input.categoria)));

  if (categoriaExistente) {
    await db
      .update(categoriaMes)
      .set({ valor: categoriaExistente.valor + input.valor })
      .where(eq(categoriaMes.id, categoriaExistente.id));
  } else {
    await db.insert(categoriaMes).values({ mes: input.mes, categoria: input.categoria, valor: input.valor });
  }
}
