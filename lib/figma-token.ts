import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Кэш для токена, чтобы не делать запрос к БД каждый раз
let cachedToken: string | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

export async function getFigmaAccessToken(): Promise<string | null> {
  // Проверяем кэш
  const now = Date.now();
  if (cachedToken && (now - lastFetch) < CACHE_DURATION) {
    return cachedToken;
  }

  try {
    // Сначала пробуем получить из базы данных
    // @ts-ignore - Prisma client might not be fully generated yet
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'FIGMA_ACCESS_TOKEN' }
    });

    if (setting?.value) {
      cachedToken = setting.value;
      lastFetch = now;
      return setting.value;
    }
  } catch (error) {
    console.error('Error fetching Figma token from database:', error);
  }

  // Если в базе нет, используем переменную окружения
  const envToken = process.env.FIGMA_ACCESS_TOKEN;
  if (envToken) {
    cachedToken = envToken;
    lastFetch = now;
    
    // Сохраняем в базу для будущего использования
    try {
      // @ts-ignore - Prisma client might not be fully generated yet
      await prisma.systemSettings.create({
        data: {
          key: 'FIGMA_ACCESS_TOKEN',
          value: envToken
        }
      });
    } catch (error) {
      // Игнорируем ошибку, если токен уже существует
    }
  }

  return envToken || null;
}

export async function updateFigmaAccessToken(token: string): Promise<boolean> {
  try {
    // @ts-ignore - Prisma client might not be fully generated yet
    await prisma.systemSettings.upsert({
      where: { key: 'FIGMA_ACCESS_TOKEN' },
      update: { value: token },
      create: {
        key: 'FIGMA_ACCESS_TOKEN',
        value: token
      }
    });

    // Обновляем кэш
    cachedToken = token;
    lastFetch = Date.now();

    return true;
  } catch (error) {
    console.error('Error updating Figma token:', error);
    return false;
  }
}

export async function validateFigmaToken(token: string): Promise<boolean> {
  try {
    // Проверяем токен, делая простой запрос к API Figma
    const response = await fetch('https://api.figma.com/v1/me', {
      headers: {
        'X-Figma-Token': token
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error validating Figma token:', error);
    return false;
  }
}

// Очистка кэша
export function clearTokenCache() {
  cachedToken = null;
  lastFetch = 0;
} 