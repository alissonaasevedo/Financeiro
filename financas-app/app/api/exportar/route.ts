// GET /api/exportar
// Gera o .xlsx atualizado (planilha original + lançamentos feitos no app)
// para download.

import { NextResponse } from "next/server";
import { gerarWorkbookAtualizado } from "@/lib/db/exportar";

export async function GET() {
  try {
    const buffer = await gerarWorkbookAtualizado();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Planilha de GASTOS e CONTROLE FINANCEIRO (atualizada).xlsx"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ erro: err instanceof Error ? err.message : "Falha ao exportar." }, { status: 400 });
  }
}
