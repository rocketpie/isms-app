# ----- config -----
$StubRoot = "./kb_stubs"
$KBRoot = "./kb"
$Owner = "devops"
$Overwrite = $false   # set $true to overwrite existing files in ./kb
$Date = Get-Date -Format 'yyyy-MM-dd'

# Relative file list
$Files = @(
    '00-index/00-overview.md', 
    '00-index/10-glossary.md',
    '00-index/20-faq.md',
    '10-architecture/10-system-context.md', 
    '10-architecture/20-component-postgres.md',
    '10-architecture/21-component-postgrest.md',
    '10-architecture/22-component-gotrue.md',
    '10-architecture/23-component-nextjs.md',
    '10-architecture/30-sequence-auth-flow.md',
    '10-architecture/40-data-flow-requests.md',
    '20-operations/10-local-dev.md',
    '20-operations/20-docker-compose.md',
    '20-operations/30-env-variables.md',
    '20-operations/40-bootstrap-db.md',
    '20-operations/50-migrations.md',
    '20-operations/60-smoke-tests.md',
    '20-operations/70-logs-and-debug.md',
    '20-operations/80-backup-restore.md',
    '30-apis-and-schema/10-db-schema-overview.md',
    '30-apis-and-schema/20-postgrest-routes.md',
    '30-apis-and-schema/30-rpc-examples.md',
    '30-apis-and-schema/40-row-level-security.md',
    '40-security/10-secrets-handling.md',
    '40-security/20-authn-authz-matrix.md',
    '40-security/30-threat-model.md',
    '40-security/40-hardening-checklist.md',
    '50-nextjs-app/10-app-structure.md',
    '50-nextjs-app/20-api-routes.md',
    '50-nextjs-app/30-client-auth-helpers.md',
    '50-nextjs-app/40-error-boundaries.md',
    '60-runbooks/10-runbook-first-start.md',
    '60-runbooks/20-runbook-ci-cd.md',
    '60-runbooks/30-runbook-prod-deploy.md',
    '60-runbooks/40-runbook-incident.md',
    '99-reference/10-decisions-log.md', 
    '99-reference/20-changelog.md'
)

function Convert-ToTitle {
    param([string]$RelPath)
    $name = [System.IO.Path]::GetFileNameWithoutExtension($RelPath)
    # strip leading NN- prefix
    $name = ($name -replace '^\d{2,}-', '')
    # friendly replacements
    $name = $name -replace 'api', 'API' -replace 'rls', 'RLS' -replace 'db', 'DB' -replace 'ci-cd', 'CI/CD'
    # dashes -> spaces, title case
    ($name -replace '-', ' ') -replace '\b(\w)', { $_.Groups[1].Value.ToUpper() }
}

