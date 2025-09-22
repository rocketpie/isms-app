# Use docker to debug app locally
`./scripts/npm.ps1`

optionally reset the build cache
`rm -rf .next`

then
`npm run dev`

don't forget to
`npm install --package-lock-only`

# Sync to dockerhost
up top, click the search bar > Run Task > Sync to docker host

# enable execute init scripts
chmod +x supabase/init/000_reset.sh
chmod +x supabase/init/001_bootstrap.sh
...

# Option: Reset
~/isms-app$ ./reset.sh

# Start App
~/isms-app$ ./reset.sh

might as well 
~/isms-app$ ./test.sh

# Troubleshoot containers
docker compose logs -f db auth postgrest web



# run db queries through docker

## eg. Confirm what’s in the DB right now
docker exec -it isms-app-db-1 sh -lc '
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1 \
    -c "select schema_name from information_schema.schemata where schema_name in ('\''auth'\'','\''app'\'','\''isms'\'');" \
    -c "\dn" \
    -c "\dt auth.*" \
    -c "\dt isms.*"
'
## eg. search for exposed functions
docker exec -it isms-app-db-1 sh -lc '
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1 \
    -c "SELECT routine_schema, routine_name FROM information_schema.routines WHERE routine_name = '\''whoami'\'';"
'


