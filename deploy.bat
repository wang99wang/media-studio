@echo off
cd /d "%~dp0"
echo === media-studio deploy to GitHub Pages ===
git add -A
git diff --cached --quiet
if %errorlevel%==0 (
  echo No changes, nothing to deploy.
  pause
  exit /b
)
git commit -m "update %date% %time%"
git push
echo === Pushed. GitHub Pages will rebuild in about 1 minute. ===
echo === Then open: https://wang99wang.github.io/media-studio/ ===
pause
