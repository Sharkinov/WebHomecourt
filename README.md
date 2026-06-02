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

4. Revisa que la migracion se pueda aplicar y luego subela a la instancia remota:

```bash
npx supabase db push --dry-run
npx supabase db push
```

#### Desde la interfaz de Supabase

1. Entra al dashboard de tu proyecto en Supabase.
2. Abre la seccion `SQL Editor`.
3. Crea una consulta nueva.
4. Copia y pega el contenido de `schema.sql`.
5. Ejecuta la consulta.
6. Revisa en `Table Editor` que las tablas, relaciones, funciones, triggers y politicas esperadas se hayan creado correctamente.

Si el esquema se aplica sobre una base que ya tiene tablas, extensiones o politicas con los mismos nombres, Supabase/Postgres puede marcar errores por objetos duplicados. En ese caso, usa una instancia limpia o adapta el SQL antes de ejecutarlo.

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
