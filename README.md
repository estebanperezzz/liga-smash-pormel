# 🎮 Liga Smash Bros Ultimate - Pormel

Sistema de liga semanal para Super Smash Bros Ultimate con registro de partidas, ranking en tiempo real y gestión de personajes.

## 📋 Características

- ✅ Sistema de puntos dinámicos según cantidad de jugadores
- ✅ Selección de personaje semanal único (sin repeticiones)
- ✅ Ranking actualizado en tiempo real
- ✅ Historial de campeones semanales
- ✅ Reset automático cada semana (lunes a viernes)
- ✅ 89 personajes de Smash Bros Ultimate incluidos

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ instalado
- pnpm instalado (`npm install -g pnpm`)
- Cuenta en Supabase (o PostgreSQL local)

### Pasos

1. **Clonar el repositorio** (o navegar al directorio del proyecto)

```bash
cd ~/git-repo/liga-smash-pormel
```

2. **Instalar dependencias**

```bash
pnpm install
```

3. **Configurar variables de entorno**

Crear un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de Supabase:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Opcional - Solo si usas funcionalidades adicionales de Supabase
NEXT_PUBLIC_SUPABASE_URL="your-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

4. **Generar cliente de Prisma**

```bash
pnpm prisma:generate
```

5. **Crear la base de datos y ejecutar migraciones**

```bash
pnpm prisma:migrate
```

Esto creará todas las tablas necesarias en tu base de datos.

6. **Poblar la base de datos con los personajes**

```bash
pnpm prisma:seed
```

Esto insertará los 89 personajes de Smash Bros Ultimate.

7. **Iniciar el servidor de desarrollo**

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

- **Character**: 89 personajes de Smash Bros Ultimate
- **Player**: Jugadores registrados
- **Week**: Semanas de competición (lunes a viernes)
- **WeeklyCharacter**: Selección de personaje por jugador por semana
- **Match**: Partidas jugadas
- **MatchResult**: Resultados individuales de cada partida

### Relaciones

```
Player ─── WeeklyCharacter ─── Character
  │             │
  │             │
  │          Week ──── Match ──── MatchResult ─── Player
  │                                    │
  └────────────────────────────────────┘
```

## 📚 Scripts Disponibles

```bash
# Desarrollo
pnpm dev                # Iniciar servidor de desarrollo

# Producción
pnpm build             # Construir para producción
pnpm start             # Iniciar servidor de producción

# Prisma
pnpm prisma:generate   # Generar cliente de Prisma
pnpm prisma:migrate    # Ejecutar migraciones
pnpm prisma:seed       # Poblar base de datos con personajes
pnpm prisma:studio     # Abrir Prisma Studio (UI para ver datos)

# Utilidades
pnpm lint              # Ejecutar linter
```

## 🎯 Uso de la Aplicación

### 1. Crear Jugadores

Navegar a **Jugadores** y agregar los participantes de la liga.

### 2. Seleccionar Personaje Semanal

Cada jugador debe ir a **Personajes** al inicio de la semana y seleccionar su personaje (único, no se repite).

### 3. Registrar Partidas

Durante la semana, después de cada partida, ir a **Registrar Partida** y cargar:
- Los jugadores que participaron
- La posición final de cada uno (1°, 2°, 3°, etc.)

El sistema calculará automáticamente los puntos según la cantidad de jugadores.

### 4. Ver Ranking

En **Ranking Semanal** se puede ver:
- Puntos totales de cada jugador
- Partidas jugadas
- Historial de posiciones
- Personaje utilizado

### 5. Historial de Campeones

En **Historial** se pueden ver todos los campeones semanales anteriores.

## 🔧 Configuración de Supabase

### Crear Proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Esperar a que se inicialice
4. Ir a **Settings** > **Database**
5. Copiar la **Connection String** en formato URI

### Formato de Connection String

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

Pegar esta URL en tu archivo `.env` como `DATABASE_URL`.

## 🛠️ APIs Disponibles

### Jugadores
- `GET /api/players` - Obtener todos los jugadores
- `POST /api/players` - Crear nuevo jugador

### Personajes
- `GET /api/characters` - Obtener todos los personajes
- `GET /api/characters?weekId=X` - Obtener personajes con disponibilidad

### Semanas
- `GET /api/weeks/current` - Obtener semana actual
- `POST /api/weeks/select-character` - Seleccionar personaje semanal
- `GET /api/weeks/ranking?weekId=X` - Obtener ranking de una semana

### Partidas
- `POST /api/matches` - Registrar nueva partida
- `GET /api/matches?weekId=X` - Obtener partidas de una semana

## 📊 Sistema de Puntos

El sistema de puntos es **dinámico** según la cantidad de jugadores:

- N jugadores → 1° lugar = N puntos
- Último lugar siempre = 1 punto

**Ejemplos:**

| Jugadores | 1° | 2° | 3° | 4° | 5° | 6° | 7° |
|-----------|----|----|----|----|----|----|-----|
| 7         | 7  | 6  | 5  | 4  | 3  | 2  | 1   |
| 5         | 5  | 4  | 3  | 2  | 1  | -  | -   |
| 4         | 4  | 3  | 2  | 1  | -  | -  | -   |

## 🎨 Tecnologías Utilizadas

- **Next.js 15** - Framework de React
- **Prisma ORM** - ORM para PostgreSQL
- **Supabase** - Backend como servicio (PostgreSQL)
- **Tailwind CSS** - Estilos
- **Axios** - Cliente HTTP (para futuras integraciones)
- **pnpm** - Gestor de paquetes

## 📝 Notas Importantes

- La semana comienza **lunes a las 00:00** y termina **viernes a las 23:59**
- Cada jugador solo puede seleccionar **un personaje por semana**
- Un personaje **no puede ser usado por dos jugadores** la misma semana
- Los puntos se **resetean automáticamente** cada lunes
- Se puede entrar a jugar **mid-week** sin problemas

## 🐛 Solución de Problemas

### Error de conexión a la base de datos

Verificar que:
1. El `DATABASE_URL` en `.env` sea correcto
2. El proyecto de Supabase esté activo
3. El password no contenga caracteres especiales sin encodear

### Los personajes no aparecen

Ejecutar:
```bash
pnpm prisma:seed
```

### Error al crear partida

Verificar que:
1. Todos los jugadores hayan seleccionado su personaje semanal
2. No haya posiciones duplicadas
3. Las posiciones sean consecutivas desde 1

## 👥 Contribuir

Para reportar bugs o sugerir mejoras, crear un issue en el repositorio.

## 📄 Licencia

Este proyecto es de uso interno para Pormel.

---

**Desarrollado con ❤️ para la Liga Smash Bros Ultimate - Pormel**
# liga-smash-pormel
