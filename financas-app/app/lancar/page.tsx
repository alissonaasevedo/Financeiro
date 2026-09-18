import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LancarGastoForm } from "@/components/forms/LancarGastoForm";
import { getMesesDisponiveis } from "@/lib/db/queries";

export default async function Lancar() {
  const meses = await getMesesDisponiveis();

  if (meses.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">
          Nenhuma planilha importada ainda.{" "}
          <Link href="/" className="underline">
            Importe primeiro
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Lançar gasto</h1>
        <Link href="/" className="text-sm text-muted-foreground underline">
          Voltar ao dashboard
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Compra avulsa</CardTitle>
        </CardHeader>
        <CardContent>
          <LancarGastoForm meses={meses} mesInicial={meses[0]} />
        </CardContent>
      </Card>
    </main>
  );
}
