// =====================================
// src/services/asistencia.service.js
// =====================================
import { supabase } from '../lib/supabase';

/**
 * Servicio para gestión de asistencias y QR
 */
export const asistenciaService = {
  /**
   * Activar QR para una sesión
   */
  async activarQR(sesionId, duracionMinutos = 10) {
    try {
      const { data, error } = await supabase.rpc('activar_qr_sesion', {
        p_sesion_id: sesionId,
        p_duracion_minutos: duracionMinutos
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error activando QR:', error);
      return { data: null, error };
    }
  },

  /**
   * Desactivar QR de una sesión
   */
  async desactivarQR(sesionId) {
    try {
      const { data, error } = await supabase.rpc('desactivar_qr_sesion', {
        p_sesion_id: sesionId
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error desactivando QR:', error);
      return { data: null, error };
    }
  },

  /**
   * Registrar asistencia mediante QR
   */
  async registrarAsistenciaQR(token, options = {}) {
    try {
      const { data, error } = await supabase.rpc('registrar_asistencia_qr', {
        p_token: token,
        p_latitud: options.latitud || null,
        p_longitud: options.longitud || null,
        p_dispositivo: options.dispositivo || navigator.userAgent
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      return { data: null, error };
    }
  },

  /**
   * Obtener asistentes de una sesión
   */
  async obtenerAsistentes(sesionId) {
    try {
      const { data, error } = await supabase.rpc('obtener_asistentes_sesion', {
        p_sesion_id: sesionId
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo asistentes:', error);
      return { data: null, error };
    }
  },

  /**
   * Obtener sesión por ID con información completa
   */
  async obtenerSesion(sesionId) {
    try {
      const { data, error } = await supabase
        .from('sesiones_clase')
        .select(`
          *,
          grupos (
            *,
            materias (nombre, codigo, creditos),
            docente:profiles!docente_id (nombre, apellido)
          )
        `)
        .eq('id', sesionId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      return { data: null, error };
    }
  },

  /**
   * Crear nueva sesión de clase
   */
  async crearSesion(sesionData) {
    try {
      const { data, error } = await supabase
        .from('sesiones_clase')
        .insert([sesionData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creando sesión:', error);
      return { data: null, error };
    }
  },

  /**
   * Obtener asistencias de un estudiante
   */
  async obtenerAsistenciasEstudiante(estudianteId, grupoId = null) {
    try {
      let query = supabase
        .from('asistencias')
        .select(`
          *,
          sesiones_clase (
            *,
            grupos (
              *,
              materias (nombre, codigo)
            )
          )
        `)
        .eq('estudiante_id', estudianteId)
        .order('hora_registro', { ascending: false });

      if (grupoId) {
        query = query.eq('sesiones_clase.grupo_id', grupoId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo asistencias:', error);
      return { data: null, error };
    }
  },

  /**
   * Obtener estadísticas de asistencia
   */
  async obtenerEstadisticasAsistencia(grupoId, estudianteId) {
    try {
      // Obtener total de sesiones
      const { data: sesiones, error: errorSesiones } = await supabase
        .from('sesiones_clase')
        .select('id')
        .eq('grupo_id', grupoId);

      if (errorSesiones) throw errorSesiones;

      // Obtener asistencias del estudiante
      const { data: asistencias, error: errorAsistencias } = await supabase
        .from('asistencias')
        .select('id, sesion_id')
        .eq('estudiante_id', estudianteId)
        .in('sesion_id', sesiones.map(s => s.id));

      if (errorAsistencias) throw errorAsistencias;

      const totalSesiones = sesiones?.length || 0;
      const totalAsistencias = asistencias?.length || 0;
      const porcentaje = totalSesiones > 0 
        ? Math.round((totalAsistencias / totalSesiones) * 100) 
        : 0;

      return {
        data: {
          totalSesiones,
          totalAsistencias,
          porcentaje,
          faltas: totalSesiones - totalAsistencias
        },
        error: null
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { data: null, error };
    }
  }
};
