"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImportarPlanilha() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const arquivo = inputRef.current?.files?.[0];
    if (!arquivo) return;

    setCarregando(true);
    setErro(null);
    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      const resposta = await fetch("/api/importar", { method: "POST", body: formData });
      if (!resposta.ok) {
        const { erro: mensagem } = await resposta.json().catch(() => ({ erro: "Falha ao importar." }));
        throw new Error(mensagem ?? "Falha ao importar.");
      }
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao importar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="grid gap-1.5">
        <Label htmlFor="arquivo">Planilha (.xlsx)</Label>
        <Input id="arquivo" ref={inputRef} type="file" accept=".xlsx" required />
      </div>
      <Button type="submit" disabled={carregando}>
        {carregando ? "Importando..." : "Importar"}
      </Button>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </form>
  );
}
