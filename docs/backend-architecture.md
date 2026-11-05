# Backend architecture
Статус: архитектурный ориентир. Реализация backend, зависимостей, Compose,
VPS и deployment в рамках этого документа не меняется.
## 1. Цель и границы
**Принятое решение.** Приложение получает backend на Spring Boot +
PostgreSQL. Он хранит данные аккаунта, проверяет доступ и сохраняет
целостность связей. Frontend остаётся React SPA: формы, preview, игровые
вычисления, PDF и редактирование не переносятся на сервер.
Сейчас данные живут в browser storage: миры и персонажи — в localStorage,
карты — в IndexedDB, музыка хранит в мире метаданные, а локальный браузер
держит разрешения на файлы. Существующие модели `World` и `Character`,
системные справочники и текущие JSON import/export остаются исходным
контрактом переноса. Подробнее о текущих моделях: [World](../character-app/src/world/types.ts),
[Character](../character-app/src/types/character.ts),
[local storage](../character-app/src/services/libraryService.ts) и
[карты](../character-app/src/maps/services/mapStorageRepository.ts).
Целевая форма — один модульный монолит и одна PostgreSQL БД. Nginx отдаёт
SPA и проксирует API того же HTTPS origin. PostgreSQL не публикуется в
интернет. Файлы хранятся отдельно от БД.
Первая цель — аккаунты. Затем backend поэтапно становится источником
сохранённых данных аккаунта. Dashboard доступен только после входа;
анонимный локальный режим не сохраняется и не развивается.
**Предложение.** Начать с одного backend instance и приватного файлового
volume на VPS. Это соответствует текущему масштабу и не требует
микросервисов, Redis, брокера или отдельного auth-сервера.
**Открытый вопрос.** Точный объём первого публичного релиза требует
решения владельца.
## 2. Технологии
| Технология | Назначение | Причина выбора |
|---|---|---|
| Java 21 + Spring Boot | HTTP API, security, конфигурация, health checks | Подходит для модульного монолита и требуемого стека |
| Spring MVC + Bean Validation | REST DTO и входная валидация | Явная граница между API и доменной логикой |
| Spring Security + Spring Session JDBC | Cookie-аутентификация и сессии | Состояние сессии хранится на сервере; браузер хранит идентификатор в HttpOnly Secure cookie, недоступной JavaScript |
| PostgreSQL | Учётные записи, данные миров, метаданные файлов, сессии | Транзакции, ограничения, JSONB и надёжное хранение |
| Spring JDBC (`JdbcClient`) | Доступ к данным | Явные SQL, маппинг строк в record/DTO и контроль запросов без JPA/Hibernate |
| Flyway | Версионированные изменения схемы | Схема БД меняется вместе с кодом и проверяется на чистой БД |
| Gmail SMTP отдельного аккаунта проекта | Подтверждение email и сброс пароля | Минимальный старт; адаптер позволяет заменить провайдера |
| Private filesystem storage | Карты, аудио и портреты | Минимальная начальная сложность; байты не попадают в PostgreSQL |
| JUnit + Testcontainers PostgreSQL | Unit и integration tests | Проверяются реальные PostgreSQL SQL, ограничения и транзакции |
Repository использует `JdbcClient` с параметризованными SQL-запросами и
row mapper рядом с запросом. Сложные операции выполняются короткими
транзакциями, объявленными на application service. Не создавать общий
generic repository или интерфейс на каждый класс: abstractions нужны на
границе с почтой и file storage, а не для обычного SQL CRUD.
Секреты (БД, Gmail SMTP, encryption keys) находятся вне Git, image и
frontend переменных. На первом этапе документируется ручной export БД и
файлов и восстановление из него; RPO/RTO и автоматический внешний backup
пока не устанавливаются. Актуальное deployment-состояние описано в
[deployment.md](deployment.md).
## 3. Структура приложения
```text
Browser SPA -> API controller -> application service -> repository/storage
                                               |-> authorization policy
                                               |-> transaction and validation
```
| Модуль | Ответственность | Допустимые зависимости |
|---|---|---|
| identity | Аккаунты, пароль, email tokens, сессии | Свои JDBC repositories, mail port |
| worlds | Миры, настройки, граф, расы, world-level справочники | identity policy, свои JDBC repositories |
| characters | Персонажи и их привязка к миру | worlds read/validation API, свои JDBC repositories |
| media | Метаданные, upload и приватное чтение файлов | identity/world access policy, свои JDBC repositories, storage port |
| transfer | JSON import/export и ручной перенос локальных данных | worlds, characters, media |
| infrastructure | JDBC, migrations, mail/storage adapters, configuration | Зависит от интерфейсов интеграций соответствующих модулей; не содержит бизнес-правил |
Controller отвечает только за HTTP, DTO и преобразование ошибок.
Application service проверяет права, запускает транзакцию, координирует
валидацию и вызывает repository/storage. Repository знает SQL и не решает
права доступа. Domain validation проверяет ссылки и инварианты, а frontend
сохраняет свою валидацию для удобства UI.
`MailSender` и `FileStorage` определяются рядом с использующими их
application services. Инфраструктурные адаптеры реализуют эти интерфейсы;
application services не зависят от конкретных адаптеров. Обычные JDBC
repositories остаются внутри соответствующих модулей; отдельная абстракция
для каждого repository не нужна.
## 4. Данные и доступ
Адресуемые записи имеют глобальный UUID. У самостоятельных ресурсов есть
`owner_account_id`; записи внутри мира получают `world_id` и наследуют
его scope. Владелец ресурса, владелец мира и пользователь, выполняющий
запрос, — разные понятия.
В приватной v1 policy разрешает доступ владельцу аккаунта или владельцу
мира, в зависимости от ресурса. Проверка выполняется сервером в каждом
use case, включая файлы, импорт и export. ID или URL чужого ресурса не
даёт доступа; для чужого и отсутствующего приватного ресурса возвращается
одинаковый результат.

