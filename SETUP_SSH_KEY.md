# Настройка SSH ключа для GitHub Actions

## 1. Создание SSH ключа на локальной машине

```bash
# Создайте новый SSH ключ без пароля (для автоматизации)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f github_actions_key -N ""
```

Это создаст два файла:
- `github_actions_key` - приватный ключ (для GitHub Secrets)
- `github_actions_key.pub` - публичный ключ (для сервера)

## 2. Добавление публичного ключа на сервер

```bash
# Подключитесь к серверу
ssh root@135.181.148.104

# Добавьте публичный ключ
echo "СОДЕРЖИМОЕ_ФАЙЛА_github_actions_key.pub" >> ~/.ssh/authorized_keys

# Установите правильные права
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

## 3. Добавление приватного ключа в GitHub Secrets

1. Откройте файл `github_actions_key` и скопируйте всё содержимое
2. Перейдите на https://github.com/CEOVolo/slidebox/settings/secrets/actions
3. Создайте новый секрет с именем `SSH_KEY`
4. Вставьте содержимое приватного ключа

## 4. Проверка подключения

```bash
# С локальной машины
ssh -i github_actions_key root@135.181.148.104
```

## ⚠️ Важно:
- Никогда не публикуйте приватный ключ
- Удалите локальные файлы ключей после добавления в GitHub
- Используйте отдельный ключ только для GitHub Actions 