docker run -it --rm --mount "type=bind,src=$(Join-Path $PSScriptRoot ..\docker\web),dst=/web" -p 3000:3000 --entrypoint sh node:22-alpine
