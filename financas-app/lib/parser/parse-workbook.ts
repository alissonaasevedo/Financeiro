// parse-workbook.ts
// Lê a planilha (.xlsx, pós Fase 0) com exceljs e retorna objetos tipados.
// Convenção: seções manuais (Recorrentes/Avulsas/Receitas/Despesas/Aportes)
// são lidas pelos valores brutos das células — nunca dependem de fórmula
// recalculada. Seções calculadas (Compras Parceladas, subtotais, painel de
// categoria, cronograma de compromissos) dependem do RESULTADO em cache da
// fórmula, então o .xlsx precisa ter sido recalculado (Excel/Google Sheets/
// LibreOffice) antes de ser importado — reimplementar a lógica de
// antecipação de parcelas em JS duplicaria a fonte da verdade.

import ExcelJS from "exceljs";
import {
  CARTOES,
  MESES,
  MONTHLY_COLUMNS,
  MONTHLY_SHEET_MAP,
  PARCELAMENTOS_COLUMNS,
  PARCELAMENTOS_END_ROW,
  PARCELAMENTOS_START_ROW,
} from "./workbook-map";
import type {
  Cartao,
  CartaoMesData,
  GastoAvulso,
  LinhaParcelada,
  LinhaSimples,
  MesData,
  Parcelamento,
  Recorrente,
  ResumoMes,
  WorkbookData,
} from "./types";

const PARCELAMENTOS_SALDO_DEVEDOR_START_ROW = 52; // Parcelamentos!G52 = saldo devedor de MESES[0]

function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if (v instanceof Date) return v.toISOString();
    if ("result" in v) return cellText({ value: (v as { result: unknown }).result } as ExcelJS.Cell);
    if ("richText" in v) {
      return (v as { richText: { text: string }[] }).richText.map((t) => t.text).join("");
    }
    if ("error" in v) return "";
    return "";
  }
  return String(v).trim();
}

function cellNumber(cell: ExcelJS.Cell): number {
  const v = cell.value;
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "object") {
    if ("result" in v) {
      const r = (v as { result: unknown }).result;
      return typeof r === "number" ? r : 0;
    }
    return 0;
  }
  return 0;
}

function isBlankRow(ws: ExcelJS.Worksheet, row: number, col: string): boolean {
  return cellText(ws.getCell(`${col}${row}`)) === "";
}

async function loadWorkbook(input: Buffer | string): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  if (typeof input === "string") {
    await wb.xlsx.readFile(input);
  } else {
    await wb.xlsx.load(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer);
  }
  return wb;
}

function parseParcelamentos(ws: ExcelJS.Worksheet): Parcelamento[] {
  const out: Parcelamento[] = [];
  const col = PARCELAMENTOS_COLUMNS;
  for (let r = PARCELAMENTOS_START_ROW; r <= PARCELAMENTOS_END_ROW; r++) {
    const descricao = cellText(ws.getCell(`${col.descricao}${r}`));
    if (!descricao) continue;
    const antecipacaoMes = cellText(ws.getCell(`${col.antecipacaoMes}${r}`));
    const antecipacaoQtd = cellNumber(ws.getCell(`${col.antecipacaoQtd}${r}`));
    out.push({
      descricao,
      cartao: cellText(ws.getCell(`${col.cartao}${r}`)) as Cartao,
      categoria: cellText(ws.getCell(`${col.categoria}${r}`)) as Parcelamento["categoria"],
      mesInicio: cellText(ws.getCell(`${col.mesInicio}${r}`)),
      numParcelas: cellNumber(ws.getCell(`${col.numParcelas}${r}`)),
      custoPorParcela: cellNumber(ws.getCell(`${col.custoPorParcela}${r}`)),
      ...(antecipacaoMes
        ? {
            antecipacao: {
              mes: antecipacaoMes,
              qtdAntecipada: antecipacaoQtd,
              valorPago: cellNumber(ws.getCell(`${col.antecipacaoValor}${r}`)) || undefined,
            },
          }
        : {}),
    });
  }
  return out;
}

function readManualLinhas(
  ws: ExcelJS.Worksheet,
  start: number,
  end: number,
): { descricao: string; categoria: string; qtd: number; custoPorParcela: number; valor: number }[] {
  const col = MONTHLY_COLUMNS;
  const out = [];
  for (let r = start; r <= end; r++) {
    if (isBlankRow(ws, r, col.descricao)) continue;
    const qtd = cellNumber(ws.getCell(`${col.qtd}${r}`));
    const custoPorParcela = cellNumber(ws.getCell(`${col.custoPorParcela}${r}`));
    out.push({
      descricao: cellText(ws.getCell(`${col.descricao}${r}`)),
      categoria: cellText(ws.getCell(`${col.categoria}${r}`)),
      qtd,
      custoPorParcela,
      valor: qtd * custoPorParcela,
    });
  }
  return out;
}

