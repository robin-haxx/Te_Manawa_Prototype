# Te Manawa — keep the kiosk shell running.
# Starts TeManawa.exe and starts it again whenever it exits (a crash, or the nightly relaunch
# losing a race). install_autostart.ps1 registers this script to run at logon; run it by hand with:
#   powershell -ExecutionPolicy Bypass -File run_temanawa.ps1
$exe = Join-Path $PSScriptRoot 'TeManawa.exe'
if (-not (Test-Path $exe)) { Write-Error "TeManawa.exe not found beside this script ($PSScriptRoot)"; exit 1 }
while ($true) {
  $p = Start-Process -FilePath $exe -WorkingDirectory $PSScriptRoot -PassThru -Wait
  # A second copy that found the first already running exits at once; do not spin on it.
  Start-Sleep -Seconds 5
}
