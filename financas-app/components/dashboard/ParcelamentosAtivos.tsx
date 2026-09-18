import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LinhaParcelada {
  descricao: string;
  cartao: string;
  categoria: string;
  parcelaAtual: string | null;
  valorParcial: number;
}

const formatarReais = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ACCENT_POR_CARTAO: Record<string, string> = {
  Nubank: "--accent-nubank",
  XP: "--accent-xp",
  Bradesco: "--accent-bradesco",
};

export function ParcelamentosAtivos({ linhas }: { linhas: LinhaParcelada[] }) {
  if (linhas.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma parcela ativa neste mês.</p>;
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-1.5 sm:px-2">Descrição</TableHead>
            <TableHead className="hidden px-1.5 sm:table-cell sm:px-2">Cartão</TableHead>
            <TableHead className="px-1.5 sm:px-2">Parcela</TableHead>
            <TableHead className="px-1.5 text-right sm:px-2">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((l, i) => (
            <TableRow key={`${l.descricao}-${i}`}>
              <TableCell
                className="max-w-20 truncate px-1.5 font-medium sm:max-w-40 sm:px-2"
                title={`${l.descricao} · ${l.cartao} · ${l.categoria}`}
              >
                <span
                  className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                  style={{ background: `var(${ACCENT_POR_CARTAO[l.cartao] ?? "--border"})` }}
                  aria-hidden
                />
                {l.descricao}
              </TableCell>
              <TableCell className="hidden whitespace-nowrap px-1.5 text-muted-foreground sm:table-cell sm:px-2">
                {l.cartao}
              </TableCell>
              <TableCell className="whitespace-nowrap px-1.5 tabular-nums text-muted-foreground sm:px-2">
                {l.parcelaAtual}
              </TableCell>
              <TableCell className="whitespace-nowrap px-1.5 text-right tabular-nums sm:px-2">
                {formatarReais(l.valorParcial)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
