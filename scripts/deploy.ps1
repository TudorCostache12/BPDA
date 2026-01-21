# Deploy script for MultiversX Devnet
# Usage: .\deploy.ps1 -WalletPem "path\to\wallet.pem"

param(
    [Parameter(Mandatory=$true)]
    [string]$WalletPem
)

$ErrorActionPreference = "Stop"

# Configuration
$ContractWasm = "..\document-verification\output\document-verification.wasm"
$Proxy = "https://devnet-gateway.multiversx.com"
$ChainId = "D"
$GasLimit = 100000000

if (-not (Test-Path $ContractWasm)) {
    Write-Host "Error: Contract not compiled. Run: cd document-verification; sc-meta all build"
    exit 1
}

if (-not (Test-Path $WalletPem)) {
    Write-Host "Error: PEM file not found: $WalletPem"
    exit 1
}

Write-Host "Deploying contract..."

$deployResult = mxpy contract deploy `
    --bytecode $ContractWasm `
    --pem $WalletPem `
    --proxy $Proxy `
    --chain $ChainId `
    --gas-limit $GasLimit `
    --send 2>&1

Write-Host $deployResult

# Extract contract address from output
$contractAddress = $deployResult | Select-String -Pattern "erd1[a-z0-9]+" | ForEach-Object { $_.Matches[0].Value } | Select-Object -Last 1

if ($contractAddress) {
    Write-Host "Contract Address: $contractAddress"
    Write-Host "Update config.ts with this address."
    Write-Host "Explorer: https://devnet-explorer.multiversx.com/accounts/$contractAddress"
} else {
    Write-Host "Check output for deploy details."
}
