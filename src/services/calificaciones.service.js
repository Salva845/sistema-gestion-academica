// =========================================
// src/services/calificaciones.service.js
// Servicio para manejo de calificaciones
// =========================================

import { supabase } from '../lib/supabase';

// Set para rastrear funciones RPC no disponibles
const funcionesNoDisponibles = new Set();

// Verificar que el cliente de Supabase esté inicializado
const verificarClienteSupabase = () => {
  if (!supabase) {
    throw new Error('Cliente de Supabase no inicializado');
  }
};

export const calificacionesService = {
  /**
   * Obtener calificaciones de un estudiante por grupo con promedio calculado en PostgreSQL
   */
  async obtenerCalificacionesPorGrupo(inscripcionId) {
    try {
      verificarClienteSupabase();
      
      // Si ya sabemos que la función no existe, saltar directamente al fallback
      if (!funcionesNoDisponibles.has('obtener_calificaciones_con_promedio')) {
        try {
          const { data, error } = await supabase.rpc('obtener_calificaciones_con_promedio', {
            p_inscripcion_id: inscripcionId
          });

          // Si la función existe y retorna datos, usarla
          if (!error && data && data.length > 0) {
            const result = data[0];
            return { 
              data: result.calificaciones || [], 
              promedio: parseFloat(result.promedio || 0),
              error: null 
            };
          }

          // Si hay error porque la función no existe o falta API key, marcarla y usar fallback
          if (error && (
            error.code === 'PGRST202' || 
            error.code === 'PGRST301' ||
            error.status === 404 ||
            error.message?.includes('Could not find') ||
            error.message?.includes('No API key found') ||
            error.message?.includes('apikey') ||
            error.message?.includes('404')
          )) {
            console.warn('Función obtener_calificaciones_con_promedio no disponible, usando fallback');
            funcionesNoDisponibles.add('obtener_calificaciones_con_promedio');
          } else if (error) {
            // Si es otro tipo de error, también usar fallback pero loguearlo
            console.warn('Error en obtener_calificaciones_con_promedio:', error);
            funcionesNoDisponibles.add('obtener_calificaciones_con_promedio');
          }
        } catch (rpcError) {
          // Si falla la llamada (404, API key, etc.), marcar como no disponible
          if (rpcError.message?.includes('API key') || rpcError.message?.includes('apikey')) {
            console.error('Error de configuración de Supabase:', rpcError.message);
            // No marcar como no disponible si es un error de configuración
            throw rpcError;
          }
          // Manejar errores 404 y otros errores de red
          if (rpcError.status === 404 || rpcError.message?.includes('404') || rpcError.code === 'PGRST301') {
            console.warn('Función obtener_calificaciones_con_promedio no encontrada (404), usando fallback');
            funcionesNoDisponibles.add('obtener_calificaciones_con_promedio');
          } else {
            console.warn('Error en RPC obtener_calificaciones_con_promedio:', rpcError);
            funcionesNoDisponibles.add('obtener_calificaciones_con_promedio');
          }
        }
      }
      
      // Fallback: Obtener calificaciones directamente
      const { data: calificaciones, error: calError } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('inscripcion_id', inscripcionId)
        .order('fecha', { ascending: false });

      if (calError) {
        return { data: [], promedio: 0, error: calError };
      }

      // Calcular promedio ponderado en el frontend
      const promedio = this.calcularPromedioPonderado(calificaciones || []);

      return { 
        data: calificaciones || [], 
        promedio,
        error: null 
      };
    } catch (error) {
      console.error('Error obteniendo calificaciones por grupo:', error);
      return { data: [], promedio: 0, error };
    }
  },

  /**
   * Calcular promedio ponderado en el frontend (fallback)
   */
  calcularPromedioPonderado(calificaciones) {
    if (!calificaciones || calificaciones.length === 0) {
      return 0;
    }

    let sumaPonderada = 0;
    let totalPeso = 0;

    calificaciones.forEach(cal => {
      const valorNormalizado = (Number(cal.valor) / Number(cal.valor_maximo)) * 10;
      const peso = Number(cal.peso) || 0;
      sumaPonderada += valorNormalizado * peso;
      totalPeso += peso;
    });

    if (totalPeso === 0) {
      return 0;
    }

    return parseFloat((sumaPonderada / totalPeso).toFixed(2));
  },

  /**
   * Obtener evolución de calificaciones
   */
  async obtenerEvolucionCalificaciones(inscripcionId, agruparPor = 'semana') {
    try {
      verificarClienteSupabase();

      if (!funcionesNoDisponibles.has('obtener_evolucion_calificaciones')) {
        try {
          // Pasar parámetros explícitamente (Supabase RPC requiere todos los parámetros)
          const params = {
            p_inscripcion_id: inscripcionId,
            p_agrupar_por: agruparPor || 'semana' // Siempre pasar el parámetro
          };

          const { data, error } = await supabase.rpc('obtener_evolucion_calificaciones', params);

          if (!error && data) {
            return { data: data || [], error: null };
          }

          // Manejar errores 400, 404 y otros
          if (error) {
            console.warn('Error en obtener_evolucion_calificaciones:', error);
            if (
              error.code === 'PGRST202' ||
              error.code === 'PGRST301' ||
              error.status === 404 ||
              error.status === 400 ||
              error.message?.includes('Could not find') ||
              error.message?.includes('Bad Request')
            ) {
              funcionesNoDisponibles.add('obtener_evolucion_calificaciones');
            }
          }
        } catch (rpcError) {
          console.warn('Error en RPC obtener_evolucion_calificaciones:', rpcError);
          if (
            rpcError.status === 404 || 
            rpcError.status === 400 ||
            rpcError.message?.includes('404') ||
            rpcError.message?.includes('400')
          ) {
            funcionesNoDisponibles.add('obtener_evolucion_calificaciones');
          }
        }
      }

      // Fallback: calcular evolución en el frontend
      const { data: calificaciones, error: calError } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('inscripcion_id', inscripcionId)
        .order('fecha', { ascending: true });

      if (calError) {
        return { data: [], error: calError };
      }

      // Calcular evolución acumulada
      const evolucion = [];
      let sumaPonderada = 0;
      let totalPeso = 0;

      (calificaciones || []).forEach(cal => {
        const valorNormalizado = (Number(cal.valor) / Number(cal.valor_maximo)) * 10;
        const peso = Number(cal.peso) || 0;
        sumaPonderada += valorNormalizado * peso;
        totalPeso += peso;

        const promedioAcumulado = totalPeso > 0 ? sumaPonderada / totalPeso : 0;

        evolucion.push({
          periodo: cal.fecha,
          promedio_acumulado: parseFloat(promedioAcumulado.toFixed(2)),
          cantidad_evaluaciones: evolucion.length + 1
        });
      });

      return { data: evolucion, error: null };
    } catch (error) {
      console.error('Error obteniendo evolución de calificaciones:', error);
      return { data: [], error };
    }
  },

  /**
   * Obtener resumen por tipo de evaluación (función síncrona)
   */
  obtenerResumenPorTipo(calificaciones) {
    if (!calificaciones || calificaciones.length === 0) {
      return [];
    }

    const tipos = ['examen', 'tarea', 'proyecto', 'participacion', 'exposicion'];
    const resumen = tipos.map(tipo => {
      const calsTipo = calificaciones.filter(c => c.tipo === tipo);
      
      if (calsTipo.length === 0) {
        return null;
      }

      const suma = calsTipo.reduce((sum, c) => {
        const valorNormalizado = (Number(c.valor) / Number(c.valor_maximo)) * 10;
        return sum + valorNormalizado;
      }, 0);

      return {
        tipo,
        cantidad: calsTipo.length,
        promedio: parseFloat((suma / calsTipo.length).toFixed(2))
      };
    }).filter(item => item !== null);

    return resumen;
  },

  /**
   * Crear una nueva calificación
   */
  async crearCalificacion(calificacionData) {
    try {
      verificarClienteSupabase();

      const { data, error } = await supabase
        .from('calificaciones')
        .insert([calificacionData])
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creando calificación:', error);
      return { data: null, error };
    }
  },

  /**
   * Actualizar una calificación existente
   */
  async actualizarCalificacion(calificacionId, calificacionData) {
    try {
      verificarClienteSupabase();

      const { data, error } = await supabase
        .from('calificaciones')
        .update(calificacionData)
        .eq('id', calificacionId)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error actualizando calificación:', error);
      return { data: null, error };
    }
  },

  /**
   * Eliminar una calificación
   */
  async eliminarCalificacion(calificacionId) {
    try {
      verificarClienteSupabase();

      const { error } = await supabase
        .from('calificaciones')
        .delete()
        .eq('id', calificacionId);

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error eliminando calificación:', error);
      return { error };
    }
  }
};
