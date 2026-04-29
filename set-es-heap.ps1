$esHome = "C:\Users\Karan\AppData\Local\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState\sessions\133F8400B0C4AEE820C23ECB61B6473F3889F1AE\transfers\2026-13\elasticsearch-9.3.2"
$dir = "$esHome\config\jvm.options.d"
New-Item -ItemType Directory -Path $dir -Force | Out-Null
Set-Content -Path "$dir\heap.options" -Value @("-Xms512m", "-Xmx512m")
Write-Host "Done. Heap set to 512m:"
Get-Content "$dir\heap.options"
