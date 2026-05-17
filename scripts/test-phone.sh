#!/bin/bash
# ==============================================
# Ghost Protocol — Quick Phone Test (no build)
# ==============================================
# 1. Avvia il dev server accessibile sulla rete locale
# 2. Mostra l'URL da aprire sul telefono
# ==============================================

LOCAL_IP=$(hostname -I | awk '{print $1}')
PORT=3000

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Ghost Protocol — Phone Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📱 Sul telefono, apri Chrome e vai a:"
echo ""
echo "     http://${LOCAL_IP}:${PORT}"
echo ""
echo "  Poi Menu → 'Aggiungi a schermata Home'"
echo ""
echo "  🔧 Per APK testabile:"
echo "     Terminal 1: npm run dev -- -H 0.0.0.0"
echo "     Terminal 2: npx ngrok http 3000"
echo "     Poi: https://www.pwabuilder.com/"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start dev server
exec node node_modules/next/dist/bin/next dev -H 0.0.0.0 -p ${PORT}
