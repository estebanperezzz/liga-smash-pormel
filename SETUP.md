# 🚀 Guía Rápida de Instalación

## Setup en 4 pasos (¡Ya está configurado con Supabase!)

### 1. Instalar dependencias
```bash
pnpm install
```

### 2. ✅ Base de datos YA CONFIGURADA

El archivo `.env` ya está configurado con las credenciales de Supabase.

**No necesitas hacer nada más con la configuración de base de datos.**

### 3. Ejecutar migraciones
```bash
pnpm prisma:generate
pnpm prisma migrate dev --name init
```

### 4. Poblar personajes
```bash
pnpm prisma:seed
```

### 5. Iniciar aplicación
```bash
pnpm dev
```

Abrir: `http://localhost:3000`

---

## 🎨 UI Moderna con shadcn/ui

Este proyecto usa **shadcn/ui** para componentes modernos y customizables:
- ✅ Componentes ya instalados y configurados
- ✅ Tailwind CSS configurado
- ✅ Dark mode ready
- ✅ Totalmente responsive

---

## 📝 Notas Importantes

- ✅ El `.env` ya tiene configurado `DATABASE_URL` y `DIRECT_URL`
- ✅ El `schema.prisma` ya está configurado para usar `directUrl`
- ✅ shadcn/ui components están en `/components/ui`
- ✅ No necesitas configurar nada manualmente

---

## 📱 Páginas Disponibles

- **/** - Página de inicio
- **/ranking** - Ranking semanal con tabla de posiciones
- **/match/new** - Registrar nueva partida
- **/characters** - Seleccionar personaje semanal
- **/players** - Gestión de jugadores
- **/history** - Historial de campeones

---

## Comandos Útiles

```bash
# Ver datos en interfaz visual
pnpm prisma:studio

# Resetear base de datos (⚠️ borra todo)
pnpm prisma:migrate reset

# Re-poblar personajes
pnpm prisma:seed

# Build para producción
pnpm build
pnpm start
```

---

## ⚠️ Solución de Problemas

### Error de conexión
Si tienes error de conexión, verifica que:
1. Tu proyecto de Supabase esté activo
2. La IP desde donde te conectas esté permitida en Supabase (Settings > Database > Connection pooling)

### No aparecen los personajes
```bash
pnpm prisma:seed
```

### Quiero empezar de cero
```bash
pnpm prisma:migrate reset
pnpm prisma:seed
```

---

**¡Listo para jugar! 🎮**