function readParceladas(ws: ExcelJS.Worksheet, start: number, end: number, cartao: Cartao): LinhaParcelada[] {
  const col = MONTHLY_COLUMNS;
  const out: LinhaParcelada[] = [];
  for (let r = start; r <= end; r++) {
    const descricao = cellText(ws.getCell(`${col.descricao}${r}`));
    if (!descricao) continue;
    out.push({
      descricao,
      categoria: cellText(ws.getCell(`${col.categoria}${r}`)),
      cartao,
      parcelaAtual: cellText(ws.getCell(`${col.parcelaAtual}${r}`)),
      qtd: cellNumber(ws.getCell(`${col.qtd}${r}`)),
      custoPorParcela: cellNumber(ws.getCell(`${col.custoPorParcela}${r}`)),
      valorParcial: cellNumber(ws.getCell(`${col.valorParcial}${r}`)),
    });
  }
  return out;
}

function readLinhasSimples(ws: ExcelJS.Worksheet, start: number, end: number): LinhaSimples[] {
  const out: LinhaSimples[] = [];
  for (let r = start; r <= end; r++) {
    const descricao = cellText(ws.getCell(`B${r}`));
    if (!descricao) continue;
    out.push({ descricao, valor: cellNumber(ws.getCell(`F${r}`)) });
  }
  return out;
}

function parseCartaoMesData(ws: ExcelJS.Worksheet, cartao: Cartao): CartaoMesData {
  const key = cartao.toLowerCase() as "nubank" | "xp" | "bradesco";
  const map = MONTHLY_SHEET_MAP[key];
  const recorrentes: Recorrente[] =
    "recorrentesStart" in map
      ? readManualLinhas(ws, map.recorrentesStart, map.recorrentesEnd).map((l) => ({
          descricao: l.descricao,
          categoria: l.categoria,
          cartao,
          valorMensal: l.valor,
        }))
      : [];
  const avulsas: GastoAvulso[] = readManualLinhas(ws, map.avulsasStart, map.avulsasEnd).map((l) => ({
    descricao: l.descricao,
    categoria: l.categoria,
    cartao,
    valor: l.valor,
    mes: "",
  }));
  const parceladas = readParceladas(ws, map.parceladasStart, map.parceladasEnd, cartao);
  return {
    recorrentes,
    parceladas,
    avulsas,
    subtotal: cellNumber(ws.getCell(`G${map.subtotalRow}`)),
  };
}

function parsePorCategoria(ws: ExcelJS.Worksheet): Record<string, number> {
  const out: Record<string, number> = {};
  for (let r = MONTHLY_SHEET_MAP.categoriaStart; r <= MONTHLY_SHEET_MAP.categoriaEnd; r++) {
    const nome = cellText(ws.getCell(`B${r}`));
    if (!nome) continue;
    out[nome] = cellNumber(ws.getCell(`F${r}`));
  }
  return out;
}

function parseMesSheet(ws: ExcelJS.Worksheet, mes: string, saldoDevedorAVencer: number): MesData {
  const cartoes = Object.fromEntries(
    CARTOES.map((cartao) => [cartao, parseCartaoMesData(ws, cartao)]),
  ) as Record<Cartao, CartaoMesData>;

  const receitas = readLinhasSimples(ws, MONTHLY_SHEET_MAP.receitasStart, MONTHLY_SHEET_MAP.receitasEnd);
  const despesasFixas = readLinhasSimples(
    ws,
    MONTHLY_SHEET_MAP.despesasFixasStart,
    MONTHLY_SHEET_MAP.despesasFixasEnd,
  );
  const aportes = readLinhasSimples(ws, MONTHLY_SHEET_MAP.aportesStart, MONTHLY_SHEET_MAP.aportesEnd);

  const resumo: ResumoMes = {
    mes,
    receitas: receitas.reduce((s, l) => s + l.valor, 0),
    totalNubank: cartoes.Nubank.subtotal,
    totalXP: cartoes.XP.subtotal,
    totalBradesco: cartoes.Bradesco.subtotal,
    totalCartoes: cellNumber(ws.getCell(`G${MONTHLY_SHEET_MAP.totalGeralRow}`)),
    despesasFixas: despesasFixas.reduce((s, l) => s + l.valor, 0),
    aportes: aportes.reduce((s, l) => s + l.valor, 0),
    balancoFinal: cellNumber(ws.getCell(`F${MONTHLY_SHEET_MAP.balancoFinalRow}`)),
    sobraReal: cellNumber(ws.getCell(`F${MONTHLY_SHEET_MAP.sobraRealRow}`)),
    saldoDevedorAVencer,
    porCategoria: parsePorCategoria(ws),
  };

  return { mes, cartoes, receitas, despesasFixas, aportes, resumo };
}

export async function parseWorkbook(input: Buffer | string): Promise<WorkbookData> {
  const wb = await loadWorkbook(input);

  const parcelamentosWs = wb.getWorksheet("Parcelamentos");
  if (!parcelamentosWs) throw new Error("Aba 'Parcelamentos' não encontrada no workbook.");
  const parcelamentos = parseParcelamentos(parcelamentosWs);

  const meses: MesData[] = MESES.map((mes, i) => {
    const ws = wb.getWorksheet(mes);
    if (!ws) throw new Error(`Aba '${mes}' não encontrada no workbook.`);
    const saldoDevedorAVencer = cellNumber(
      parcelamentosWs.getCell(`G${PARCELAMENTOS_SALDO_DEVEDOR_START_ROW + i}`),
    );
    return parseMesSheet(ws, mes, saldoDevedorAVencer);
  });

  return { parcelamentos, meses };
}
