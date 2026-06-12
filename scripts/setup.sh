#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v docker &>/dev/null; then
  echo "==> Starting PostgreSQL (Docker)..."
  docker compose up -d
else
  echo "==> Docker yok — Postgres.app kullanılıyor."
  echo "    Postgres.app'in açık olduğundan emin olun."
  PG_BIN="/Applications/Postgres.app/Contents/Versions/latest/bin"
  if [ -x "$PG_BIN/psql" ]; then
    export PATH="$PG_BIN:$PATH"
    psql -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='isg_risk_db'" | grep -q 1 || \
      psql -d postgres -c "CREATE DATABASE isg_risk_db;"
  fi
fi

echo "==> Setting up backend..."
cd backend
npm install
npm run db:setup

echo "==> Setting up web..."
cd "$ROOT/web"
npm install

if command -v flutter &>/dev/null; then
  echo "==> Setting up mobile..."
  cd "$ROOT/mobile"
  flutter pub get
fi

echo ""
echo "Setup complete!"
echo "  Backend:  cd backend && npm run dev"
echo "  Web:      cd web && npm run dev"
echo "  Mobile:   cd mobile && flutter run"
echo ""
echo "Demo accounts:"
echo "  Admin:    admin@isg.com / admin123"
echo "  Employee: calisan@isg.com / employee123"
