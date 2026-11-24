$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$envFile = Join-Path $repoRoot '.env'
$envExample = Join-Path $repoRoot '.env.example'

if (Test-Path $envFile) {
    throw '.env already exists - refusing to overwrite it.'
}

if (-not (Test-Path $envExample)) {
    throw '.env.example was not found in the project root.'
}

function New-RandomSecret {
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $bytes = New-Object byte[] 32
        $generator.GetBytes($bytes)
        return [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $generator.Dispose()
    }
}

Copy-Item $envExample $envFile
$content = [System.IO.File]::ReadAllText($envFile)
$content = [regex]::Replace($content, '(?m)^JWT_SEC=.*$', "JWT_SEC=$(New-RandomSecret)")
$content = [regex]::Replace($content, '(?m)^INTERNAL_API_KEY=.*$', "INTERNAL_API_KEY=$(New-RandomSecret)")
[System.IO.File]::WriteAllText($envFile, $content, [System.Text.UTF8Encoding]::new($false))

Write-Host 'Created .env with fresh JWT_SEC and INTERNAL_API_KEY values.'
Write-Host 'Fill in DB_URL and any external provider credentials before starting Docker.'