Позднее `world_members` добавит участников и роли. Тогда изменится policy,
а не primary keys и не связи дочерних сущностей с миром.

Основные данные: accounts/sessions/tokens, worlds, entities/relationships,
world settings, races, world handbook overrides, characters, file metadata,
maps и audio configuration. Используется один актуальный read-only
системный каталог; мир хранит только custom entries и overrides, которые
разрешаются при чтении. Обновления каталога сохраняют стабильные
идентификаторы и существующие ссылки; несколько версий пока не хранятся.

Таблицы используются для ownership, связей, списков, версий, ограничений и
метаданных. JSONB используется для изменяемых частей листа персонажа,
параметров рас и динамических полей справочника. Не переносить весь мир
в JSONB и не нормализовать каждый элемент листа без потребности.

Байт файла живёт в private storage, его MIME/размер/checksum/связь с миром
— в БД. File name не является storage path. Максимальный размер файла —
75 МБ и задаётся конфигурацией. Backend учитывает общее занятое место и
отказывает в новых upload при нехватке диска; уменьшение лимита не удаляет
существующие файлы. Доступ к контенту всегда проверяется сервером; аудио
отдаётся с поддержкой HTTP Range.

У изменяемых агрегатов есть revision/ETag. PUT/DELETE требуют актуальный
If-Match, иначе клиент получает конфликт, а не тихо перезаписывает данные
с другого устройства. Версия character context меняется только при
settings/races/handbook; изменение карты или audio scene не конфликтует
с сохранением персонажа.

## 5. Аккаунты

Выбор: server-side session в PostgreSQL и HttpOnly Secure cookie, а не JWT
в localStorage. Это даёт отзыв сессии, logout на всех устройствах и
управление активными сессиями без отдельного token denylist.

