# Генерация dev-сертификатов в общей папке certs/
$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$certPath = Join-Path $rootPath "certs"
$convertScript = Join-Path $rootPath "frontend\convert-cert.js"
$lanIp = "192.168.20.233"

if (-not (Test-Path -LiteralPath $certPath)) {
    New-Item -ItemType Directory -Path $certPath | Out-Null
}

Write-Host "Generating development certificate..." -ForegroundColor Cyan

$cert = New-SelfSignedCertificate `
    -DnsName "localhost" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddYears(2) `
    -FriendlyName "HTA Cleaner Scanner Dev" `
    -KeyUsageProperty All `
    -KeyUsage CertSign, CRLSign, DigitalSignature, KeyEncipherment `
    -TextExtension @("2.5.29.17={text}DNS=localhost&IPAddress=127.0.0.1&IPAddress=$lanIp")

$certPassword = ConvertTo-SecureString -String "dev123" -Force -AsPlainText
$pfxPath = Join-Path $certPath "localhost.pfx"
$crtPath = Join-Path $certPath "localhost.crt"

Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $certPassword | Out-Null

$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
[System.IO.File]::WriteAllBytes($crtPath, $certBytes)

if (Test-Path -LiteralPath $convertScript) {
    & node $convertScript
    if (-not $?) {
        throw "Node certificate conversion failed."
    }
}

Write-Host "Certificate files created in $certPath" -ForegroundColor Green
Write-Host "  - localhost.pfx" -ForegroundColor White
Write-Host "  - localhost.crt" -ForegroundColor White

if (Test-Path -LiteralPath (Join-Path $certPath "localhost.key")) {
    Write-Host "  - localhost.key" -ForegroundColor White
}

if (Test-Path -LiteralPath (Join-Path $certPath "localhost.pem")) {
    Write-Host "  - localhost.pem" -ForegroundColor White
}

Write-Host "" 
Write-Host "To trust this certificate, run:" -ForegroundColor Yellow
Write-Host "Import-Certificate -FilePath '$crtPath' -CertStoreLocation Cert:\CurrentUser\Root" -ForegroundColor White
