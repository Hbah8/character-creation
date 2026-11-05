Моё MVP: 
- дефолтное состояние системы со стандартными справочниками у которых есть *.schema.json
- создание мира с наследованием стандартных справочников (черты, изъяны, силы, расы, расовые особенности, enemy-only особенности) и возможностью переопределить стандартные и добавить\исключить\изменить как новые так и старые
- создание/удаление/изменение/импорт/экспорт персонажа с расчётом листа персонажа при использовании справочников
- трекер боя с использованием персонажей/врагов из библиотеки с сохранением сессии, чтобы можно было вернуться к бою спустя время

## Размещение и маршруты

В GitHub Pages приложение публикуется по адресу `/character-creation/`; корень `/` относится к корневому сайту GitHub Pages и не перенаправляется в приложение. Vite задаёт тот же префикс для ресурсов, а `BrowserRouter` использует `import.meta.env.BASE_URL`. Для локального запуска используется корневой адрес `/`.

Workflow публикации копирует собранный `index.html` в `404.html`. Благодаря этому GitHub Pages отдаёт SPA для прямого открытия и обновления вложенных маршрутов, например `/character-creation/creator/123`; неизвестные маршруты внутри приложения обрабатываются его страницей 404.

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