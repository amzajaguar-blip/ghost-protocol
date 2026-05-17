#!/bin/bash
# ==============================================
# Ghost Protocol — Local APK Test Script
# Crea un APK di test che punta al dev server
# locale via ngrok. Una volta installato, non
# serve più buildare: le modifiche appariranno
# in tempo reale sul telefono.
# ==============================================

set -e

NGROK_URL=""
APK_OUTPUT="ghost-protocol-debug.apk"

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Ghost Protocol — Local APK Test Generator${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 1. Check prerequisites
command -v npx >/dev/null 2>&1 || { echo -e "${RED}✗ npx non trovato${NC}"; exit 1; }
command -v java >/dev/null 2>&1 || { echo -e "${RED}✗ Java non trovato (necessario per APK)${NC}"; exit 1; }

# 2. Start ngrok tunnel
echo -e "\n${GREEN}[1/3] Avvio tunnel ngrok...${NC}"
echo "  (Apri un altro terminale e tieni ngrok attivo)"
echo "  Comando:  npx ngrok http 3000"
echo ""
echo "  Quando ngrok è pronto, incolla qui l'URL https:"
read -p "  ngrok URL (es. https://xxxx.ngrok-free.app): " NGROK_URL

if [ -z "$NGROK_URL" ]; then
  echo -e "${RED}✗ URL ngrok mancante${NC}"
  exit 1
fi

# 3. Generate TWA APK with bubblewrap
echo -e "\n${GREEN}[2/3] Generazione APK TWA...${NC}"

mkdir -p twa-build
cd twa-build

# Create bubblewrap project
cat > twa-manifest.json << EOF
{
  "packageName": "app.ghostprotocol.debug",
  "host": "$(echo $NGROK_URL | sed 's|https://||')",
  "name": "Ghost Protocol (debug)",
  "shortName": "Ghost",
  "display": "standalone",
  "themeColor": "#08080A",
  "backgroundColor": "#08080A",
  "startUrl": "/",
  "iconUrl": "https://via.placeholder.com/512/08080A/FF3C5F?text=G",
  "maskableIconUrl": "https://via.placeholder.com/512/08080A/FF3C5F?text=G",
  "splashScreenFadeOutDuration": 300,
  "signingKey": {
    "path": "./debug.keystore",
    "alias": "debug"
  },
  "appVersionName": "1.0.0",
  "appVersionCode": 1,
  "fallbackType": "customtabs",
  "orientation": "portrait-primary"
}
EOF

# Generate debug keystore
keytool -genkey -v -keystore debug.keystore -alias debug -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Ghost Protocol, OU=Dev, O=Ghost, L=Unknown, S=Unknown, C=IT" 2>/dev/null || true

# Build with bubblewrap
echo -e "\n${GREEN}[3/3] Build APK con bubblewrap...${NC}"
npx @bubblewrap/cli build --manifest twa-manifest.json 2>&1 || {
  echo -e "\n${YELLOW}⚠ Bubblewrap CLI non disponibile. Puoi generare l'APK online:${NC}"
  echo -e "  ${GREEN}https://www.pwabuilder.com/${NC}"
  echo "  Inserisci l'URL ngrok e scarica l'APK generato."
  exit 1
}

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ APK generato!${NC}"
echo -e "${YELLOW}Invia il file APK al telefono via Telegram${NC}"
echo -e "${YELLOW}Poi tieni attivi:${NC}"
echo -e "  Terminale 1: ${GREEN}npm run dev -- -H 0.0.0.0${NC}"
echo -e "  Terminale 2: ${GREEN}npx ngrok http 3000${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
