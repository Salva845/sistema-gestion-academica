# 🎓 Sistema de Gestión Académica

Template de Un sistema web moderno y completo para la administración de materias, grupos, asistencias y calificaciones, diseñado para instituciones educativas.

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
│   ├── components/       # Componentes reutilizables de UI
│   ├── pages/           # Páginas principales de la aplicación
│   ├── lib/             # Configuración de Supabase y utilidades
│   ├── hooks/           # Custom hooks de React
│   └── App.jsx          # Componente principal
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
- **Validación de datos** tanto en cliente como en servidor

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si quieres mejorar el proyecto o reportar algún problema, contáctame a [salvadorsoberanis65@gmail.com](mailto:salvadorsoberanis65@gmail.com).

### Pasos para Contribuir

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📧 Contacto

**Salvador Soberanis**  
📧 Email: salvadorsoberanis65@gmail.com  
🔗 GitHub: [@salva845](https://github.com/salva845)

---

## 🙏 Agradecimientos

- [Supabase](https://supabase.com/) - Por proporcionar una plataforma backend completa
- [React](https://react.dev/) - Framework de UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework de estilos
- [Radix UI](https://www.radix-ui.com/) - Componentes accesibles

---

⭐ Si este proyecto te resulta útil, no olvides darle una estrella en GitHub!