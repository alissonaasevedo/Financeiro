// types.ts
// Modelo de dados espelhando a planilha (ver CLAUDE.md, seção 5).

import type { CARTOES, CATEGORIAS, MESES } from "./workbook-map";

export type Cartao = (typeof CARTOES)[number];
export type Categoria = (typeof CATEGORIAS)[number];
export type Mes = (typeof MESES)[number];

export interface Parcelamento {
  descricao: string;
  cartao: Cartao;
  categoria: Categoria;
  mesInicio: string;
  numParcelas: number;
  custoPorParcela: number;
  antecipacao?: {
    mes: string;
    qtdAntecipada: number;
    valorPago?: number;
  };
}

export interface GastoAvulso {
  descricao: string;
  categoria: Categoria | string;
  cartao: Cartao;
  valor: number;
  mes: string;
}

export interface Recorrente {
  descricao: string;
  categoria: Categoria | string;
  cartao: Cartao;
  valorMensal: number;
}

export interface LinhaParcelada {
  descricao: string;
  categoria: Categoria | string;
  cartao: Cartao;
  parcelaAtual: string;
  qtd: number;
  custoPorParcela: number;
  valorParcial: number;
}

export interface LinhaSimples {
  descricao: string;
  valor: number;
}

export interface CartaoMesData {
  recorrentes: Recorrente[];
  parceladas: LinhaParcelada[];
  avulsas: GastoAvulso[];
  subtotal: number;
}

export interface ResumoMes {
  mes: string;
  receitas: number;
  totalNubank: number;
  totalXP: number;
  totalBradesco: number;
  totalCartoes: number;
  despesasFixas: number;
  aportes: number;
  balancoFinal: number;
  sobraReal: number;
  saldoDevedorAVencer: number;
  porCategoria: Record<string, number>;
}

export interface MesData {
  mes: string;
  cartoes: Record<Cartao, CartaoMesData>;
  receitas: LinhaSimples[];
  despesasFixas: LinhaSimples[];
  aportes: LinhaSimples[];
  resumo: ResumoMes;
}

export interface WorkbookData {
  parcelamentos: Parcelamento[];
  meses: MesData[];
}
