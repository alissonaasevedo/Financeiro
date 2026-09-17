# Projeto: Controle Financeiro Asevedo → Web App

## Contexto para o Claude Code

Este arquivo é o briefing completo do projeto. Cole-o como `CLAUDE.md` na raiz do
repositório (Claude Code lê esse arquivo automaticamente) e comece pedindo:
`Leia o CLAUDE.md e execute a Fase 0.`

O objetivo final: transformar a planilha `Planilha de GASTOS e CONTROLE FINANCEIRO.xlsx`
(hoje no Google Drive, pasta "PLANILHA FINANCEIRA E DE GASTOS") em um aplicativo web
limpo, bonito e automatizado, hospedado na Vercel — sem perder a planilha como fonte
de dados: ela continua sendo o "banco de dados" editável; o app é a camada de
visualização e lançamento rápido.

---

## 0. Estado atual — o que já existe e por quê isso importa

A planilha foi construída em Python/openpyxl e tem uma arquitetura específica que
**precisa ser respeitada** por qualquer parser:

### Abas
- `Guia` — instruções de uso (texto)
- `Parcelamentos` — cadastro único de cada compra parcelada. Colunas B–G:
  Descrição, Cartão, Categoria, Mês de início, Nº de parcelas, Custo por Parcela.
  Colunas H–J são antecipação opcional. Colunas K–S são calculadas (Total a pagar,
  Último mês na fatura, Alerta). Capacidade: 40 linhas (linhas 7–46).
- `Out 2026` … `Dez 2027` — 15 abas mensais, **todas com o mesmo layout de linhas**:
  - Linha 5: header "CARTÃO NUBANK"
  - Linhas 8–15: Recorrentes (manual)
  - Linhas 16–44: Parceladas (fórmulas — puxam de `Parcelamentos` via INDEX/MATCH
    usando uma coluna auxiliar H com código posicional)
  - Linhas 46–65: Avulsas (manual) — **20 linhas de capacidade**
  - Linha 66: Subtotal Nubank
  - Linhas 68–100: bloco idêntico para XP
  - Linhas 102–134: bloco idêntico para Bradesco
  - Linha 136: Total Geral dos Cartões
  - Linhas 139–149: Receitas
  - Linhas 151–163: Despesas Fixas
  - Linhas 165–173: Aportes e Reserva
  - Linhas 175–179: Balanço Final / Sobra Real
  - Linhas 182–196: Gastos por Categoria (painel, soma por texto exato)
- `Resumo Geral` — consolida os 15 meses. **Referencia células absolutas de cada
  aba mensal** (ex.: `='Out 2026'!G66`, `='Out 2026'!F149`, `='Out 2026'!F185`
  até F195 para o painel de categorias). Isso é o ponto mais frágil da planilha:
  qualquer inserção de linha em uma aba mensal quebra essas referências se não
  forem recalculadas.
- `Listas` — colunas de apoio para os dropdowns: A = Meses, C = Cartões
  (Nubank/XP/Bradesco), E = Categorias (Clínica/PJ, Saúde, Moradia, Alimentação,
  Transporte, Educação/Estudos, Lazer, Assinaturas, Vestuário, Impostos/Taxas,
  Outros).

### Limitação conhecida — capacidade fixa das abas mensais
As seções "Compras Avulsas" de cada cartão têm um número fixo de linhas em
branco (hoje ~20 para Nubank, menos para XP/Bradesco). Quando enchem, não dá
para simplesmente inserir linhas com openpyxl: isso desloca fisicamente as
células mas **não atualiza o texto das fórmulas** (nem dentro da própria aba,
nem as referências cruzadas em `Resumo Geral`), gerando `#REF!` silenciosos.

**Tarefa da Fase 1**: escrever um script Python (openpyxl) que:
1. Insere N linhas no ponto certo de uma aba mensal (ex.: antes do `SUBTOTAL`
   de um cartão).
2. Localiza **todas** as fórmulas cuja referência de linha seja `>=` ao ponto
   de inserção — tanto dentro da mesma aba (referências sem prefixo de aba)
   quanto em `'Nome da Aba'!` explícito em outras abas — e soma N ao número da
   linha, via regex, sem tocar em referências a *outras* abas (ex.: não mexer
   em `Parcelamentos!$B$7:$B$46`).
3. Reaplica formatação (bordas, número, dropdown de validação) das novas linhas
   copiando de uma linha-modelo já existente na mesma seção.
4. Roda um teste automatizado: abre o arquivo com uma lib de avaliação de
   fórmulas (ex. `formulas` ou LibreOffice headless `--convert-to xlsx`) e
   confere que os totais batem antes/depois da expansão.
5. Aplica o mesmo procedimento, com o mesmo N, às 15 abas — mantendo-as
   espelhadas.

Isso deixa a planilha com folga permanente e sem risco de quebrar o Resumo
Geral. Faça isso ANTES de construir o parser do app (Fase 2), porque o parser
vai assumir os números de linha como constantes — se mudar a estrutura depois,
o parser quebra.

---

## 1. Objetivo do app

- Visual limpo e organizado — nada de planilha "crua" na tela.
- Dashboard mensal: total por cartão, categoria, balanço, sobra real.
- Lançamento rápido de gastos avulsos (formulário simples, sem abrir Excel).
- Visualização do cronograma de parcelamentos (o que já está comprometido nos
  próximos meses).
- Upload de extrato (CSV do banco) com sugestão automática de categoria por
  nome do estabelecimento (heurística simples de string matching contra
  histórico já categorizado).
