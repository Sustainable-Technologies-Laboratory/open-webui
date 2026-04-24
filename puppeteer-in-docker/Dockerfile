FROM node:21.2.0-slim

# 1. Chromium + Abhängigkeiten installieren
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 2. Puppeteer-Konfiguration
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 3. Arbeitsverzeichnis erstellen
WORKDIR /app

# 4. Nur package.json kopieren (für effizientes Caching)
COPY package*.json ./

# 5. Abhängigkeiten installieren
RUN npm install puppeteer

# 6. Restliche Dateien kopieren
COPY . .

# 7. Container am Leben halten (für manuelle Befehle)
CMD ["tail", "-f", "/dev/null"]
