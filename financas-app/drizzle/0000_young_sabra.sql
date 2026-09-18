CREATE TABLE `categoria_mes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mes` text NOT NULL,
	`categoria` text NOT NULL,
	`valor` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `linhas_cartao` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mes` text NOT NULL,
	`cartao` text NOT NULL,
	`tipo` text NOT NULL,
	`descricao` text NOT NULL,
	`categoria` text NOT NULL,
	`parcela_atual` text,
	`qtd` real NOT NULL,
	`custo_por_parcela` real NOT NULL,
	`valor_parcial` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `linhas_simples` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mes` text NOT NULL,
	`secao` text NOT NULL,
	`descricao` text NOT NULL,
	`valor` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `parcelamentos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`descricao` text NOT NULL,
	`cartao` text NOT NULL,
	`categoria` text NOT NULL,
	`mes_inicio` text NOT NULL,
	`num_parcelas` integer NOT NULL,
	`custo_por_parcela` real NOT NULL,
	`antecipacao_mes` text,
	`antecipacao_qtd` integer,
	`antecipacao_valor` real
);
--> statement-breakpoint
CREATE TABLE `resumo_mes` (
	`mes` text PRIMARY KEY NOT NULL,
	`receitas` real NOT NULL,
	`total_nubank` real NOT NULL,
	`total_xp` real NOT NULL,
	`total_bradesco` real NOT NULL,
	`total_cartoes` real NOT NULL,
	`despesas_fixas` real NOT NULL,
	`aportes` real NOT NULL,
	`balanco_final` real NOT NULL,
	`sobra_real` real NOT NULL,
	`saldo_devedor_a_vencer` real NOT NULL
);
