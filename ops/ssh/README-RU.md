# OSGARD — SSH подготовка серверов и GitHub Actions

Набор для owner/администратора VPS. Не скачивает приватные ключи, не включает парольный SSH и не меняет Nginx автоматически. Хосты и root-пути обязательно проверить с консоли провайдера.

## 1. Проверка каждого VPS (только чтение)

Откройте серверную консоль у VPS-провайдера (Contabo, Vultr, Yandex Cloud и т. п.), установите туда копию файла ops/ssh/host-audit.sh и выполните:

    sudo bash host-audit.sh gardvpn
    sudo bash host-audit.sh myosa
    sudo bash host-audit.sh osgardos
    sudo bash host-audit.sh newworld

На разных VPS выполняйте только соответствующую команду. Скрипт выводит доступность нужных каталогов, статусы сервисов и публичный SSH fingerprint; он НЕ трогает файлы сервисов. Из нескольких известных в истории IP ни один нельзя считать актуальным без проверки.

## 2. Подготовка SSH-пользователя

Для GARD VPN рекомендован отдельный garddeploy с доступом только на статическую корневую папку сайта. Для MYOSA нужно проверить текущие права на /opt/osa/public: нельзя выдавать права на системные данные или общие каталоги /opt. Для NEW WORLD скрипт verified-release.sh требует root на сервере и отдельный проверенный sudo/выпускной путь. Для OSGARDOS текущий атомарный скрипт изменяет systemd/Nginx и требует привилегий; не выдавайте blanket-sudo произвольному пользователю.

На VPS, где вы контролируете учетные записи:

    sudo adduser --disabled-password --gecos '' garddeploy

На домашнем Windows PC генерируйте отдельную пару SSH-ключей на каждый продукт; публичный файл *.pub копируйте в /tmp на соответствующий VPS (scp или консоль провайдера), затем:

    sudo bash install-deploy-key.sh garddeploy /tmp/osgard_gardvpn_github_ed25519.pub

Скрипт install-deploy-key.sh принимает ТОЛЬКО публичный Ed25519 ключ и существующего пользователя. Он не создает учетные записи, не настраивает sudo, не открывает порт SSH. Для существующего привилегированного аккаунта перед настройкой выполните проверку рисков и предоставьте ключ только этому аккаунту. Запретите парольный root-доступ, делайте отдельные ключи на каждый репозиторий.

## 3. GitHub Secrets — выполнить на личном Windows PowerShell 7

Установите GitHub CLI и войдите в GitHub владельцем HADJAL001:

    winget install --id GitHub.cli -e
    gh auth login

В консоли VPS получите именно ПУБЛИЧНУЮ строку SSH-сервера:

    sudo cat /etc/ssh/ssh_host_ed25519_key.pub
    sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub -E sha256

Сохраните копию ops/ssh/configure-github-secrets.ps1 на ПК и запустите. Пример GARD (замените адрес, пользователя, подтвердите fingerprint по VPS-консоли):

    ./configure-github-secrets.ps1 -Project gardvpn -ServerHost 'АДРЕС_VPS' -DeployUser 'garddeploy' -HostEd25519PublicKey 'ssh-ed25519 AAAA... PUBKEY' -GardWebRoot '/srv/gardvpn-site'

Остальные имена -Project: myosa, osgardos, newworld (без GardWebRoot). Скрипт создаёт отдельный SSH ключ локально, добавляет секреты в защищенное GitHub Environment и печатает путь к ПУБЛИЧНОМУ ключу, который отдельно необходимо установить на сервер. Никогда не копируйте приватную половину в чат или GitHub репозиторий.

## 4. Какое окружение/секреты должны существовать

