# Lakers Homecourt

Lakers Homecourt es una aplicacion web para mantener activa a la comunidad de fans de Los Angeles Lakers durante la temporada baja de la NBA. La plataforma incluye perfiles, eventos, agenda, tienda, colecciones, chat y dinamicas de participacion conectadas a Supabase.

Sitio informativo del equipo: https://hellfjrhbkbcs.my.canva.site/sharkinov

## Tecnologias principales

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- React Router
- Leaflet / React Leaflet
- Cypress

## Requisitos previos

Antes de instalar el proyecto necesitas:

- Node.js 20 o superior
- npm
- Una instancia de Supabase configurada para la aplicacion
- Las credenciales publicas de Supabase:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Instalacion

Desde la raiz del repositorio, entra a la carpeta de la aplicacion:

```bash
cd WebHomecourt
```

Instala las dependencias:

```bash
npm install
```

Crea el archivo de variables de entorno a partir del ejemplo:

```bash
cp .env.example .env.local
```

En Windows PowerShell puedes usar:

```powershell
Copy-Item .env.example .env.local
```

Edita `.env.local` y agrega tus valores:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## Ejecucion local

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Vite mostrara una URL local similar a:

```text
http://localhost:5173/
```

Abre esa URL en el navegador para probar la aplicacion.

## Comandos disponibles

Ejecutar en modo desarrollo:

```bash
npm run dev
```

Compilar para produccion:

```bash
npm run build
```

Revisar reglas de lint:

```bash
npm run lint
```

Previsualizar la compilacion de produccion:

```bash
npm run preview
```

## Despliegue

La aplicacion esta preparada para desplegarse como proyecto Vite. El archivo `WebHomecourt/vercel.json` incluye una regla de reescritura para que las rutas de React Router funcionen correctamente en Vercel.

### Desplegar en Vercel

1. Importa el repositorio en Vercel.
2. Configura el directorio raiz del proyecto como:

```text
WebHomecourt
```

3. Usa esta configuracion de build:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

4. Agrega estas variables de entorno en Vercel:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

5. Ejecuta el despliegue.

### Despliegue manual en hosting estatico

Tambien puedes compilar la aplicacion y subir el contenido de `dist` a un hosting estatico:

```bash
cd WebHomecourt
npm install
npm run build
```

El resultado queda en:

```text
WebHomecourt/dist
```

Si el hosting usa rutas del lado del cliente, configura un fallback para enviar todas las rutas a `index.html`.

## Supabase

La aplicacion usa Supabase desde `src/lib/supabase.ts`. Para que funcione correctamente en local y en produccion, las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` deben estar configuradas.

El repositorio tambien incluye `schema.sql`, que puede servir como referencia del esquema de base de datos del proyecto.

### Replicar el esquema de base de datos

Antes de aplicar el esquema en otra instancia de Supabase, revisa `schema.sql` y verifica que quieres ejecutar todo su contenido en la base de datos destino. El archivo incluye instrucciones DDL para recrear objetos de la base de datos, por lo que conviene usar una instancia nueva o una base donde no haya datos que puedas perder.

#### Desde la CLI de Supabase

1. Instala o ejecuta la CLI de Supabase:

```bash
npm install supabase --save-dev
```

2. Inicia sesion y vincula el repositorio con tu proyecto de Supabase:

```bash
npx supabase login
npx supabase link
```
Y selecciona el projecto, o puedes usar
 ```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
```

El `project-ref` aparece en la URL del dashboard de Supabase:

```text
https://supabase.com/dashboard/project/TU_PROJECT_REF
```

3. Crea una migracion con el contenido de `schema.sql`:

```bash
npx supabase migration new initial_schema
```

Esto genera un archivo dentro de `supabase/migrations/`. Copia el contenido de `schema.sql` dentro de esa migracion.

4. Revisa que la migracion se pueda aplicar:

```bash
npx supabase db push --dry-run
```

5. Sube las migraciones y el `seed.sql` que viene en el repositorio:

```bash
npx supabase db push --include-seed
```

Este comando aplica las migraciones pendientes de `supabase/migrations/` y despues carga los datos iniciales definidos en `supabase/seed.sql`.

#### Desde la interfaz de Supabase

1. Entra al dashboard de tu proyecto en Supabase.
2. Abre la seccion `SQL Editor`.
3. Crea una consulta nueva.
4. Copia y pega el contenido de `schema.sql`.
5. Ejecuta la consulta.
6. Revisa en `Table Editor` que las tablas, relaciones, funciones, triggers y politicas esperadas se hayan creado correctamente.

Si el esquema se aplica sobre una base que ya tiene tablas, extensiones o politicas con los mismos nombres, Supabase/Postgres puede marcar errores por objetos duplicados. En ese caso, usa una instancia limpia o adapta el SQL antes de ejecutarlo.

### Subir el `seed.sql` del repositorio

El repositorio ya incluye un archivo `supabase/seed.sql` con datos iniciales para poblar la base despues de aplicar las migraciones. Este archivo sirve para que alguien que apenas esta instalando el proyecto pueda levantar una instancia nueva de Supabase con estructura y datos base.

El proyecto ya tiene configurado el seed en `supabase/config.toml`:

```toml
[db.seed]
enabled = true
sql_paths = ["./seed.sql"]
```

Eso significa que Supabase buscara este archivo:

```text
supabase/seed.sql
```

Para subirlo a una instancia remota recien creada, ejecuta desde la raiz del repositorio:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push --include-seed
```

`--include-seed` es la parte importante: sin ese flag, `npx supabase db push` solo sube las migraciones de estructura y no carga los datos de `supabase/seed.sql`.

