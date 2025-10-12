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

// Calcular promedio ponderado
export function calcularPromedioPonderado(calificaciones) {
  if (!calificaciones || calificaciones.length === 0) return 0;
  
  const totalPesos = calificaciones.reduce((sum, cal) => sum + cal.peso, 0);
  if (totalPesos === 0) return 0;
  
  const sumaCalificaciones = calificaciones.reduce(
    (sum, cal) => sum + (cal.valor * cal.peso / cal.valor_maximo),
    0
  );
  
  return (sumaCalificaciones / totalPesos) * 10;
}

// Calcular porcentaje de asistencia
export function calcularPorcentajeAsistencia(asistencias, totalSesiones) {
  if (totalSesiones === 0) return 0;
  return (asistencias / totalSesiones) * 100;
}