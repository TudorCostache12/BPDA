# Script pentru deploy pe MultiversX Devnet
# Rulare: .\deploy.ps1 -WalletPem "path\to\wallet.pem"

param(
    [Parameter(Mandatory=$true)]
    [string]$WalletPem
)

$ErrorActionPreference = "Stop"

# Configurare
$ContractWasm = "..\document-verification\output\document-verification.wasm"
$Proxy = "https://devnet-gateway.multiversx.com"
$ChainId = "D"
$GasLimit = 100000000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy Document Verification Contract" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Verifică dacă contractul este compilat
if (-not (Test-Path $ContractWasm)) {
    Write-Host "Eroare: Contractul nu este compilat!" -ForegroundColor Red
    Write-Host "Rulează mai întâi: cd document-verification; sc-meta all build" -ForegroundColor Yellow
    exit 1
}

# Verifică dacă fișierul PEM există
if (-not (Test-Path $WalletPem)) {
    Write-Host "Eroare: Fișierul PEM nu există: $WalletPem" -ForegroundColor Red
    exit 1
}

Write-Host "`nDeploying contract..." -ForegroundColor Green

# Deploy contract
$deployResult = mxpy contract deploy `
    --bytecode $ContractWasm `
    --pem $WalletPem `
    --proxy $Proxy `
    --chain $ChainId `
    --gas-limit $GasLimit `
    --send 2>&1

Write-Host $deployResult

# Extrage adresa contractului
$contractAddress = $deployResult | Select-String -Pattern "erd1[a-z0-9]+" | ForEach-Object { $_.Matches[0].Value } | Select-Object -Last 1

if ($contractAddress) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  Contract deployed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Contract Address: $contractAddress" -ForegroundColor Yellow
    Write-Host "`nActualizează config.ts cu această adresă!" -ForegroundColor Cyan
    Write-Host "Explorer: https://devnet-explorer.multiversx.com/accounts/$contractAddress" -ForegroundColor Blue
} else {
    Write-Host "Verifică output-ul pentru detalii despre deploy." -ForegroundColor Yellow
}
