// workbook-map.ts
// Mapa de linhas/colunas da planilha "Planilha de GASTOS e CONTROLE FINANCEIRO.xlsx".
//
// ATUALIZADO após a Fase 0 (expansão de capacidade das 15 abas mensais):
// Nubank, XP e Bradesco tiveram sua seção "Compras Avulsas" expandida em
// +15 linhas cada (script fase0_corrigido.py), então todas as linhas a
// partir da linha 66 da estrutura original mudaram de posição. Os números
// abaixo já refletem a estrutura FINAL, validada linha por linha contra o
// arquivo real (recálculo + comparação de totais antes/depois, 0 erros).
//
// Convenção: `parceladasStart` e `avulsasStart` sempre apontam para a
// PRIMEIRA LINHA DE DADOS de cada seção (não para a linha de cabeçalho de
// texto acima dela) — mantém a mesma convenção nos 3 cartões.

export const MESES = [
  "Out 2026", "Nov 2026", "Dez 2026", "Jan 2027", "Fev 2027", "Mar 2027",
  "Abr 2027", "Mai 2027", "Jun 2027", "Jul 2027", "Ago 2027", "Set 2027",
  "Out 2027", "Nov 2027", "Dez 2027",
] as const;

export const CARTOES = ["Nubank", "XP", "Bradesco"] as const;

export const CATEGORIAS = [
  "Clínica / PJ", "Saúde", "Moradia", "Alimentação", "Transporte",
  "Educação / Estudos", "Lazer", "Assinaturas", "Vestuário",
  "Impostos / Taxas", "Outros",
] as const;

// Linhas de referência dentro de cada aba mensal — estrutura PÓS Fase 0
// (capacidade expandida em +15 linhas de Avulsas por cartão).
export const MONTHLY_SHEET_MAP = {
  nubank: {
    headerRow: 5,
    recorrentesStart: 8,
    recorrentesEnd: 15,
    parceladasStart: 17,
    parceladasEnd: 44,
    avulsasStart: 46,
    avulsasEnd: 80,
    subtotalRow: 81,
  },
  xp: {
    headerRow: 83,
    parceladasStart: 86,
    parceladasEnd: 103,
    avulsasStart: 105,
    avulsasEnd: 129,
    subtotalRow: 130,
  },
  bradesco: {
    headerRow: 132,
    parceladasStart: 135,
    parceladasEnd: 152,
    avulsasStart: 154,
    avulsasEnd: 178,
    subtotalRow: 179,
  },
  totalGeralRow: 181,
  receitasStart: 186,
  receitasEnd: 193,
  despesasFixasStart: 198,
  despesasFixasEnd: 207,
  aportesStart: 213,
  aportesEnd: 217,
  balancoFinalRow: 220,
  sobraRealRow: 224,
  categoriaStart: 230,
  categoriaEnd: 240,
} as const;

// Colunas usadas nas seções de Recorrentes/Parceladas/Avulsas:
// B=Descrição, C=Categoria, D=Parcela Atual, E=Qtd, F=Custo por Parcela, G=Valor Parcial
export const MONTHLY_COLUMNS = {
  descricao: "B",
  categoria: "C",
  parcelaAtual: "D",
  qtd: "E",
  custoPorParcela: "F",
  valorParcial: "G",
} as const;

// Colunas da aba Parcelamentos (não afetada pela Fase 0):
// B=Descrição, C=Cartão, D=Categoria, E=Mês início, F=Nº parcelas, G=Custo por parcela
export const PARCELAMENTOS_COLUMNS = {
  descricao: "B",
  cartao: "C",
  categoria: "D",
  mesInicio: "E",
  numParcelas: "F",
  custoPorParcela: "G",
  antecipacaoMes: "H",
  antecipacaoQtd: "I",
  antecipacaoValor: "J",
} as const;

export const PARCELAMENTOS_START_ROW = 7;
export const PARCELAMENTOS_END_ROW = 46; // capacidade: 40 compras simultâneas
