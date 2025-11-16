// =========================================
// src/lib/constants.js
// =========================================

export const ROLES = {
  ADMIN: 'admin',
  DOCENTE: 'docente',
  ESTUDIANTE: 'estudiante',
};

export const ESTADOS_INSCRIPCION = {
  ACTIVO: 'activo',
  COMPLETADO: 'completado',
  ABANDONADO: 'abandonado',
};

export const METODOS_ASISTENCIA = {
  QR: 'qr',
  MANUAL: 'manual',
  GEOLOCALIZADO: 'geolocalizado',
};

export const TIPOS_CALIFICACION = {
  EXAMEN: 'examen',
  TAREA: 'tarea',
  PROYECTO: 'proyecto',
  PARTICIPACION: 'participacion',
  EXPOSICION: 'exposicion',
};

export const TIPOS_CALIFICACION_LABELS = {
  examen: 'Examen',
  tarea: 'Tarea',
  proyecto: 'Proyecto',
  participacion: 'Participación',
  exposicion: 'Exposición',
};

export const CALIFICACION_CONFIG = {
  VALOR_MAXIMO_DEFAULT: 10,
  PESO_DEFAULT: 10,
  APROBATORIO: 6,
};

export const QR_CONFIG = {
  EXPIRACION_MINUTOS: 10,
  REFRESH_INTERVAL: 60000, 
};

export const PAGINATION = {
  ITEMS_PER_PAGE: 10,
  MAX_PAGE_BUTTONS: 5,
};

export const DATE_FORMATS = {
  SHORT: 'dd/MM/yy',
  MEDIUM: 'dd/MM/yyyy',
  LONG: 'dd \'de\' MMMM \'de\' yyyy',
  TIME: 'HH:mm',
  DATETIME: 'dd/MM/yyyy HH:mm',
};

export const COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  ADMIN: {
    DASHBOARD: '/admin',
    USUARIOS: '/admin/usuarios',
    MATERIAS: '/admin/materias',
    GRUPOS: '/admin/grupos',
  },
  DOCENTE: {
    DASHBOARD: '/docente',
    GRUPOS: '/docente/grupos',
    ASISTENCIA: '/docente/asistencia',
    CALIFICACIONES: '/docente/calificaciones',
  },
  ESTUDIANTE: {
    DASHBOARD: '/estudiante',
    MATERIAS: '/estudiante/materias',
    ASISTENCIA: '/estudiante/asistencia',
    CALIFICACIONES: '/estudiante/calificaciones', 
  },
};