import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoriaChart } from "@/components/charts/CategoriaChart";
import { ParcelamentosAtivos } from "@/components/dashboard/ParcelamentosAtivos";
import { SeletorMes } from "@/components/dashboard/SeletorMes";
import { StatCard } from "@/components/dashboard/StatCard";
import { ImportarPlanilha } from "@/components/forms/ImportarPlanilha";
import { getCategoriaMes, getMesesDisponiveis, getParceladasMes, getResumoMes } from "@/lib/db/queries";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const meses = await getMesesDisponiveis();

  if (meses.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4">
        <h1 className="text-2xl font-semibold">Controle Financeiro</h1>
        <p className="text-center text-muted-foreground">
          Nenhuma planilha importada ainda. Envie o arquivo .xlsx para começar.
        </p>
        <ImportarPlanilha />
      </main>
    );
  }

  const mes = mesParam && meses.includes(mesParam) ? mesParam : meses[0];
  const [resumo, categorias, parceladas] = await Promise.all([
    getResumoMes(mes),
    getCategoriaMes(mes),
    getParceladasMes(mes),
  ]);

  if (!resumo) {
    return null;
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Controle Financeiro</h1>
          <ImportarPlanilha />
        </div>
        <SeletorMes meses={meses} mesSelecionado={mes} />
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard titulo="Receitas" valor={resumo.receitas} accentVar="--accent-receitas" />
        <StatCard titulo="Nubank" valor={resumo.totalNubank} accentVar="--accent-nubank" />
        <StatCard titulo="XP" valor={resumo.totalXP} accentVar="--accent-xp" />
        <StatCard titulo="Bradesco" valor={resumo.totalBradesco} accentVar="--accent-bradesco" />
        <StatCard titulo="Total dos Cartões" valor={resumo.totalCartoes} />
        <StatCard titulo="Despesas Fixas" valor={resumo.despesasFixas} accentVar="--accent-despesas" />
        <StatCard titulo="Aportes" valor={resumo.aportes} accentVar="--accent-aportes" />
        <StatCard titulo="Balanço Final" valor={resumo.balancoFinal} destaque />
        <StatCard titulo="Sobra Real" valor={resumo.sobraReal} destaque />
        <StatCard titulo="Saldo Devedor a Vencer" valor={resumo.saldoDevedorAVencer} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoriaChart dados={categorias} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parcelamentos ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <ParcelamentosAtivos linhas={parceladas} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
