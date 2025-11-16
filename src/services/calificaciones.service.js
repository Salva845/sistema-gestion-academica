// =========================================
// src/services/calificaciones.service.js
// Servicio para gestión de calificaciones
// =========================================
import { supabase } from '../lib/supabase';

export const calificacionesService = {
  /**
   * Obtener calificaciones de un estudiante por grupo
   */
  async obtenerCalificacionesPorGrupo(inscripcionId) {
    try {
      const { data, error } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('inscripcion_id', inscripcionId)
        .order('fecha', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo calificaciones:', error);
      return { data: null, error };
    }
  },

  /**
   * Obtener todas las calificaciones de un estudiante
   */
  async obtenerCalificacionesEstudiante(estudianteId) {
    try {
      // Primero obtener las inscripciones del estudiante
      const { data: inscripciones, error: inscError } = await supabase
        .from('inscripciones')
        .select(`
          id,
          estudiante_id,
          grupos (
            id,
            periodo,
            materias (nombre, codigo)
          )
        `)
        .eq('estudiante_id', estudianteId)
        .eq('estado', 'activo');

      if (inscError) throw inscError;

      const inscripcionesIds = inscripciones?.map(i => i.id) || [];
      
      if (inscripcionesIds.length === 0) {
        return { data: [], error: null };
      }

      // Luego obtener las calificaciones de esas inscripciones
      const { data: calificaciones, error: calError } = await supabase
        .from('calificaciones')
        .select('*')
        .in('inscripcion_id', inscripcionesIds)
        .order('fecha', { ascending: false });

      if (calError) throw calError;

      // Enriquecer calificaciones con info de inscripción
      const calificacionesEnriquecidas = calificaciones?.map(cal => {
        const inscripcion = inscripciones.find(i => i.id === cal.inscripcion_id);
        return {
          ...cal,
          inscripciones: inscripcion
        };
      });

      return { data: calificacionesEnriquecidas || [], error: null };
    } catch (error) {
      console.error('Error obteniendo calificaciones estudiante:', error);
      return { data: null, error };
    }
  },

  /**
   * Crear una nueva calificación
   */
  async crearCalificacion(calificacionData) {
    try {
      const { data, error } = await supabase
        .from('calificaciones')
        .insert([calificacionData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creando calificación:', error);
      return { data: null, error };
    }
  },

  /**
   * Actualizar una calificación
   */
  async actualizarCalificacion(id, updates) {
    try {
      const { data, error } = await supabase
        .from('calificaciones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error actualizando calificación:', error);
      return { data: null, error };
    }
  },

  /**
   * Eliminar una calificación
   */
  async eliminarCalificacion(id) {
    try {
      const { error } = await supabase
        .from('calificaciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error eliminando calificación:', error);
      return { data: null, error };
    }
  },

  /**
   * Calcular promedio ponderado de una inscripción
   */
  calcularPromedioPonderado(calificaciones) {
    if (!calificaciones || calificaciones.length === 0) return 0;

    const totalPeso = calificaciones.reduce((sum, cal) => sum + Number(cal.peso), 0);
    if (totalPeso === 0) return 0;

    const sumaPonderada = calificaciones.reduce((sum, cal) => {
      const valorNormalizado = (Number(cal.valor) / Number(cal.valor_maximo)) * 10;
      return sum + (valorNormalizado * Number(cal.peso));
    }, 0);

    return (sumaPonderada / totalPeso).toFixed(2);
  },

  /**
   * Obtener estadísticas de calificaciones por grupo
   */
  async obtenerEstadisticasGrupo(grupoId) {
    try {
      // Obtener todas las inscripciones del grupo
      const { data: inscripciones, error: inscError } = await supabase
        .from('inscripciones')
        .select('id, estudiante_id')
        .eq('grupo_id', grupoId)
        .eq('estado', 'activo');

      if (inscError) throw inscError;

      // Obtener perfiles de estudiantes
      const estudiantesIds = inscripciones?.map(i => i.estudiante_id) || [];
      
      if (estudiantesIds.length === 0) {
        return { data: [], error: null };
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nombre, apellido, matricula')
        .in('user_id', estudiantesIds);

      if (profilesError) throw profilesError;

      // Para cada inscripción, obtener sus calificaciones
      const estudiantesConCalificaciones = await Promise.all(
        (inscripciones || []).map(async (insc) => {
          const profile = profiles?.find(p => p.user_id === insc.estudiante_id);
          
          const { data: calificaciones } = await supabase
            .from('calificaciones')
            .select('*')
            .eq('inscripcion_id', insc.id);

          const promedio = this.calcularPromedioPonderado(calificaciones || []);

          return {
            inscripcion_id: insc.id,
            estudiante_id: insc.estudiante_id,
            estudiante: profile,
            calificaciones: calificaciones || [],
            promedio: parseFloat(promedio)
          };
        })
      );

      return { data: estudiantesConCalificaciones, error: null };
    } catch (error) {
      console.error('Error obteniendo estadísticas grupo:', error);
      return { data: null, error };
    }
  },  

  /**
   * Obtener resumen de calificaciones por tipo
   */
  obtenerResumenPorTipo(calificaciones) {
    const tipos = ['examen', 'tarea', 'proyecto', 'participacion', 'exposicion'];
    
    return tipos.map(tipo => {
      const calsTipo = calificaciones.filter(c => c.tipo === tipo);
      if (calsTipo.length === 0) return null;

      const promedio = calsTipo.reduce((sum, c) => {
        return sum + (Number(c.valor) / Number(c.valor_maximo)) * 10;
      }, 0) / calsTipo.length;

      return {
        tipo,
        cantidad: calsTipo.length,
        promedio: promedio.toFixed(2)
      };
    }).filter(Boolean);
  }
};