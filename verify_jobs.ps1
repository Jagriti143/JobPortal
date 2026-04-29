Start-Sleep 4
Write-Host "=== Gateway Check ==="
$gw = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($gw) { Write-Host "[OK] API Gateway running on port 5000" }
else { Write-Host "[FAIL] Gateway not on port 5000" }

Write-Host "`n=== Job Search Test ==="
try {
    $search = Invoke-WebRequest -Uri "http://localhost:5000/gateway/jobs/search" -TimeoutSec 5 -UseBasicParsing
    $json = $search.Content | ConvertFrom-Json
    Write-Host "Total jobs: $($json.data.total)"
    if ($json.data.jobs.Count -gt 0) {
        foreach ($job in $json.data.jobs) {
            Write-Host "  - $($job.title) @ $($job.companyName) | $($job.location) | $($job.jobType)"
        }
    } else {
        Write-Host "  No jobs returned from search"
    }
} catch {
    Write-Host "Search error: $($_.Exception.Message)"
}

# Cleanup
Remove-Item "$PSScriptRoot\check_jobs.ps1" -Force -ErrorAction SilentlyContinue
