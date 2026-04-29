$esHome = "C:\Users\Karan\AppData\Local\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState\sessions\133F8400B0C4AEE820C23ECB61B6473F3889F1AE\transfers\2026-13\elasticsearch-9.3.2"
$configPath = "$esHome\config\elasticsearch.yml"

$newSecurityBlock = @"

#----------------------- BEGIN SECURITY AUTO CONFIGURATION -----------------------
# Security disabled for local development
xpack.security.enabled: false
xpack.security.enrollment.enabled: false

xpack.security.http.ssl:
  enabled: false

xpack.security.transport.ssl:
  enabled: false
  verification_mode: certificate

cluster.initial_master_nodes: ["SYSTUMM"]

http.host: 0.0.0.0

#----------------------- END SECURITY AUTO CONFIGURATION -----------------------
"@

# Read the file and strip everything from BEGIN SECURITY block to END
$content = Get-Content $configPath -Raw
$content = $content -replace '(?s)#-+ BEGIN SECURITY AUTO CONFIGURATION -+.*?#-+ END SECURITY AUTO CONFIGURATION -+', $newSecurityBlock.Trim()

Set-Content $configPath $content -Encoding UTF8
Write-Host "Done - elasticsearch.yml fixed"
Get-Content $configPath | Select-String "xpack|ssl|security|cluster.initial"
