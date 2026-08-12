set RELAYER_DIR=%~dp0server\app\relayer
wt -w 0 new-tab --title "Relayer 1" -d "%RELAYER_DIR%" cmd /k run_relayer1.bat ; new-tab --title "Relayer 2" -d "%RELAYER_DIR%" cmd /k run_relayer2.bat ; new-tab --title "Relayer 3" -d "%RELAYER_DIR%" cmd /k run_relayer3.bat