function Get-Template {
    param([string]$RelPath, [string]$Title)

    $frontMatter = @"
---
title: $Title
tags: []
owner: $Owner
updated: $Date
relates_to: []
---
"@

    switch -regex ($RelPath) {
        '^00-index/00-overview\.md$' {
            return $frontMatter + @"
**Purpose**: One-paragraph summary of the stack and pointers.

**Stack**: Postgres, PostgREST, GoTrue, Next.js, Docker.

**Map**:
- Architecture → \`/kb/10-architecture/\`
- Operations → \`/kb/20-operations/\`
- APIs & Schema → \`/kb/30-apis-and-schema/\`
- Security → \`/kb/40-security/\`
- App → \`/kb/50-nextjs-app/\`
- Runbooks → \`/kb/60-runbooks/\`
"@
        }
        '^00-index/10-glossary\.md$' {
            return $frontMatter + @"
- **RLS**: Row-Level Security in Postgres.
- **Service role**: Bypasses RLS; server-only.
- **RPC**: PostgREST function endpoint.
"@
        }
        '^00-index/20-faq\.md$' {
            return $frontMatter + @"
**Q:** How do I run locally?  
**A:** See \`/kb/20-operations/10-local-dev.md\`.

**Q:** Why 401 from PostgREST?  
**A:** Check JWT issuer/roles and RLS policies.
"@
        }
        '^10-architecture/2\d-component-' {
            return $frontMatter + @"
**Purpose**: What this component does.

**Inputs**:  
**Outputs**:  
**Critical config**:  
**Gotchas**:
- …
"@
        }
        '^10-architecture/' {
            return $frontMatter + @"
**Purpose**: High-level view.

**Key flows**:
1. …
2. …

**Diagrams**: (add Mermaid or links)
"@
        }
        '^20-operations/20-docker-compose\.md$' {
            return $frontMatter + @"
**Services**: names, ports, healthchecks.

**Dependencies**: \`depends_on\`, networks.

**Notes**:
- Expose only Next.js to host.
"@
        }
        '^20-operations/60-smoke-tests\.md$' {
            return $frontMatter + @"
**Goal**: Prove the stack is healthy.

1) DB reachable  
\`\`\`bash
psql $env:DATABASE_URL -c "select 1"
\`\`\`

2) GoTrue health  
\`\`\`bash
curl -f http://localhost:9999/health
\`\`\`

3) Auth flow → PostgREST (fill in endpoints)
"@
        }
        '^20-operations/' {
            return $frontMatter + @"
**Context**: …

**Steps**:
1. …
2. …

**Troubleshooting**:
- Symptom → Likely cause
"@
        }
        '^30-apis-and-schema/40-row-level-security\.md$' {
            return $frontMatter + @"
**Table policies** (examples):

\`\`\`sql
-- enable RLS and add basic self-access policies
-- (replace table/column names)
\`\`\`
"@
        }
        '^30-apis-and-schema/' {
            return $frontMatter + @"
**Overview**: …

**Examples**:
- Request → Response

**Conventions**:
- …
"@
        }
        '^40-security/' {
            return $frontMatter + @"
**Risks**: top items.

**Controls**:
- …

**Checklists**:
- …
"@
        }
        '^50-nextjs-app/' {
            return $frontMatter + @"
**Structure**: routes/components.

**Auth**: token handling (SSR/CSR).

**Patterns**:
- Error handling
- Data fetching
"@
        }
        '^60-runbooks/' {
            return $frontMatter + @"
**When**: Trigger conditions.

**Steps (copy/paste ready)**:
1. …
2. …

**Rollback**:
- …

**Verification**:
- …
"@
        }
        '^99-reference/10-decisions-log\.md$' {
            return $frontMatter + @"
- **ADR-000**: Title  
  - Context: …  
  - Decision: …  
  - Consequences: …
"@
        }
        default {
            return $frontMatter + @"
**Purpose**: …

**Notes**:
- …
"@
        }
    }
}

# ----- create stubs under ./kb_stubs -----
foreach ($rel in $Files) {
    $title = Convert-ToTitle $rel
    $content = Get-Template -RelPath $rel -Title $title

    $stubPath = Join-Path $StubRoot $rel
    $stubDir = Split-Path $stubPath -Parent
    New-Item -ItemType Directory -Path $stubDir -Force -ErrorAction SilentlyContinue | Out-Null
    Set-Content -Path $stubPath -Value $content -Encoding UTF8 -NoNewline
}

Write-Host "Stub files created under $StubRoot" -ForegroundColor Green

# ----- copy stubs into final ./kb structure -----
foreach ($rel in $Files) {
    $src = Join-Path $StubRoot $rel
    $dst = Join-Path $KBRoot $rel
    $dstDir = Split-Path $dst -Parent
    New-Item -ItemType Directory -Path $dstDir -Force -ErrorAction SilentlyContinue | Out-Null

    if ((Test-Path $dst) -and (-not $Overwrite)) {
        Write-Host "Skip (exists): $dst"
    }
    else {
        if ($Overwrite) {
            Copy-Item -Path $src -Destination $dst -Force
        }
        else {
            Copy-Item -Path $src -Destination $dst
        }
        Write-Host "Wrote: $dst"
    }
}

Write-Host "Done. Edit files in $KBRoot." -ForegroundColor Green
