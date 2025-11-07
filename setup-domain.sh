#!/bin/bash

# Скрипт настройки домена для SlideDeck 2.0 на Hetzner
# Замените YOUR_DOMAIN.com на ваш реальный домен

DOMAIN="YOUR_DOMAIN.com"  # Замените на ваш домен
EMAIL="your-email@example.com"  # Замените на ваш email

echo "🚀 Настройка домена $DOMAIN для SlideDeck 2.0"

# 1. Обновление системы
echo "📦 Обновление системы..."
sudo apt update && sudo apt upgrade -y

# 2. Установка Nginx
echo "🌐 Установка Nginx..."
sudo apt install nginx -y

# 3. Установка Certbot для SSL
echo "🔒 Установка Certbot..."
sudo apt install certbot python3-certbot-nginx -y

# 4. Создание конфигурации Nginx
echo "⚙️ Создание конфигурации Nginx..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Forwarded-Host \$server_name;
    }
}
EOF

# 5. Активация сайта
echo "🔗 Активация сайта..."
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 6. Проверка конфигурации Nginx
echo "🧪 Проверка конфигурации Nginx..."
sudo nginx -t

# 7. Перезапуск Nginx
echo "🔄 Перезапуск Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# 8. Открытие портов в firewall
echo "🔥 Настройка firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw --force enable

# 9. Получение SSL сертификата
echo "🔐 Получение SSL сертификата..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL

# 10. Настройка автообновления сертификата
echo "🔄 Настройка автообновления SSL..."
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

echo "✅ Настройка завершена!"
echo "🌐 Ваш сайт доступен по адресу: https://$DOMAIN"
echo "📋 Не забудьте обновить переменные окружения!" 