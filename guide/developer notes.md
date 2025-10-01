# Don't forget!
occasionally run 
~/isms-app$ docker system prune

# lint typescript files 
npx prettier --check "**/*.{ts,tsx,js,jsx,json}"
npx prettier --write "**/*.{ts,tsx,js,jsx,json}"


# Use docker to debug app locally
`./scripts/npm.ps1`
`cd web/`

optionally reset the build cache
`rm -rf .next`

then
`npm run dev`

# List documentation files
guide\kb> ls | %{ "- $($_.name.Replace('.md', '')) " }


# Sync and start on dockerhost
up top, click the search bar > Run Task > Sync to docker host

## enable execute init scripts
chmod +x supabase/init/000_reset.sh
chmod +x supabase/init/001_bootstrap.sh
...

## Start App without DB Init
docker compose up -d --build

## Restart App with DB Init
~/isms-app$ ./reset.sh
~/isms-app$ ./start.sh
~/isms-app$ ./test.sh



# Troubleshoot containers
docker compose logs -f db auth postgrest web

## eg. Confirm what’s in the DB right now
~/isms-app$ docker compose exec db sh -lc '
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1 \
    -c "select schema_name from information_schema.schemata where schema_name in ('\''auth'\'','\''app'\'','\''isms'\'');" \
    -c "\dn" \
    -c "\dt auth.*" \
    -c "\dt isms.*"
'
## eg. search for exposed functions
~/isms-app$ docker compose exec db sh -lc '
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -h 127.0.0.1 \
    -c "SELECT routine_schema, routine_name FROM information_schema.routines WHERE routine_name = '\''whoami'\'';"
'

## eg. confirm API availability
~/isms-app$ docker compose exec web sh -lc '
apk add --no-cache curl
echo $INTERNAL_GOTRUE_URL
curl -i $INTERNAL_GOTRUE_URL/settings

echo $INTERNAL_POSTGREST_URL
curl -i $INTERNAL_POSTGREST_URL/
'

