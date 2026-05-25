cd backend && docker compose up --build
docker compose exec backend python scripts/migrate.py
docker compose exec backend python scripts/seed_daily.py
cd ../frontend && npm install && npm run dev