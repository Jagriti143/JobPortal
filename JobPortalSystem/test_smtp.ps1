$tcp = New-Object System.Net.Sockets.TcpClient
try {
    $tcp.Connect('smtp.gmail.com', 587)
    Write-Host "SUCCESS: Connected to smtp.gmail.com:587"
    $tcp.Close()
} catch {
    Write-Host "FAILED: $($_.Exception.Message)"
}
