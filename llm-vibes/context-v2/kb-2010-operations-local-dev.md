---
title: Local Dev
tags: []
relates_to: []
---

# Steps:
* run vscode task 'docker npm' 
* cd /web
* npm run dev
* visit http://localhost:3000/

# Details:
* 'docker npm' calls scritps/npm.ps1 
* npm.ps1 call docker run -it --rm --mount "type=bind,src=$(Join-Path $PSScriptRoot ..\docker\web),dst=/web" -p 3000:3000 --entrypoint sh node:22-alpine
