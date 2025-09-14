#!/usr/bin/env bash

echo "docker compose down..."
docker compose down

echo "docker volume rm isms-app_db_data..."
docker volume rm isms-app_db_data