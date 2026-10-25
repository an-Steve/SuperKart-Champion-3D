@echo off
chcp 65001 > nul
title Super Kart Champions 3D
cls
echo ===================================================================
echo             🏎️ SUPER KART CHAMPIONS 3D
echo             🏁 Réalisé par ANTON NELCON Steve
echo ===================================================================
echo.
echo Lancement du jeu en cours...
echo Votre navigateur web va s'ouvrir automatiquement sur le jeu.
echo.
start http://localhost:3000
npm run dev
pause