| Проект / GitHub repo | GitHub Environment | SSH Secrets |
| --- | --- | --- |
| gardvpn.is / HADJAL001/osgard-new-world | gardvpn-production | GARDVPN_DEPLOY_HOST, GARDVPN_DEPLOY_USER, GARDVPN_DEPLOY_SSH_KEY_B64, GARDVPN_DEPLOY_KNOWN_HOSTS, GARDVPN_DEPLOY_WEBROOT |
| myosa.world / HADJAL001/osa | osa-production | OSA_VPS_HOST, OSA_VPS_USER, OSA_VPS_SSH_KEY_B64, OSA_VPS_KNOWN_HOSTS |
| osgardos.com / HADJAL001/osgardos | osgardos-production | OSGARDOS_DEPLOY_HOST, OSGARDOS_DEPLOY_USER, OSGARDOS_DEPLOY_KEY_B64, OSGARDOS_KNOWN_HOSTS |
| osgardnewworld.com / HADJAL001/asgard-redesign | osgardnewworld-production | NEWWORLD_DEPLOY_HOST, NEWWORLD_DEPLOY_USER, NEWWORLD_DEPLOY_KEY_B64, NEWWORLD_DEPLOY_KNOWN_HOSTS |

Пока GitHub Environment не настроен и в нужном репозитории нет секретов, нельзя провести SSH релиз. Настройте защиту окружения с reviewers на production и разрешёнными ветками main/master. Все действующие workflows ожидают SSH порт 22. Если VPS использует другой порт, сначала проверяется серверный sshd и обновляется конкретный workflow; не надо наугад открывать порт 22 наружу.

## 5. Отдельная конфигурация серверов

**GARD VPN**: выяснить действительный Nginx server_name gardvpn.is и его root. Подготовить собственный /srv/gardvpn-site/releases/<baseline> и симлинк /srv/gardvpn-site/current со старой подтверждённой версией (должен читаться Nginx). Затем явно переключить только server block gardvpn.is на root /srv/gardvpn-site/current, предварительно сохранив Nginx config и проверив nginx -t. НЕ изменять VPS-роутер, bot, VPN carrier, miniapp или subscription DB. Скрипт landing/deploy/remote-release.sh умышленно требует эти пути уже существующими и делает rollback при неуспехе.

**MYOSA**: VPS должен содержать /opt/osa/public/index.html и /opt/osa/deploy/nginx-https.conf, а Nginx должен отдавать /premium-ab-preview как статику из public. Изолированный workflow меняет только эту папку/симлинк; основной OSA CI и мобильные уязвимости по-прежнему блокируют полноценный нативный релиз.

**OSGARDOS**: VPS должен иметь реальные /opt/osgard/current и /opt/osgard/server-live, root-owned service/config paths, рабочие nginx, systemd, HTTPS и доступный /api/ready. Полный релиз через scripts/deploy-production-atomic.ps1 использует раздельные versioned frontend и backend и transactional rollback. Не создавать эти пути вслепую и не менять живые соединения GARD мини-приложения.

**NEW WORLD**: /opt/osgard-platform/current должен быть git checkout, присутствуют /etc/osgard-platform/web.env и osgard-web.service. Release скрипт требует ARTIFACT_SIGNING_KEY (длиной >=32), здоровый 127.0.0.1:3000/api/health. Главная преграда сейчас — security CI + required Vercel status; не отключайте их ради выкладки референса.

**SUPER DAY**: основной сайт работает на superday.run. Отдельная доставка Forgejo сейчас ссылается на устаревший, не подтверждённый адрес 64.177.120.183:2222. Сначала подтвердить действующий Forgejo HOST/PORT и ключ с консоли. Зеркало GitHub→Forgejo не является SSH-деплоем самого сайта.

**VANGUARD**: домен живёт как Next.js сайт, но владелец исходного репозитория/хостинг ещё не подтверждён; SSH-публикацию не запускать, пока репозиторий и реальный сервер не связаны доказуемо.

## 6. Проверка после настройки

Через GitHub → Actions запустите соответствующий workflow на доверенной главной ветке. Успех сборки НЕ означает публикацию: нужен успешный SSH job и HTTPS-проверка точных статических файлов либо полной пары сервисов. Ошибки сохраняются в GitHub Actions; пароли или приватные ключи в логах показывать нельзя.

Набор предназначен для безопасного завершения исходных требований; ни одно выполнение README само по себе не меняет сервер.
