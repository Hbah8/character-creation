Моё MVP: 
- дефолтное состояние системы со стандартными справочниками у которых есть *.schema.json
- создание мира с наследованием стандартных справочников (черты, изъяны, силы, расы, расовые особенности, enemy-only особенности) и возможностью переопределить стандартные и добавить\исключить\изменить как новые так и старые
- создание/удаление/изменение/импорт/экспорт персонажа с расчётом листа персонажа при использовании справочников
- трекер боя с использованием персонажей/врагов из библиотеки с сохранением сессии, чтобы можно было вернуться к бою спустя время

## Размещение и маршруты

В GitHub Pages приложение публикуется по адресу `/character-creation/`; корень `/` относится к корневому сайту GitHub Pages и не перенаправляется в приложение. Vite задаёт тот же префикс для ресурсов, а `BrowserRouter` использует `import.meta.env.BASE_URL`. Для локального запуска используется корневой адрес `/`.

Workflow публикации копирует собранный `index.html` в `404.html`. Благодаря этому GitHub Pages отдаёт SPA для прямого открытия и обновления вложенных маршрутов, например `/character-creation/creator/123`; неизвестные маршруты внутри приложения обрабатываются его страницей 404.

## Frontend dependency checks

From `character-app`, use Node.js 22 and run `npm ci`, then `npm run check`.
Production CI currently uses npm 10. When updating dependencies, commit both
`package.json` and `package-lock.json` and validate with a clean install,
not only the existing `node_modules`.

The frontend Docker build also copies the shared Character JSON fixture from
`backend/src/test/resources/fixtures/character-rich.json` into its build stage:
frontend compatibility tests import it, and TypeScript checks those tests.
The fixture is not copied into the final Nginx image.

If `npm ci` reports missing lockfile entries, repair the lockfile without
upgrading declared dependencies, then repeat the checks:

```shell
npx --yes npm@10.9.9 install --package-lock-only --ignore-scripts --no-audit --no-fund
npx --yes npm@10.9.9 ci
npm run check
```

## Backend development (WSL2)

The local setup uses Docker Engine in `Ubuntu-24.04` WSL2, not Podman. Maven
Wrapper is not present; use the installed Maven.

**One-time setup — inside WSL (`Ubuntu-24.04`):** install the backend toolchain.

```shell
sudo apt-get update
sudo apt-get install -y openjdk-21-jdk maven
```

**Open the project — Windows PowerShell:** open the backend folder through the
Remote - WSL extension.

```powershell
code --remote wsl+Ubuntu-24.04 /mnt/p/Projects/Intellij/character-creation/backend
```

**After a machine restart — inside WSL:** start Docker only if its enabled
systemd service is not already active, then confirm the daemon and Compose are
reachable.

```shell
systemctl is-active --quiet docker || sudo systemctl start docker
docker version --format 'Docker Engine {{.Server.Version}}'
docker compose version
```

**Build — inside WSL:** work from the backend directory and create the JAR.
`-DskipTests` makes this a packaging check only; it is not test validation.

```shell
cd /mnt/p/Projects/Intellij/character-creation/backend
mvn -DskipTests package
```

**Validate — inside WSL:** run every backend test. Testcontainers starts a
temporary PostgreSQL container; it does not use the development database.

```shell
cd /mnt/p/Projects/Intellij/character-creation/backend
mvn test
```

**Run — inside WSL:** start the backend. The `dev` profile automatically starts
the isolated PostgreSQL service from [backend/compose.dev.yaml](backend/compose.dev.yaml).

```shell
cd /mnt/p/Projects/Intellij/character-creation/backend
mvn spring-boot:run
```

**Verify — inside WSL:** confirm the backend and development database are
running.

```shell
curl --fail http://localhost:8080/actuator/health
docker compose -f compose.dev.yaml ps
```

The application URL is `http://localhost:8080`; health is
`http://localhost:8080/actuator/health`. The PostgreSQL named volume survives
application and container restarts.

### Локальная проверка аккаунтов и писем

Для использования приложения требуется вход с подтверждённым email.
Локальные персонажи, миры и остальные браузерные данные сохраняются:
авторизация не переносит их на сервер и не привязывает к аккаунту.
На одном браузерном профиле локальные данные остаются общими для входящих
аккаунтов до отдельного этапа переноса.

1. В WSL, из `backend`, выполните `docker compose -f compose.dev.yaml up -d`,
   затем `mvn spring-boot:run`. Явный `up` нужен и при уже работающем PostgreSQL,
   чтобы запустить новый Mailpit.
2. В Windows PowerShell, из `character-app`, выполните `npm run dev`.
   Откройте `http://localhost:5173/login`, выберите «Создать аккаунт»
   и зарегистрируйте тестовый email. После отправки появится шаг
   «Проверьте почту» с инструкцией и повторной отправкой письма.
