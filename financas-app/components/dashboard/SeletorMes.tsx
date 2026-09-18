import Link from "next/link";
import { cn } from "@/lib/utils";

export function SeletorMes({ meses, mesSelecionado }: { meses: string[]; mesSelecionado: string }) {
  return (
    <nav className="flex flex-wrap gap-1.5">
      {meses.map((mes) => (
        <Link
          key={mes}
          href={`/?mes=${encodeURIComponent(mes)}`}
          className={cn(
            "rounded-md px-2.5 py-1 text-sm transition-colors",
            mes === mesSelecionado
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {mes}
        </Link>
      ))}
    </nav>
  );
}
