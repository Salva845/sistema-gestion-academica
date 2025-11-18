// =========================================
// src/lib/utils.js
// Funciones helper para el proyecto
// =========================================

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combinar clases de Tailwind sin conflictos
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Formatear fechas
export function formatDate(date, format = 'dd/MM/yyyy') {
  if (!date) return '';
  // Implementar con date-fns o nativo
  return new Date(date).toLocaleDateString('es-MX');
}

// Generar token único para sesiones
export function generateSessionToken() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// NOTA: calcularPromedioPonderado fue movido a calificaciones.service.js
// Este archivo ya no contiene esta función para evitar duplicación
// Usar calificacionesService.calcularPromedioPonderado() o mejor aún,
// calificacionesService.obtenerPromedioPonderado() que usa PostgreSQL

// Calcular porcentaje de asistencia
export function calcularPorcentajeAsistencia(asistencias, totalSesiones) {
  if (totalSesiones === 0) return 0;
  return (asistencias / totalSesiones) * 100;
}