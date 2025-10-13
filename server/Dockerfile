# FROM node:21-bookworm
# COPY . /app
# WORKDIR /app
# RUN npm install
# EXPOSE 8080
# ENTRYPOINT ["npm", "start"]


FROM node:23-alpine

# Utworzenie katalogu aplikacji
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy app source
COPY . .

# Default port
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]


# # 1. Używamy lekkiego obrazu Node.js
# FROM node:21-bookworm

# # 2. Ustawienie katalogu roboczego
# WORKDIR /app

# # 3. Kopiujemy tylko pliki package.json i package-lock.json (optymalizacja cache)
# COPY package*.json ./

# # 4. Instalujemy zależności
# RUN npm install --production

# # 5. Kopiujemy resztę plików aplikacji
# COPY . .

# # 6. Tworzymy użytkownika `node` i zmieniamy właściciela plików
# RUN useradd --create-home --shell /bin/bash appuser \
#     && chown -R appuser /app

# # 7. Przechodzimy na użytkownika `appuser`
# USER appuser

# # 8. Eksponujemy port, na którym backend będzie nasłuchiwał (Elastic Beanstalk nie używa `EXPOSE`)
# ENV PORT=8080

# # 9. Uruchamiamy aplikację
# CMD ["npm", "start"]
