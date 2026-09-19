param([string]$CredentialsPath = '.env.oauth')
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $CredentialsPath)) { throw "OAuth credentials file is missing: $CredentialsPath" }
foreach ($line in Get-Content -LiteralPath $CredentialsPath) {
    if ($line -match '^\s*(GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|GITHUB_CLIENT_ID|GITHUB_CLIENT_SECRET)\s*=\s*(.*?)\s*$') {
        $credentialValue = $Matches[2].Trim().Trim('"').Trim("'")
        [Environment]::SetEnvironmentVariable($Matches[1], $credentialValue, 'Process')
    }
}
if (-not $env:GOOGLE_CLIENT_ID) { $env:GOOGLE_CLIENT_ID = '958293032322-gl9246onnlgchck7jrrlgdgt7b5p3l5b.apps.googleusercontent.com' }
if (-not $env:GITHUB_CLIENT_ID) { $env:GITHUB_CLIENT_ID = 'Ov23li0oBOl9CTu7KNzR' }
foreach ($name in @('GOOGLE_CLIENT_SECRET','GITHUB_CLIENT_SECRET')) {
    if (-not [Environment]::GetEnvironmentVariable($name, 'Process')) { throw "Missing $name in local credentials file" }
}
$configPath = Join-Path $PSScriptRoot '../config.toml'
$configText = Get-Content -LiteralPath $configPath -Raw
foreach ($provider in @('google','github')) {
    $configText = [regex]::Replace($configText, '(?m)(\[auth\.external\.' + $provider + '\]\r?\nenabled = )false', '${1}true')
}
[IO.File]::WriteAllText((Resolve-Path -LiteralPath $configPath), $configText)
# CLI secret values are resolved from process environment; never written to config.toml.
& supabase.cmd config push --project-ref ghjdpcvnzclfvyosfhoz --yes
if ($LASTEXITCODE -ne 0) { throw 'OAuth configuration push failed' }
