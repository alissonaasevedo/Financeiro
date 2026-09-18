import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  titulo: string;
  valor: number;
  accentVar?: string;
  destaque?: boolean;
}

const formatarReais = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function StatCard({ titulo, valor, accentVar, destaque }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      {accentVar && (
        <span className="absolute inset-y-0 left-0 w-1" style={{ background: `var(${accentVar})` }} aria-hidden />
      )}
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums",
            destaque && valor < 0 && "text-destructive",
          )}
        >
          {formatarReais(valor)}
        </p>
      </CardContent>
    </Card>
  );
}
