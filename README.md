# 🎓 Sistema de Gestión Académica

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

Un sistema web moderno y completo para la administración de materias, grupos, asistencias y calificaciones, diseñado para instituciones educativas.

---

## ✨ Características Principales

- **🔐 Autenticación Robusta:** Sistema seguro de inicio de sesión y registro gestionado por Supabase Auth, con protección de rutas basada en roles.
- **👥 Roles de Usuario:** Arquitectura multi-rol (Administrador, Docente, Estudiante) con interfaces y permisos personalizados.
- **📚 Gestión Académica Integral:** Administración eficiente de materias, grupos, inscripciones y periodos escolares.
- **📱 Control de Asistencia QR:** Sistema innovador que permite a los docentes generar códigos QR dinámicos y a los estudiantes escanearlos para registrar su asistencia al instante.
- **📊 Sistema de Calificaciones:** Registro detallado y consulta de calificaciones, con cálculo automático de promedios.
- **📈 Dashboards Interactivos:** Paneles de control visuales con gráficos (Recharts) para visualizar estadísticas clave.
- **🎨 Interfaz Moderna y Responsiva:** Diseño limpio y profesional utilizando Tailwind CSS y componentes de Radix UI, totalmente adaptable a dispositivos móviles y con soporte para modo oscuro.
- **⚡ Feedback en Tiempo Real:** Notificaciones instantáneas (Sonner) para confirmar acciones y alertar sobre eventos importantes.

---

## 🛠️ Tecnologías Utilizadas

Este proyecto utiliza un stack moderno y potente para garantizar rendimiento, escalabilidad y una excelente experiencia de desarrollador.

### Frontend
| Categoría | Tecnología | Descripción |
|-----------|------------|-------------|
| **Core** | [React](https://react.dev/) | Biblioteca principal para la interfaz de usuario. |
| **Build Tool** | [Vite](https://vitejs.dev/) | Entorno de desarrollo ultrarrápido. |
| **Lenguaje** | JavaScript (JSX) | |
| **Estilos** | [Tailwind CSS](https://tailwindcss.com/) | Framework de utilidades para diseño rápido. |
| **Componentes** | [Radix UI](https://www.radix-ui.com/) | Primitivas de componentes accesibles y sin estilos. |
| **Iconos** | [Lucide React](https://lucide.dev/) | Iconos vectoriales ligeros y consistentes. |

### Estado y Datos
| Categoría | Tecnología | Descripción |
|-----------|------------|-------------|
| **Estado Global** | [Zustand](https://github.com/pmndrs/zustand) | Gestión de estado ligera y simple. |
| **Data Fetching** | [TanStack Query](https://tanstack.com/query/latest) | Gestión de estado asíncrono, caché y sincronización. |
| **Formularios** | [React Hook Form](https://react-hook-form.com/) | Manejo de formularios performante. |
| **Validación** | [Zod](https://zod.dev/) | Validación de esquemas TypeScript-first. |

### Backend y Servicios
| Categoría | Tecnología | Descripción |
|-----------|------------|-------------|
| **BaaS** | [Supabase](https://supabase.com/) | Backend as a Service (PostgreSQL, Auth, Realtime). |
| **Base de Datos** | PostgreSQL | Base de datos relacional robusta. |
| **Seguridad** | RLS (Row Level Security) | Políticas de acceso a nivel de fila en la base de datos. |

### Utilidades Extra
- **Gráficos:** [Recharts](https://recharts.org/)
- **Fechas:** [date-fns](https://date-fns.org/)
- **QR:** [html5-qrcode](https://github.com/mebjas/html5-qrcode) y [qrcode.react](https://github.com/zpao/qrcode.react)
- **Notificaciones:** [Sonner](https://sonner.emilkowal.ski/)

---

## 🚀 Cómo Empezar

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

### Prerrequisitos

- Node.js (v18 o superior)
- npm o pnpm
- Una cuenta de Supabase

### 1. Clonar el Repositorio

```bash
git clone https://github.com/salva845/sistema-gestion-academica.git
cd sistema-gestion-academica
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto. Puedes copiar el contenido de `.env.example` y rellenarlo con tus propias credenciales de Supabase.

```env
# .env.local

# Obtén estas credenciales desde tu panel de Supabase
# Ve a Settings -> API
VITE_SUPABASE_URL="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJh..."
```

> ⚠️ **Importante:** Nunca compartas este archivo ni subas tus credenciales a un repositorio público.

### 4. Configurar la Base de Datos

El proyecto incluye un script SQL completo para configurar tu base de datos de Supabase.

1. Ve a tu proyecto en el panel de Supabase.
2. Navega a **SQL Editor**.
3. Copia y pega el contenido del script de configuración principal (`schema.sql`) y ejecútalo.
4. Esto creará todas las tablas, funciones, triggers y políticas de seguridad (RLS) necesarias.

### 5. Ejecutar el Proyecto

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador para ver la aplicación en funcionamiento.

---

## 📁 Estructura del Proyecto

```
sistema-gestion-academica/
├── src/
│   ├── components/       # Componentes reutilizables de UI (Botones, Inputs, Cards...)
│   ├── pages/           # Páginas principales divididas por módulos (Admin, Docente, Estudiante)
│   ├── lib/             # Configuración de clientes (Supabase, QueryClient) y utilidades
│   ├── hooks/           # Custom hooks para lógica reutilizable (useAuth, useToast...)
│   ├── stores/          # Stores de Zustand para estado global
│   └── App.jsx          # Componente principal y configuración de rutas
├── public/              # Archivos estáticos
├── schema.sql           # Script de configuración de la base de datos
├── .env.example         # Ejemplo de variables de entorno
└── package.json         # Dependencias del proyecto
```

---

## 👥 Roles y Funcionalidades

### 🔹 Administrador
- Gestión completa de usuarios, materias y grupos
- Asignación de docentes a materias
- Administración de periodos escolares
- Visualización de reportes generales

### 🔹 Docente
- Gestión de grupos asignados
- Control de asistencias mediante códigos QR
- Registro y actualización de calificaciones
- Consulta de listas de estudiantes

### 🔹 Estudiante
- Consulta de horarios y materias inscritas
- Registro de asistencia mediante escaneo de códigos QR
- Visualización de calificaciones
- Seguimiento de progreso académico

---

## 🔒 Seguridad

El proyecto implementa múltiples capas de seguridad:

- **Row Level Security (RLS)** en Supabase para control de acceso a nivel de base de datos
- **Autenticación JWT** mediante Supabase Auth
- **Protección de rutas** en el frontend según roles de usuario
- **Validación de datos** tanto en cliente (Zod) como en servidor

---

## 📧 Contacto

**Salvador Soberanis**  
📧 Email: salvadorsoberanis65@gmail.com  
🔗 GitHub: [@salva845](https://github.com/salva845)

---

⭐ Si este proyecto te resulta útil, no olvides darle una estrella en GitHub!