3. Письмо появится только в локальном Mailpit: `http://localhost:8025`.
   Откройте ссылку: email подтвердится автоматически, без ввода токена.
   После успешного подтверждения нажмите «Перейти ко входу».
   Для недействительной или просроченной ссылки можно запросить новое письмо.
   Повторная отправка при входе предлагается только после проверки правильного
   пароля неподтверждённого аккаунта. Неверные данные дают нейтральное
   «Неверный email или пароль»; недоступность сервиса отображается отдельно.
   На странице аккаунта доступны текущий пользователь, список активных
   сессий, отзыв выбранной сессии (включая текущую) и выход.
4. На экране входа выберите «Забыли пароль?», введите тестовый email и
   откройте ссылку из Mailpit. Ответ одинаков для известных и неизвестных
   адресов. Ссылка действует один час и расходуется только при сохранении
   нового пароля; после этого все сессии аккаунта отзываются. При неверной,
   просроченной или уже использованной ссылке можно запросить новую.
   Подтверждение email при сбросе не происходит.
5. В настройках аккаунта можно изменить пароль, указав текущий и подтвердив
   новый. После успешной смены все сессии отзываются и требуется повторный
   вход. При неверном текущем пароле пароль и сессии не меняются.

### Сохраненные персонажи — Stage 3, локальная проверка

Раздел «Персонажи» и кнопка сохранения редактора используют серверную
библиотеку текущего аккаунта для самостоятельных персонажей. Изменения
сохраняются только после ответа backend; ошибки не стирают черновик, а
конфликт версии требует загрузить актуальную запись или продолжить с черновиком.
Существующие локальные персонажи не загружаются, не смешиваются с серверным
списком и остаются неизменными.

Локальная проверка Stage 3: `mvn test` — 26 тестов без пропусков,
`npm run check` — 457 тестов, lint, TypeScript и production build пройдены;
`npm run test:accounts` — 12 browser tests пройдены с локальным API proxy и
изолированной PostgreSQL. Проверены межбраузерная загрузка и сохранение,
конфликт версий, ошибка сохранения, изоляция чужого аккаунта через API,
удаление владельцем и сохранность записей после перезапуска backend.
Push и production deployment не выполнялись; локальные результаты не являются
production-проверкой или подтверждением Stage 3 владельцем.

### Миры и связанные персонажи — Stage 4, локальная проверка

Миры, правила, граф, мировые записи и переопределения справочников, расы и
расовые особенности хранятся для текущего аккаунта на backend. Персонажи могут
ссылаться на мир и его записи; доступ и версии проверяются сервером. Загрузка
мира разрешает системные записи, переопределения и пользовательские записи
без изменения общего системного каталога. JSON export/import сохраняет текущий
контракт. Изменение или удаление данных, на которые ссылаются персонажи,
отклоняется, если оно оставит неразрешимую ссылку.

Раздел «Персонажи» и библиотека редактора показывают только персонажей
выбранного мира; без выбранного мира — только самостоятельных. Счётчик,
последнее изменение и последний редактированный персонаж относятся к тому
же отфильтрованному списку. Серверный список аккаунта остаётся полным.

Stage 4 локально проверен: `mvn test` — 28 тестов без пропусков, включая
PostgreSQL Testcontainers и перечитывание мира и ссылок персонажа после
перезапуска Spring context; `npm run check` — lint, 467 тестов, TypeScript и
production build; Chromium `npm run test:accounts` — 13 browser tests.
Сквозной сценарий проверяет другой браузер, сохранение ссылок и расчётов,
world JSON export/import и изоляцию аккаунтов через API. Медиафайлы,
совместный доступ и перенос старых браузерных данных не входят в Stage 4;
локальные оригиналы не изменяются и не присоединяются к аккаунту.

После исправления фильтрации миров: `npm run check` — 476 тестов, lint,
TypeScript и build пройдены. Два EN/RU browser-теста с API fixtures проверяют
два мира, пустой мир, самостоятельного персонажа, списки и сводку, библиотеку
редактора и мобильную ширину. Дополненный сквозной сценарий с настоящим
локальным API, Mailpit и PostgreSQL также пройден: переключение контекста
скрывает остальные записи, не удаляя их из аккаунта.

Stage 4 не отправлялся в push/deployment; production-проверки и подтверждение
владельца ожидаются. Tracker не обновлён до подтверждения владельцем.

Браузерные проверки аккаунтов выполняются из `character-app` командой
`npm run test:accounts` при запущенных локальных backend и Mailpit. Если
Mailpit доступен только внутри WSL `Ubuntu-24.04`, в Windows PowerShell
перед командой задайте `$env:ACCOUNTS_MAILPIT_WSL='1'`: тесты прочитают
локальный почтовый ящик через WSL. Тестовые адреса используют домен
`example.test`; реальная отправка писем и production SMTP здесь не проверяются.

Без сессии виден только отдельный экран авторизации, без сайдбара.
Прямой внутренний адрес перенаправляет на вход и восстанавливается после
него (включая query/fragment). При начальной проверке сессии и навигации
основной интерфейс скрыт. Повторная проверка в открытом редакторе при
возвращении фокуса или видимости страницы не сбрасывает форму и выбор
импортируемого файла. Смена аккаунта сбрасывает редактор; ошибка проверки
скрывает приложение и предлагает повторить запрос.
Выход, ответ защищённого API 401 и истечение сессии закрывают приложение.
Сессия также перепроверяется при навигации и возвращении в окно;
фоновый polling не продлевает сессию бездействующего пользователя.
Старые ссылки подтверждения `/account#token=…` продолжают работать через
публичный экран входа; новые письма используют `/login#token=…`.

