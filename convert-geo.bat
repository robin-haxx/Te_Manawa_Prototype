@echo off
rem ============================================================
rem  Double-click this to rebuild the terrain geography.
rem  It reads   geo\manawatu.svg   (edit that in Inkscape/etc.)
rem  and writes geo\manawatu.geo.js (what the sim loads).
rem  Then just reload the sim.
rem ============================================================
cd /d "%~dp0"
node tools\svg2geo.js
echo.
if %errorlevel%==0 (
  echo Done. Reload the sim to see your changes.
) else (
  echo Something went wrong - check the message above.
)
echo.
pause
