// schema.ts
// Espelha o WorkbookData de lib/parser/types.ts em tabelas relacionais.
// Um /api/importar sempre reimporta o snapshot inteiro da planilha —
// não há edição incremental aqui, então não há necessidade de updatedAt
// por linha.

import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";

export const parcelamentos = sqliteTable("parcelamentos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  descricao: text("descricao").notNull(),
  cartao: text("cartao").notNull(),
  categoria: text("categoria").notNull(),
  mesInicio: text("mes_inicio").notNull(),
  numParcelas: integer("num_parcelas").notNull(),
  custoPorParcela: real("custo_por_parcela").notNull(),
  antecipacaoMes: text("antecipacao_mes"),
  antecipacaoQtd: integer("antecipacao_qtd"),
  antecipacaoValor: real("antecipacao_valor"),
});

// tipo: "recorrente" | "parcelada" | "avulsa"
export const linhasCartao = sqliteTable("linhas_cartao", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mes: text("mes").notNull(),
  cartao: text("cartao").notNull(),
  tipo: text("tipo").notNull(),
  descricao: text("descricao").notNull(),
  categoria: text("categoria").notNull(),
  parcelaAtual: text("parcela_atual"),
  qtd: real("qtd").notNull(),
  custoPorParcela: real("custo_por_parcela").notNull(),
  valorParcial: real("valor_parcial").notNull(),
});

// secao: "receita" | "despesaFixa" | "aporte"
export const linhasSimples = sqliteTable("linhas_simples", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mes: text("mes").notNull(),
  secao: text("secao").notNull(),
  descricao: text("descricao").notNull(),
  valor: real("valor").notNull(),
});

export const resumoMes = sqliteTable("resumo_mes", {
  mes: text("mes").primaryKey(),
  receitas: real("receitas").notNull(),
  totalNubank: real("total_nubank").notNull(),
  totalXP: real("total_xp").notNull(),
  totalBradesco: real("total_bradesco").notNull(),
  totalCartoes: real("total_cartoes").notNull(),
  despesasFixas: real("despesas_fixas").notNull(),
  aportes: real("aportes").notNull(),
  balancoFinal: real("balanco_final").notNull(),
  sobraReal: real("sobra_real").notNull(),
  saldoDevedorAVencer: real("saldo_devedor_a_vencer").notNull(),
});

export const categoriaMes = sqliteTable("categoria_mes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mes: text("mes").notNull(),
  categoria: text("categoria").notNull(),
  valor: real("valor").notNull(),
});

// Guarda os bytes do último .xlsx importado (id fixo = 1) — é o template
// que /api/exportar reabre e atualiza apenas nas células manuais, para não
// duplicar a lógica de fórmulas da planilha.
export const arquivoOriginal = sqliteTable("arquivo_original", {
  id: integer("id").primaryKey(),
  conteudo: blob("conteudo", { mode: "buffer" }).notNull(),
  importadoEm: text("importado_em").notNull(),
});
