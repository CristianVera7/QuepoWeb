# Etapa de construcción
FROM node:22 as builder

WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npx --yes vue-tsc -b && npx --yes vite build

# Etapa de producción
FROM node:22-alpine

# Instalar serve
RUN npm install -g serve

# Copiar archivos construidos
COPY --from=builder /app/dist /app/dist

WORKDIR /app

EXPOSE 5000

CMD ["serve", "-s", "dist", "-l", "5000"]
