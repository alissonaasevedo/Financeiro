// exportar.ts
// Reabre o último .xlsx importado e regrava só as células MANUAIS
// (recorrentes/avulsas dos 3 cartões, receitas, despesas fixas, aportes)
// com o estado atual do banco — nunca toca em fórmulas, cabeçalhos ou nas
// abas Parcelamentos/Resumo Geral/Listas. Isso evita reimplementar a
// lógica de fórmulas da planilha (INDEX/MATCH de parcelas, subtotais,
// painel de categoria) só para gerar o arquivo de saída.

import ExcelJS from "exceljs";
import { and, eq } from "drizzle-orm";
import { db } from "./client";
import { arquivoOriginal, linhasCartao, linhasSimples } from "./schema";
import { CARTOES, MESES, MONTHLY_COLUMNS, MONTHLY_SHEET_MAP } from "@/lib/parser/workbook-map";
import type { Cartao } from "@/lib/parser/types";

function limparIntervalo(ws: ExcelJS.Worksheet, start: number, end: number, colunas: string[]) {
  for (let r = start; r <= end; r++) {
    for (const col of colunas) ws.getCell(`${col}${r}`).value = null;
  }
}

async function escreverSecaoCartao(
  ws: ExcelJS.Worksheet,
  mes: string,
  cartao: Cartao,
  tipo: "recorrente" | "avulsa",
  start: number,
  end: number,
) {
  const col = MONTHLY_COLUMNS;
  limparIntervalo(ws, start, end, [col.descricao, col.categoria, col.qtd, col.custoPorParcela]);

  const linhas = await db
    .select()
    .from(linhasCartao)
    .where(and(eq(linhasCartao.mes, mes), eq(linhasCartao.cartao, cartao), eq(linhasCartao.tipo, tipo)));

  linhas.slice(0, end - start + 1).forEach((linha, i) => {
    const r = start + i;
    ws.getCell(`${col.descricao}${r}`).value = linha.descricao;
    ws.getCell(`${col.categoria}${r}`).value = linha.categoria;
    ws.getCell(`${col.qtd}${r}`).value = linha.qtd;
    ws.getCell(`${col.custoPorParcela}${r}`).value = linha.custoPorParcela;
  });
}

async function escreverSecaoSimples(
  ws: ExcelJS.Worksheet,
  mes: string,
  secao: "receita" | "despesaFixa" | "aporte",
  start: number,
  end: number,
) {
  limparIntervalo(ws, start, end, ["B", "F"]);

  const linhas = await db
    .select()
    .from(linhasSimples)
    .where(and(eq(linhasSimples.mes, mes), eq(linhasSimples.secao, secao)));

  linhas.slice(0, end - start + 1).forEach((linha, i) => {
    const r = start + i;
    ws.getCell(`B${r}`).value = linha.descricao;
    ws.getCell(`F${r}`).value = linha.valor;
  });
}

export async function gerarWorkbookAtualizado(): Promise<Buffer> {
  const [original] = await db.select().from(arquivoOriginal).where(eq(arquivoOriginal.id, 1));
  if (!original) {
    throw new Error("Nenhuma planilha importada ainda.");
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(
    original.conteudo.buffer.slice(
      original.conteudo.byteOffset,
      original.conteudo.byteOffset + original.conteudo.byteLength,
    ) as ArrayBuffer,
  );

  for (const mes of MESES) {
    const ws = wb.getWorksheet(mes);
    if (!ws) continue;

    for (const cartao of CARTOES) {
      const key = cartao.toLowerCase() as "nubank" | "xp" | "bradesco";
      const map = MONTHLY_SHEET_MAP[key];
      if ("recorrentesStart" in map) {
        await escreverSecaoCartao(ws, mes, cartao, "recorrente", map.recorrentesStart, map.recorrentesEnd);
      }
      await escreverSecaoCartao(ws, mes, cartao, "avulsa", map.avulsasStart, map.avulsasEnd);
    }

    await escreverSecaoSimples(ws, mes, "receita", MONTHLY_SHEET_MAP.receitasStart, MONTHLY_SHEET_MAP.receitasEnd);
    await escreverSecaoSimples(
      ws,
      mes,
      "despesaFixa",
      MONTHLY_SHEET_MAP.despesasFixasStart,
      MONTHLY_SHEET_MAP.despesasFixasEnd,
    );
    await escreverSecaoSimples(ws, mes, "aporte", MONTHLY_SHEET_MAP.aportesStart, MONTHLY_SHEET_MAP.aportesEnd);
  }

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
