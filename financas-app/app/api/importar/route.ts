// POST /api/importar
// Recebe a planilha (.xlsx, multipart/form-data, campo "arquivo"), faz o
// parse com lib/parser/parse-workbook.ts e repopula o banco por inteiro —
// a importação é sempre um snapshot completo da planilha, não um merge
// incremental, então o passo 1 é limpar as tabelas.

import { NextRequest, NextResponse } from "next/server";
import { parseWorkbook } from "@/lib/parser/parse-workbook";
import { db } from "@/lib/db/client";
import { arquivoOriginal, categoriaMes, linhasCartao, linhasSimples, parcelamentos, resumoMes } from "@/lib/db/schema";
import type { CartaoMesData, MesData } from "@/lib/parser/types";

const CHUNK_SIZE = 100;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function inserirLinhasCartao(mes: string, cartao: string, dados: CartaoMesData) {
  const linhas = [
    ...dados.recorrentes.map((l) => ({ tipo: "recorrente" as const, ...l, valor: l.valorMensal })),
    ...dados.parceladas.map((l) => ({ tipo: "parcelada" as const, ...l, valor: l.valorParcial })),
    ...dados.avulsas.map((l) => ({ tipo: "avulsa" as const, ...l, valor: l.valor })),
  ];
  for (const grupo of chunk(linhas, CHUNK_SIZE)) {
    await db.insert(linhasCartao).values(
      grupo.map((l) => ({
        mes,
        cartao,
        tipo: l.tipo,
        descricao: l.descricao,
        categoria: l.categoria,
        parcelaAtual: "parcelaAtual" in l ? l.parcelaAtual : null,
        qtd: "qtd" in l ? l.qtd : 1,
        custoPorParcela: "custoPorParcela" in l ? l.custoPorParcela : l.valor,
        valorParcial: l.valor,
      })),
    );
  }
}

async function inserirMes(mes: MesData) {
  for (const cartao of Object.keys(mes.cartoes)) {
    await inserirLinhasCartao(mes.mes, cartao, mes.cartoes[cartao as keyof typeof mes.cartoes]);
  }

  const linhasSimplesDoMes = [
    ...mes.receitas.map((l) => ({ secao: "receita" as const, ...l })),
    ...mes.despesasFixas.map((l) => ({ secao: "despesaFixa" as const, ...l })),
    ...mes.aportes.map((l) => ({ secao: "aporte" as const, ...l })),
  ];
  for (const grupo of chunk(linhasSimplesDoMes, CHUNK_SIZE)) {
    await db.insert(linhasSimples).values(grupo.map((l) => ({ mes: mes.mes, ...l })));
  }

  await db.insert(resumoMes).values(mes.resumo);

  const categorias = Object.entries(mes.resumo.porCategoria).map(([categoria, valor]) => ({
    mes: mes.mes,
    categoria,
    valor,
  }));
  if (categorias.length) await db.insert(categoriaMes).values(categorias);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File)) {
    return NextResponse.json({ erro: "Envie o arquivo .xlsx no campo 'arquivo'." }, { status: 400 });
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const workbookData = await parseWorkbook(buffer);

  await db.delete(categoriaMes);
  await db.delete(resumoMes);
  await db.delete(linhasSimples);
  await db.delete(linhasCartao);
  await db.delete(parcelamentos);

  for (const grupo of chunk(workbookData.parcelamentos, CHUNK_SIZE)) {
    await db.insert(parcelamentos).values(
      grupo.map((p) => ({
        descricao: p.descricao,
        cartao: p.cartao,
        categoria: p.categoria,
        mesInicio: p.mesInicio,
        numParcelas: p.numParcelas,
        custoPorParcela: p.custoPorParcela,
        antecipacaoMes: p.antecipacao?.mes ?? null,
        antecipacaoQtd: p.antecipacao?.qtdAntecipada ?? null,
        antecipacaoValor: p.antecipacao?.valorPago ?? null,
      })),
    );
  }

  for (const mes of workbookData.meses) {
    await inserirMes(mes);
  }

  await db
    .insert(arquivoOriginal)
    .values({ id: 1, conteudo: buffer, importadoEm: new Date().toISOString() })
    .onConflictDoUpdate({
      target: arquivoOriginal.id,
      set: { conteudo: buffer, importadoEm: new Date().toISOString() },
    });

  return NextResponse.json({
    ok: true,
    parcelamentos: workbookData.parcelamentos.length,
    meses: workbookData.meses.length,
  });
}
