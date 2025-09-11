
chmod +x supabase/init/000_reset.sh
chmod +x supabase/init/001_bootstrap.sh
tree
.
├── docker-compose.yml
└── supabase
    └── init
        ├── 000_reset.sh
        ├── 001_bootstrap.sh
        ├── 005_app.sql
        ├── 007_audit.sql
        ├── 010_isms.sql
        └── 020_policies.sql


docker compose up -d --build
docker compose exec db /docker-entrypoint-initdb.d/000_reset.sh
# apply bootstrap + SQL (run once per fresh reset)
docker compose exec db /docker-entrypoint-initdb.d/001_bootstrap.sh
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/005_app.sql
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/007_audit.sql
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/010_isms.sql
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/020_policies.sql

