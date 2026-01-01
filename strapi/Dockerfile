# ===========================================
# WARIZMY EDUCATION - Strapi Dockerfile (Produktion)
# ===========================================

FROM node:20-alpine

# Arbeitsverzeichnis setzen
WORKDIR /opt/app

# System-Dependencies
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev

# Package Files kopieren
COPY package*.json ./

# Dependencies installieren
RUN npm ci --only=production

# Anwendungscode kopieren
COPY . .

# Strapi bauen
RUN npm run build

# Port freigeben
EXPOSE 1337

# Strapi starten
CMD ["npm", "run", "start"]

