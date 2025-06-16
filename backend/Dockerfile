# Etapa 1: Construir la aplicación
FROM node:22-alpine as builder

WORKDIR /app

# Copiar dependencias
COPY package*.json ./
RUN npm ci --production && npm install

# Copiar código fuente
COPY . .

# Construir el proyecto (genera dist/)
RUN npm run build

# Etapa 2: Imagen final ligera
FROM node:22-alpine

WORKDIR /app

# Copiar solo lo necesario
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Instalar dependencias de producción
RUN npm ci --production && npm cache clean --force

EXPOSE 8000

# Comando de inicio
CMD ["node", "dist/index.js"]