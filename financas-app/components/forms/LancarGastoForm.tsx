"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CARTOES, CATEGORIAS } from "@/lib/parser/workbook-map";

export function LancarGastoForm({ meses, mesInicial }: { meses: string[]; mesInicial: string }) {
  const router = useRouter();
  const [mes, setMes] = useState(mesInicial);
  const [cartao, setCartao] = useState<string>(CARTOES[0]);
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[CATEGORIAS.length - 1]);
  const [valor, setValor] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    setSucesso(false);
    try {
      const resposta = await fetch("/api/lancar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, cartao, descricao, categoria, valor: Number(valor.replace(",", ".")) }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro ?? "Falha ao lançar.");
      setSucesso(true);
      setDescricao("");
      setValor("");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao lançar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="mes">Mês</Label>
        <select
          id="mes"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
        >
          {meses.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="cartao">Cartão</Label>
        <select
          id="cartao"
          value={cartao}
          onChange={(e) => setCartao(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
        >
          {CARTOES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <Input
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex.: Supermercado"
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="categoria">Categoria</Label>
        <select
          id="categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="valor">Valor (R$)</Label>
        <Input
          id="valor"
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0,00"
          required
        />
      </div>

      <Button type="submit" disabled={enviando}>
        {enviando ? "Lançando..." : "Lançar gasto"}
      </Button>

      {erro && <p className="text-sm text-destructive">{erro}</p>}
      {sucesso && <p className="text-sm text-[color:var(--accent-receitas)]">Gasto lançado com sucesso.</p>}
    </form>
  );
}