Регистрация создаёт неподтверждённый аккаунт и одноразовый email token.
Подтверждённый пользователь входит, получает новую session ID и видит свои
сессии. Logout удаляет одну сессию; смена или сброс пароля отзывает все.

Пароли хешируются Argon2id через Spring `PasswordEncoder`. Tokens имеют
случайное значение, в БД хранится только hash, purpose, срок и признак
использования. Подтверждение email и reset password используют разные
одноразовые токены.

Production auth включается только через проверенный HTTPS. Для
cookie-аутентификации включается CSRF; SPA получает CSRF token и передаёт
его для изменяющих запросов. CORS в production не нужен при одном origin.

Регистрация, login, reset и resend ограничиваются по IP и account/email.
Ответ reset/register не раскрывает существование email. Почта отправляется
через Gmail SMTP отдельного аккаунта проекта; настройки задаются вне кода.
Узкий mail adapter позволяет сменить провайдера без изменения identity.

## 6. Поэтапный перенос

| Этап | Работа | Проверяемый результат |
|---|---|---|
| 0. Подготовка | Зафиксировать актуальные JSON fixtures и Gmail SMTP configuration | Current Character/World JSON проходит import → form → preview → export без потери данных |
| 1. Каркас | Spring Boot, JDBC repositories, Flyway, local PostgreSQL, same-origin API proxy, health checks | Чистая БД мигрируется, API отвечает, frontend check и backend tests проходят |
| 2. Аккаунты | Регистрация, email confirmation, login/logout, reset/change password, session list/revoke | Token одноразовый; сессия отзывается; другой пользователь не получает данные аккаунта |
| 3. Первый сквозной сценарий | Account repository для standalone персонажа без портрета | Пользователь сохраняет персонажа и открывает его во втором браузере; чужой GET/PUT/DELETE не работает |
| 4. Миры и справочники | Миры, settings, graph, races, world overrides; world characters | Character использует тот же world context после загрузки на другом устройстве; конфликт сохраняет draft |
| 5. Медиа | Upload, maps, audio metadata/files, portraits, private download/Range | Карта и музыка доступны только владельцу; audio seek работает; файл не остаётся без metadata |
| 6. Перенос данных | Ручной JSON export/import и ручная загрузка файлов, отчёт о missing files | Исходные локальные данные сохраняются до проверки результата |
Frontend получает repository interface для library/world/media операций.
Account implementation вызывает API. Существующие browser services нужны
только для разового ручного export исходных данных. Формы, preview, игровые
вычисления и PDF остаются прежними: меняется источник сохранения, не
редактирование.
Отказ от анонимного локального режима — целевое состояние. При поэтапном
переходе существующее хранение сохраняется для ещё не перенесённых функций.
Оно отключается после готовности соответствующего серверного сценария и
сохранения исходных данных пользователя.

Текущие Character JSON и World JSON продолжают быть допустимыми import/export
форматами. В первоначальной реализации нет автоматической миграции browser
storage: пользователь экспортирует JSON, импортирует его в аккаунт и вручную
загружает карты/музыку. Исходные данные не удаляются до проверки результата.
Полный bundle можно добавить позднее; очистка legacy не блокирует каркас
backend, если от него нет технической зависимости.
## 7. Дальнейшее развитие и открытые вопросы

Private filesystem storage заменяется на S3-compatible storage через
`FileStorage`: копируются файлы, проверяются checksums, затем переключается
metadata. Это понадобится при росте объёма файлов, требованиях к
долговечности или нескольких backend instances.

Совместные миры добавляют membership/roles и расширяют authorization policy.
Одновременное редактирование сначала остаётся optimistic locking; realtime
и CRDT не нужны до подтверждённой потребности.

Несколько backend instances потребуют общего PostgreSQL (включая JDBC
sessions), общего file storage и coordination для редких фоновых работ.
Масштабирование не появляется автоматически: перед ним измеряются DB
connections, upload/streaming нагрузка, latency и объём файлов.

Открытых вопросов, влияющих на ближайшие решения, нет.