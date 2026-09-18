// POST /api/lancar
// Lançamento rápido de um gasto avulso (formulário /lancar). Grava no
// banco e atualiza os agregados do mês — não toca no .xlsx; isso só
// acontece quando o usuário pede /api/exportar.

import { NextRequest, NextResponse } from "next/server";
import { CARTOES, CATEGORIAS } from "@/lib/parser/workbook-map";
import { lancarGastoAvulso } from "@/lib/db/lancar";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const { mes, cartao, descricao, categoria, valor } = body;

  if (typeof mes !== "string" || !mes) {
    return NextResponse.json({ erro: "Informe o mês." }, { status: 400 });
  }
  if (!CARTOES.includes(cartao)) {
    return NextResponse.json({ erro: "Cartão inválido." }, { status: 400 });
  }
  if (typeof descricao !== "string" || !descricao.trim()) {
    return NextResponse.json({ erro: "Informe a descrição." }, { status: 400 });
  }
  if (!CATEGORIAS.includes(categoria)) {
    return NextResponse.json({ erro: "Categoria inválida." }, { status: 400 });
  }
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) {
    return NextResponse.json({ erro: "Informe um valor maior que zero." }, { status: 400 });
  }

  try {
    await lancarGastoAvulso({ mes, cartao, descricao: descricao.trim(), categoria, valor });
  } catch (err) {
    return NextResponse.json({ erro: err instanceof Error ? err.message : "Falha ao lançar." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
