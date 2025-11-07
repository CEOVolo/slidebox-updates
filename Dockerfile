# Этап сборки
FROM node:20-slim AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm install

# Копируем весь код
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем приложение
RUN npm run build

# Этап продакшена
FROM node:20-slim AS runner

# Устанавливаем необходимые системные зависимости для Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Создаем пользователя для безопасности
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nextjs

# Копируем необходимые файлы  
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/scripts ./scripts/
COPY --from=builder /app/config ./config/

# Note: public папка не нужна для этого проекта

# Копируем build Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Копируем уже сгенерированный Prisma Client из builder стадии
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Устанавливаем только production зависимости + tsx для скриптов
RUN npm install --production && npm install tsx && npm cache clean --force

# Устанавливаем правильные права для всех node_modules
RUN chown -R nextjs:nodejs /app/node_modules

# Переключаемся на непривилегированного пользователя
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Запускаем приложение
CMD ["node", "server.js"] 