- Mobile-first — é para ser usado no dia a dia, no celular.

## 2. Estratégia de dados (decisão importante)

Duas opções, recomendo a **A** para o MVP:

**A. Planilha como fonte, sincronização por importação**
O app lê o `.xlsx` (via upload manual ou Google Drive API com conta de
serviço), converte para JSON e guarda em um banco leve (SQLite via
`@vercel/postgres` ou `Turso`/`libSQL`, que funciona bem na Vercel). Toda
edição feita no app é *também* escrita de volta no xlsx (via `exceljs`, que
preserva fórmulas melhor que `xlsx`/SheetJS para isso) — ou, mais simples no
começo, o app só lê; lançamentos novos ficam pendentes de "exportar para a
planilha" com um botão que gera um `.xlsx` atualizado para download/re-upload.

**B. Google Sheets API nativo**
Migra a "fonte da verdade" para Google Sheets (não Excel local), usando a API
oficial para ler/escrever células específicas em tempo real. Mais elegante a
longo prazo, mas exige OAuth e é mais trabalho de setup. Deixe para uma fase
2 do projeto, depois que o app já estiver validado com a opção A.

## 3. Stack recomendada

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui** (componentes limpos, acessíveis, fáceis de
  customizar)
- **Recharts** para os gráficos (categoria, evolução mensal)
- **exceljs** para ler/escrever o `.xlsx` preservando fórmulas e formatação
- **Turso (libSQL)** ou **Vercel Postgres** como cache/estado do app
- Deploy: **Vercel** (óbvio, dado o objetivo)

## 4. Estrutura de pastas sugerida

```
financas-app/
├── app/
│   ├── page.tsx                 # Dashboard do mês corrente
│   ├── mes/[slug]/page.tsx      # Detalhe de um mês (ex: /mes/out-2026)
│   ├── parcelamentos/page.tsx   # Lista + cadastro de parcelamentos
│   ├── lancar/page.tsx          # Formulário rápido de gasto avulso
│   └── api/
│       ├── importar/route.ts    # Recebe .xlsx, faz parse, popula o banco
│       └── exportar/route.ts    # Gera .xlsx atualizado para download
├── lib/
│   ├── parser/
│   │   ├── workbook-map.ts      # Constantes de linha/coluna (ver Fase 0)
│   │   └── parse-workbook.ts    # Lê o xlsx e retorna objetos tipados
│   ├── db/schema.ts
│   └── categorize.ts            # Heurística de categorização automática
├── components/
│   ├── dashboard/
│   ├── charts/
│   └── forms/
└── CLAUDE.md                    # este arquivo
```

## 5. Modelo de dados (TypeScript, espelha a planilha)

```typescript
type Cartao = "Nubank" | "XP" | "Bradesco";

type Categoria =
  | "Clínica / PJ" | "Saúde" | "Moradia" | "Alimentação" | "Transporte"
  | "Educação / Estudos" | "Lazer" | "Assinaturas" | "Vestuário"
  | "Impostos / Taxas" | "Outros";

interface Parcelamento {
  descricao: string;
  cartao: Cartao;
  categoria: Categoria;
  mesInicio: string;       // ex: "Out 2026"
  numParcelas: number;
  custoPorParcela: number;
  antecipacao?: {
    mes: string;
    qtdAntecipada: number;
    valorPago?: number;
  };
}

interface GastoAvulso {
  descricao: string;
  categoria: Categoria;
  cartao: Cartao;
  valor: number;
  mes: string;
}

interface Recorrente {
  descricao: string;
  categoria: Categoria;
  cartao: Cartao;
  valorMensal: number;
}

interface ResumoMes {
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
  porCategoria: Record<Categoria, number>;
}
```

## 6. Roteiro de execução (peça ao Claude Code para seguir nesta ordem)

1. **Fase 0** — expandir a capacidade das abas mensais na planilha
   (script Python descrito acima), testar, e só então baixar a versão final
   do Drive para usar como referência fixa de estrutura.
2. **Fase 1** — `npx create-next-app@latest financas-app --typescript
   --tailwind --app` e configurar shadcn/ui.
3. **Fase 2** — escrever `lib/parser/parse-workbook.ts` usando `exceljs`,
   baseado no mapa de linhas da Fase 0. Testar com o `.xlsx` real.
4. **Fase 3** — modelar o banco (schema acima) e o endpoint `/api/importar`.
5. **Fase 4** — construir o Dashboard (`app/page.tsx`) com os cards de
   resumo, gráfico de categorias (Recharts) e lista de parcelamentos ativos.
6. **Fase 5** — formulário de lançamento rápido (`/lancar`) que grava no
   banco e permite exportar o `.xlsx` atualizado.
7. **Fase 6** — deploy na Vercel, configurar domínio se desejar.
8. **Fase 7** (opcional, depois de validado) — migrar para Google Sheets API
   para sincronização em tempo real, eliminando o passo manual de
   importar/exportar.

## 7. Preferências de estilo (aplicar em todo o app)

- Respostas diretas, sem enrolação, linha de raciocínio clara — mesma
  preferência já vale para os commits e PRs.
- Nomes de arquivos/variáveis em português quando fizer sentido para domínio
  (ex.: `parcelamento`, `sobraReal`), em inglês para termos técnicos.
- Paleta de cores do app pode espelhar a legenda da planilha: Nubank
  (roxo/lavanda), XP (cinza), Bradesco (vermelho/rosa), Receitas (verde),
  Despesas fixas (âmbar), Aportes (azul) — mantém a familiaridade visual.
