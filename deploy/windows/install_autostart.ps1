# Te Manawa — register the kiosk to start at logon and come back if it exits.
# Run ONCE, as an administrator, from the folder that holds TeManawa.exe:
#   powershell -ExecutionPolicy Bypass -File install_autostart.ps1
# Undo with:
#   powershell -ExecutionPolicy Bypass -File install_autostart.ps1 -Remove
#
# It registers a Task Scheduler task that runs run_temanawa.ps1 (hidden) whenever this user logs on,
# and turns off display and standby timeouts on mains power. Set the PC to log this user on
# automatically (Settings → Accounts, or Sysinternals Autologon) so a power cycle needs no hands.
param([switch]$Remove, [string]$TaskName = 'Te Manawa kiosk')

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Removed scheduled task '$TaskName'."
  exit 0
}
$runner = Join-Path $PSScriptRoot 'run_temanawa.ps1'
$exe    = Join-Path $PSScriptRoot 'TeManawa.exe'
if (-not (Test-Path $exe))    { Write-Error "TeManawa.exe not found in $PSScriptRoot"; exit 1 }
if (-not (Test-Path $runner)) { Write-Error "run_temanawa.ps1 not found in $PSScriptRoot"; exit 1 }

$action   = New-ScheduledTaskAction -Execute 'powershell.exe' `
              -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$runner`"" `
              -WorkingDirectory $PSScriptRoot
$trigger  = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) `
              -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew `
              -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
  -RunLevel Limited -Force | Out-Null
Write-Host "Registered scheduled task '$TaskName' (at logon, restarts if it exits)."

# No sleep, no screen-off, on mains power.
powercfg /change standby-timeout-ac 0
powercfg /change monitor-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
Write-Host 'Display and standby timeouts turned off on mains power.'
Write-Host 'Still to do by hand: automatic logon, notifications off, Windows Update active hours, hide the taskbar. See OPERATOR_QUICKSTART.md.'
