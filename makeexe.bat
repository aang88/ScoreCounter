@echo off
echo Building ScoreCounter executable...
pip install pyinstaller qrcode pillow websockets
pyinstaller --name ScoreCounter --onefile ^
  --add-data "*.html;." ^
  --add-data "*.js;." ^
  --add-data "*.css;." ^
  --hidden-import=PIL._tkinter ^
  --hidden-import=PIL._imagingtk ^
  --hidden-import=PIL._tkinter_finder ^
  app.py

echo.
echo Build complete. Executable is in the 'dist' folder.
echo.
pause