Vite проксирует `/api` на `http://localhost:8080`; при необходимости задайте
`API_PROXY_TARGET` перед запуском Vite. Dev-профиль использует SMTP Mailpit
на `localhost:1025`, без авторизации и реальных получателей. Gmail credentials
для разработки и тестов не нужны; обычные `SMTP_*` не переключают dev-профиль
на production-почту. Mailpit не настроен на пересылку наружу.

Проверки: `mvn test` в WSL из `backend` (PostgreSQL Testcontainers);
`npm run check` из `character-app`; `npx playwright install chromium` один раз,
затем `npm run test:accounts` при работающих backend и Mailpit.
UI-тест сам запускает и останавливает Vite на свободном порту 5173,
использует отдельные браузерные контексты и тестовые адреса `example.test`.
Если порт занят вашим Vite, используйте отдельный `ACCOUNTS_UI_PORT` для
UI-теста и тот же порт в `APP_PUBLIC_BASE_URL` тестируемого backend.
Тестовые аккаунты остаются в локальной dev-БД. Не запускайте эти проверки
против production. Для остановки почтового перехвата:
`docker compose -f compose.dev.yaml stop mailpit` из `backend`.

Email должен содержать полное доменное имя, например `user@example.com`;
адреса вроде `test@test` отклоняются формой и API до создания аккаунта,
токена и отправки письма. То же правило действует для повторной отправки.
Проверка формата не проверяет существование ящика: владение адресом
подтверждается ссылкой в письме. Mailpit только перехватывает письма.

Пароль: 12–128 символов; подтверждение действует 24 часа и одноразово.
Resend заменяет предыдущую неиспользованную ссылку. Вход доступен только
после подтверждения. Сессии хранятся в PostgreSQL, срок бездействия — 30 дней.
За 15 минут допускаются 10 попыток входа на email / 30 на IP и 3 запроса
писем на email / 10 на IP (registration и resend используют общий лимит).
При превышении API возвращает 429 и `Retry-After`. Register/resend возвращают
одинаковый 202 независимо от наличия аккаунта; это не гарантия доставки.
Сбой SMTP отмечается безопасным серверным сообщением без адресов и секретов;
после исправления настроек можно повторить resend.

### Gmail: настройки только для отдельного production-релиза

В личном Google-аккаунте включите двухэтапную аутентификацию в разделе
[Безопасность](https://myaccount.google.com/security), затем создайте
[пароль приложения](https://myaccount.google.com/apppasswords) для SMTP.
Это отдельный пароль, не основной пароль Google. Если раздел недоступен,
проверьте ограничения аккаунта/политики Google.

**Необходимые runtime-настройки:**

| Настройка | Значение |
|---|---|
| `SMTP_USERNAME` | Полный адрес используемого Gmail; он же адрес отправителя |
| `SMTP_PASSWORD` | Пароль приложения Google, вводится владельцем вне Git |
| `APP_PUBLIC_BASE_URL` | Публичный HTTPS-адрес SPA без query/fragment |
| `SMTP_HOST` | По умолчанию `smtp.gmail.com`; можно заменить провайдера |
| `SMTP_PORT` | По умолчанию `587` |
| `EMAIL_VERIFICATION_TTL` | Необязательно: `24h`, положительное значение не более 7 дней |

Production Compose дополнительно читает необязательный файл
`.accounts.runtime.env`, который владелец самостоятельно создаёт вне Git
с правами `0600`; он не перезаписывается существующим workflow настройки БД.
Также можно передать настройки через окружение backend. Не помещайте
секреты в `VITE_*`, frontend, image, команды с выводом значений или логи.
Без обязательных SMTP-настроек production-профиль не предназначен к запуску;
dev/test от них не зависят.

В production обязательны SMTP AUTH, STARTTLS и проверка сертификата сервера.
Используется только отправка писем: нет IMAP/POP, чтения почты или Google login.
Реальная доставка через Gmail и внешние HTTPS/cookie/CSRF-проверки пока
**Pending**: в этой работе push и deployment не выполняются.

**Stop while keeping development data — inside WSL:** press `Ctrl+C` in the
backend terminal, then stop the database without removing its named volume.

```shell
cd /mnt/p/Projects/Intellij/character-creation/backend
docker compose -f compose.dev.yaml stop
```

### Known issues

- `FileSystemException: ... Operation not permitted` while Maven writes
  `target/classes` → the `P:` DrvFS mount lacks Linux metadata support → add
  the shown configuration once, then run `wsl --shutdown` in Windows PowerShell
  and reopen Ubuntu:

  ```ini
  [boot]
  systemd=true

  [automount]
  options = "metadata"
  ```

- `Could not find a valid Docker environment` from Testcontainers → tests were
  run outside WSL or Docker Engine was not active → run the Docker connectivity
  commands above inside `Ubuntu-24.04`, then rerun `mvn test` there.