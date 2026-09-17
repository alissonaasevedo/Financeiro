#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="financas-app"

echo "==> Criando projeto Next.js ($PROJECT_NAME)..."
npx --yes create-next-app@latest "$PROJECT_NAME" \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias "@/*" \
  --use-npm \
  --no-turbopack

cd "$PROJECT_NAME"

echo "==> Instalando dependências principais..."
npm install exceljs recharts date-fns clsx tailwind-merge

echo "==> Instalando dependências de banco (Turso/libSQL)..."
npm install @libsql/client drizzle-orm
npm install -D drizzle-kit

echo "==> Configurando shadcn/ui..."
npx --yes shadcn@latest init -d -y

echo "==> Adicionando componentes shadcn essenciais..."
npx --yes shadcn@latest add button card input label select table tabs badge dialog -y

echo "==> Criando estrutura de pastas..."
mkdir -p lib/parser lib/db "app/mes/[slug]" app/parcelamentos app/lancar \
  app/api/importar app/api/exportar components/dashboard components/charts components/forms

echo "==> Copiando CLAUDE.md para a raiz do projeto..."
cp ../CLAUDE.md ./CLAUDE.md

echo "Concluido setup_run.sh"
