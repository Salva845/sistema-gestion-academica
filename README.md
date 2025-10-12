# 🎓 Sistema de Gestión Académica

Un sistema web moderno y completo para la administración de materias, grupos, asistencias y calificaciones, diseñado para instituciones educativas.

---

## ✨ Características Principales

- **Autenticación Segura:** Sistema de inicio de sesión y registro con protección de rutas.
- **Roles de Usuario:** Tres roles definidos con permisos específicos: Administrador, Docente y Estudiante.
- **Gestión Académica:** Módulos para administrar materias, grupos, inscripciones y periodos escolares.
- **Control de Asistencia:** Sistema innovador con generación y escaneo de códigos QR para el registro de asistencia.
- **Sistema de Calificaciones:** Registro y consulta de calificaciones por materia y estudiante.
- **Dashboards Personalizados:** Paneles de control intuitivos que muestran información relevante para cada rol.
- **Interfaz Moderna:** Diseño responsivo, con modo claro y oscuro, construido con componentes reutilizables.

---

## 🛠️ Tecnologías Utilizadas

| Área      | Tecnología                                                      |
|-----------|----------------------------------------------------------------|
| Frontend  | React, Vite, Tailwind CSS, React Router, Radix UI             |
| Backend   | Supabase (Base de Datos PostgreSQL, Autenticación, Storage, RLS) |
| Lenguaje  | JavaScript (JSX)                                               |
| CI/CD     | GitHub Actions                                                 |

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
2. Instalar Dependencias
Copiar código
npm install
3. Configurar Variables de Entorno
Crea un archivo .env.local en la raíz del proyecto. Puedes copiar el contenido de .env.example y rellenarlo con tus propias credenciales de Supabase.

# .env.local

# Obtén estas credenciales desde tu panel de Supabase
# Ve a Settings -> API
VITE_SUPABASE_URL="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJh..."
⚠️ Importante: Nunca compartas este archivo ni subas tus credenciales a un repositorio público.

4. Configurar la Base de Datos
El proyecto incluye un script SQL completo para configurar tu base de datos de Supabase.

Ve a tu proyecto en el panel de Supabase.

Navega a SQL Editor.


Copia y pega el contenido del script de configuración principal (schema.sql) y ejecútalo.

Esto creará todas las tablas, funciones, triggers y políticas de seguridad (RLS) necesarias.

5. Ejecutar el Proyecto
npm run dev
Abre http://localhost:5173 en tu navegador para ver la aplicación en funcionamiento.

🤝 Contribuciones
¡Las contribuciones son bienvenidas!
Si quieres mejorar el proyecto o reportar algún problema, contáctame a salvadorsoberanis65@gmail.com.