Para probar el mismo flujo localmente antes de subirlo:

```bash
npx supabase db reset
```

Ese comando reinicia la base local, aplica las migraciones y despues ejecuta `supabase/seed.sql`.

Si la base remota ya tiene datos, revisa el contenido del seed antes de correr `--include-seed`, porque puede fallar por registros duplicados o insertar datos demo que no quieres en produccion.

### Configurar Google Auth en Supabase

El frontend ya usa Google OAuth desde `WebHomecourt/src/components/botongoogle.tsx` con `supabase.auth.signInWithOAuth({ provider: "google" })`. No necesitas una variable `VITE_GOOGLE_CLIENT_ID` en React; el Client ID y el Client Secret se configuran dentro de Supabase.

1. En Google Cloud Console crea o selecciona un proyecto.
2. Configura la pantalla de consentimiento OAuth.
3. Crea un OAuth Client ID de tipo `Web application`.
4. En `Authorized redirect URIs` agrega el callback de Supabase:

```text
https://TU_PROJECT_REF.supabase.co/auth/v1/callback
```

5. Copia el `Client ID` y el `Client Secret`.
6. En Supabase abre `Authentication > Providers > Google`.
7. Activa Google y pega el `Client ID` y el `Client Secret`.
8. En `Authentication > URL Configuration` configura:

```text
Site URL: http://localhost:5173
Redirect URLs:
http://localhost:5173/**
https://TU_DOMINIO_DE_PRODUCCION/**
```

Para produccion, cambia `TU_DOMINIO_DE_PRODUCCION` por el dominio real de Vercel u otro hosting. El componente de Google redirige a `/` al iniciar sesion y a `/complete-register` durante registro, por eso los redirect URLs deben permitir esas rutas.

### Desplegar Edge Functions

Las migraciones de Supabase (`npx supabase db push`) solo aplican cambios de base de datos. Las Edge Functions que estan en `supabase/functions/` no se suben automaticamente con las migraciones; hay que desplegarlas aparte.

1. Inicia sesion y vincula el proyecto:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
```

2. Configura los secretos que usan las funciones:

```bash
npx supabase secrets set OPENROUTER_API_KEY=tu_openrouter_key
npx supabase secrets set NEWSAPI_KEY=tu_newsapi_key
npx supabase secrets set CRON_SECRET=un_valor_largo_y_privado
npx supabase secrets set APNS_KEY_ID=tu_key_id
npx supabase secrets set APNS_TEAM_ID=tu_team_id
npx supabase secrets set APNS_BUNDLE_ID=tu_bundle_id
npx supabase secrets set APNS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

Supabase agrega automaticamente secretos como `SUPABASE_URL`. En este proyecto las funciones tambien leen `SUPABASE_SERVICE_ROLE_KEY`; si tu instancia no lo expone automaticamente, agregalo manualmente desde `Project Settings > API`:

```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

3. Despliega todas las funciones:

```bash
npx supabase functions deploy
```

O despliegalas una por una:

```bash
npx supabase functions deploy analyze-report
npx supabase functions deploy analyze-event-report
npx supabase functions deploy fetch-lakers-news
npx supabase functions deploy send-apns-notification
npx supabase functions deploy send-score-notification
npx supabase functions deploy hyper-action --no-verify-jwt
```

`hyper-action` valida el header `Authorization: Bearer CRON_SECRET` dentro del codigo, por eso se despliega con `--no-verify-jwt` si la va a llamar un cron externo sin JWT de Supabase. Si otra funcion se va a invocar desde `pg_cron`, `pg_net` o un servicio externo sin JWT de Supabase, tambien necesitara `--no-verify-jwt` y una validacion propia dentro del codigo.

Importante: `fetch-lakers-news` actualmente no valida `CRON_SECRET` en su codigo. Si la despliegas con `--no-verify-jwt`, quedaria invocable publicamente. Antes de hacer eso, agrega una validacion similar a `hyper-action` o invocala con un JWT/secret valido.

### Secretos usados por Edge Functions

| Secreto | Lo usan | Para que sirve |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | `analyze-report`, `analyze-event-report` | Llamar a OpenRouter para clasificar reportes con IA. |
| `NEWSAPI_KEY` | `fetch-lakers-news` | Consultar noticias de Lakers desde NewsAPI. |
| `SUPABASE_URL` | Todas las funciones que crean cliente de Supabase | URL del proyecto Supabase. Normalmente Supabase la inyecta automaticamente. |
| `SUPABASE_SERVICE_ROLE_KEY` | Funciones que escriben o leen con privilegios administrativos | Acceso backend que puede saltarse RLS. Nunca debe exponerse al frontend. |
| `CRON_SECRET` | `hyper-action` | Proteger llamadas de cron con `Authorization: Bearer CRON_SECRET`. |
| `APNS_KEY_ID` | `send-apns-notification`, `send-score-notification` | Key ID de Apple Push Notification service. |
| `APNS_TEAM_ID` | `send-apns-notification`, `send-score-notification` | Team ID de Apple Developer. |
| `APNS_BUNDLE_ID` | `send-apns-notification`, `send-score-notification` | Bundle ID usado como `apns-topic`. |
| `APNS_PRIVATE_KEY` | `send-apns-notification`, `send-score-notification` | Llave privada `.p8` de APNS. Debe conservar encabezado y pie PEM. |

Puedes revisar los secretos ya cargados con:

```bash
npx supabase secrets list
```

## Estructura del repositorio

```text
.
|-- README.md
|-- schema.sql
|-- supabase/
`-- WebHomecourt/
    |-- src/
    |-- public/
    |-- package.json
    |-- vite.config.ts
    `-- vercel.json
```
