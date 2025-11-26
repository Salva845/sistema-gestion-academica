// =========================================
// src/services/dashboard.service.js
// Servicio para Dashboard Administrativo
// =========================================
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import {
  calcularMetricasGlobalesFrontend,
  calcularDistribucionCalificacionesFrontend,
  calcularAsistenciaPorGrupoFrontend,
  calcularTendenciasCalificacionesFrontend,
  calcularTendenciasAsistenciaFrontend,
  calcularMateriasPopularesFrontend
} from '../utils/dashboardCalculations';

// Cache para funciones PostgreSQL no disponibles
let funcionesNoDisponibles = new Set();

export const dashboardService = {
  /**
   * Obtener métricas globales del sistema
   */
  async obtenerMetricasGlobales(filtros = {}) {
    try {
      const { periodo, materiaId, grupoId } = filtros;

      // Intentar usar función PostgreSQL
      if (!funcionesNoDisponibles.has('obtener_metricas_globales')) {
        try {
          // Pasar null explícitamente para parámetros opcionales
          const params = {
            p_periodo: periodo || null,
            p_materia_id: materiaId || null,
            p_grupo_id: grupoId || null
          };

          const { data, error } = await supabase.rpc('obtener_metricas_globales', params);

          if (error) {
            console.error('Error RPC obtener_metricas_globales:', error);
            if (error.code === 'PGRST202' || error.message?.includes('Could not find')) {
              funcionesNoDisponibles.add('obtener_metricas_globales');
            }
            // Continuar con fallback
          } else if (data && data.length > 0) {
            const result = data[0];
            return {
              data: {
                totalEstudiantes: parseInt(result.total_estudiantes || 0),
                totalDocentes: parseInt(result.total_docentes || 0),
                totalGrupos: parseInt(result.total_grupos || 0),
                promedioGeneral: parseFloat(result.promedio_general || 0),
                asistenciaPromedio: parseFloat(result.asistencia_promedio || 0)
              },
              error: null
            };
          }
        } catch (rpcError) {
          console.error('Error en RPC obtener_metricas_globales:', rpcError);
          if (!rpcError.message?.includes('API key')) {
            funcionesNoDisponibles.add('obtener_metricas_globales');
          }
        }
      }

      // Fallback: calcular en frontend
      return this.calcularMetricasGlobalesFrontend(filtros);
    } catch (error) {
      console.error('Error obteniendo métricas globales:', error);
      toast.error('Error al cargar métricas globales');
      return { data: null, error };
    }
  },

  /**
   * Calcular métricas globales en frontend (fallback)
   */
  async calcularMetricasGlobalesFrontend(filtros = {}) {
    return calcularMetricasGlobalesFrontend(filtros);
  },

  /**
   * Obtener distribución de calificaciones (histograma)
   */
  async obtenerDistribucionCalificaciones(filtros = {}) {
    try {
      const { periodo, materiaId, grupoId } = filtros;

      if (!funcionesNoDisponibles.has('obtener_distribucion_calificaciones')) {
        try {
          // Pasar null explícitamente para parámetros opcionales
          const params = {
            p_periodo: periodo || null,
            p_materia_id: materiaId || null,
            p_grupo_id: grupoId || null
          };

          const { data, error } = await supabase.rpc('obtener_distribucion_calificaciones', params);

          if (error) {
            console.error('Error RPC obtener_distribucion_calificaciones:', error);
            if (error.code === 'PGRST202' || error.message?.includes('Could not find')) {
              funcionesNoDisponibles.add('obtener_distribucion_calificaciones');
            }
            // Continuar con fallback
          } else if (data) {
            if (data.length === 0) {
              // RPC devolvió array vacío, usar fallback
            } else {
              return {
                data: data.map(item => ({
                  name: item.rango,
                  value: parseInt(item.cantidad || 0),
                  porcentaje: parseFloat(item.porcentaje || 0)
                })),
                error: null
              };
            }
          }
        } catch (rpcError) {
          console.error('Error en RPC obtener_distribucion_calificaciones:', rpcError);
          if (!rpcError.message?.includes('API key')) {
            funcionesNoDisponibles.add('obtener_distribucion_calificaciones');
          }
        }
      }

      // Fallback: calcular en frontend
      return this.calcularDistribucionCalificacionesFrontend(filtros);
    } catch (error) {
      console.error('Error obteniendo distribución calificaciones:', error);
      toast.error('Error al cargar distribución de calificaciones');
      return { data: [], error };
    }
  },

  /**
   * Calcular distribución de calificaciones en frontend (fallback)
   */
  async calcularDistribucionCalificacionesFrontend(filtros = {}) {
    return calcularDistribucionCalificacionesFrontend(filtros);
  },

  /**
   * Obtener asistencia por grupo
   */
  async obtenerAsistenciaPorGrupo(filtros = {}) {
    try {
      const { periodo, materiaId } = filtros;

      if (!funcionesNoDisponibles.has('obtener_asistencia_por_grupo')) {
        try {
          // Pasar null explícitamente para parámetros opcionales
          const params = {
            p_periodo: periodo || null,
            p_materia_id: materiaId || null
          };

          const { data, error } = await supabase.rpc('obtener_asistencia_por_grupo', params);

          if (error) {
            console.error('Error RPC obtener_asistencia_por_grupo:', error);
            if (error.code === 'PGRST202' || error.message?.includes('Could not find')) {
              funcionesNoDisponibles.add('obtener_asistencia_por_grupo');
            }
            // Continuar con fallback
          } else if (data) {
            if (data.length === 0) {
              // RPC devolvió array vacío, usar fallback
            } else {
              return {
                data: data.map(item => ({
                  grupo: item.grupo_nombre?.substring(0, 30) || 'Grupo',
                  asistencia: parseFloat(item.promedio_asistencia || 0),
                  estudiantes: parseInt(item.total_estudiantes || 0)
                })),
                error: null
              };
            }
          }
        } catch (rpcError) {
          console.error('Error en RPC obtener_asistencia_por_grupo:', rpcError);
          if (!rpcError.message?.includes('API key')) {
            funcionesNoDisponibles.add('obtener_asistencia_por_grupo');
          }
        }
      }

      // Fallback: calcular en frontend
      return this.calcularAsistenciaPorGrupoFrontend(filtros);
    } catch (error) {
      console.error('Error obteniendo asistencia por grupo:', error);
      toast.error('Error al cargar asistencia por grupo');
      return { data: [], error };
    }
  },

  /**
   * Calcular asistencia por grupo en frontend (fallback)
   */
  async calcularAsistenciaPorGrupoFrontend(filtros = {}) {
    return calcularAsistenciaPorGrupoFrontend(filtros);
  },

  /**
   * Obtener tendencias temporales de calificaciones
   */
  async obtenerTendenciasCalificaciones(filtros = {}) {
    try {
      const { periodo, materiaId, grupoId, agruparPor = 'mes' } = filtros;

      if (!funcionesNoDisponibles.has('obtener_tendencias_calificaciones')) {
        try {
          // Pasar null explícitamente para parámetros opcionales
          const params = {
            p_agrupar_por: agruparPor,
            p_periodo: periodo || null,
            p_materia_id: materiaId || null,
            p_grupo_id: grupoId || null
          };

          const { data, error } = await supabase.rpc('obtener_tendencias_calificaciones', params);

          if (error) {
            console.error('Error RPC obtener_tendencias_calificaciones:', error);
            if (error.code === 'PGRST202' || error.message?.includes('Could not find')) {
              funcionesNoDisponibles.add('obtener_tendencias_calificaciones');
            }
            // Continuar con fallback
          } else if (data) {
            if (data.length === 0) {
              // RPC devolvió array vacío, usar fallback
            } else {
              return {
                data: data.map(item => {
                  // Manejar diferentes formatos de fecha
                  let fechaFormateada = '';
                  try {
                    if (item.periodo) {
                      const fecha = new Date(item.periodo);
                      if (!isNaN(fecha.getTime())) {
                        fechaFormateada = fecha.toLocaleDateString('es-MX', {
                          month: 'short',
                          year: 'numeric',
                          day: agruparPor === 'semana' ? 'numeric' : undefined
                        });
                      } else {
                        fechaFormateada = item.periodo.toString();
                      }
                    }
                  } catch (e) {
                    fechaFormateada = item.periodo?.toString() || '';
                  }

                  return {
                    periodo: fechaFormateada,
                    promedio: parseFloat(item.promedio || 0),
                    estudiantes: parseInt(item.cantidad_estudiantes || 0)
                  };
                }),
                error: null
              };
            }
          }
        } catch (rpcError) {
          console.error('Error en RPC obtener_tendencias_calificaciones:', rpcError);
          if (!rpcError.message?.includes('API key')) {
            funcionesNoDisponibles.add('obtener_tendencias_calificaciones');
          }
        }
      }

      // Fallback: calcular en frontend
      return this.calcularTendenciasCalificacionesFrontend(filtros);
    } catch (error) {
      console.error('Error obteniendo tendencias calificaciones:', error);
      toast.error('Error al cargar tendencias de calificaciones');
      return { data: [], error };
    }
  },

  /**
   * Calcular tendencias de calificaciones en frontend (fallback)
   */
  async calcularTendenciasCalificacionesFrontend(filtros = {}) {
    return calcularTendenciasCalificacionesFrontend(filtros);
  },

  /**
   * Calcular tendencias de asistencia en frontend (fallback)
   */
  async calcularTendenciasAsistenciaFrontend(filtros = {}) {
    return calcularTendenciasAsistenciaFrontend(filtros);
  },

  /**
   * Utilidades para formateo de fechas
   */


  /**
   * Obtener tendencias temporales de asistencia
   */
  async obtenerTendenciasAsistencia(filtros = {}) {
    try {
      const { periodo, materiaId, grupoId, agruparPor = 'mes' } = filtros;

      if (!funcionesNoDisponibles.has('obtener_tendencias_asistencia')) {
        try {
          // Pasar null explícitamente para parámetros opcionales
          const params = {
            p_agrupar_por: agruparPor,
            p_periodo: periodo || null,
            p_materia_id: materiaId || null,
            p_grupo_id: grupoId || null
          };

          const { data, error } = await supabase.rpc('obtener_tendencias_asistencia', params);

          if (error) {
            console.error('Error RPC obtener_tendencias_asistencia:', error);
            if (error.code === 'PGRST202' || error.message?.includes('Could not find')) {
              funcionesNoDisponibles.add('obtener_tendencias_asistencia');
            }
            // Continuar con fallback
          } else if (data) {
            if (data.length === 0) {
              // RPC devolvió array vacío, usar fallback
            } else {
              return {
                data: data.map(item => {
                  // Manejar diferentes formatos de fecha
                  let fechaFormateada = '';
                  try {
                    if (item.periodo) {
                      const fecha = new Date(item.periodo);
                      if (!isNaN(fecha.getTime())) {
                        fechaFormateada = fecha.toLocaleDateString('es-MX', {
                          month: 'short',
                          year: 'numeric',
                          day: agruparPor === 'semana' ? 'numeric' : undefined
                        });
                      } else {
                        fechaFormateada = item.periodo.toString();
                      }
                    }
                  } catch (e) {
                    fechaFormateada = item.periodo?.toString() || '';
                  }

                  return {
                    periodo: fechaFormateada,
                    porcentaje: parseFloat(item.porcentaje_asistencia || 0),
                    sesiones: parseInt(item.total_sesiones || 0)
                  };
                }),
                error: null
              };
            }
          }
        } catch (rpcError) {
          console.error('Error en RPC obtener_tendencias_asistencia:', rpcError);
          if (!rpcError.message?.includes('API key')) {
            funcionesNoDisponibles.add('obtener_tendencias_asistencia');
          }
        }
      }

      // Fallback: calcular en frontend
      return this.calcularTendenciasAsistenciaFrontend(filtros);
    } catch (error) {
      console.error('Error obteniendo tendencias asistencia:', error);
      toast.error('Error al cargar tendencias de asistencia');
      return { data: [], error };
    }
  },

  /**
   * Obtener materias populares
   */
  async obtenerMateriasPopulares(filtros = {}) {
    try {
      const { periodo, limit = 5 } = filtros;

      if (!funcionesNoDisponibles.has('obtener_materias_populares')) {
        try {
          // Pasar null explícitamente para parámetros opcionales
          const params = {
            p_limit: limit,
            p_periodo: periodo || null
          };

          const { data, error } = await supabase.rpc('obtener_materias_populares', params);

          if (error) {
            console.error('Error RPC obtener_materias_populares:', error);
            if (error.code === 'PGRST202' || error.message?.includes('Could not find')) {
              funcionesNoDisponibles.add('obtener_materias_populares');
            }
            // Continuar con fallback
          } else if (data) {
            if (data.length === 0) {
              // RPC devolvió array vacío, usar fallback
            } else {
              return {
                data: data.map(item => ({
                  name: item.materia_nombre?.substring(0, 25) || 'Materia',
                  estudiantes: parseInt(item.total_estudiantes || 0),
                  grupos: parseInt(item.total_grupos || 0)
                })),
                error: null
              };
            }
          }
        } catch (rpcError) {
          console.error('Error en RPC obtener_materias_populares:', rpcError);
          if (!rpcError.message?.includes('API key')) {
            funcionesNoDisponibles.add('obtener_materias_populares');
          }
        }
      }

      // Fallback: calcular en frontend
      return this.calcularMateriasPopularesFrontend(filtros);
    } catch (error) {
      console.error('Error obteniendo materias populares:', error);
      toast.error('Error al cargar materias populares');
      return { data: [], error };
    }
  },

  /**
   * Calcular materias populares en frontend (fallback)
   */
  async calcularMateriasPopularesFrontend(filtros = {}) {
    return calcularMateriasPopularesFrontend(filtros);
  },

  /**
   * Obtener filtros disponibles
   */
  async obtenerFiltrosDisponibles() {
    try {
      // Obtener periodos
      let periodosData = [];
      try {
        const { data, error } = await supabase.rpc('obtener_periodos_disponibles');
        if (!error && data) {
          periodosData = data.map(p => p.periodo);
        }
      } catch (err) {
        console.warn('Error obteniendo periodos:', err);
      }

      // Obtener materias
      let materiasData = [];
      try {
        const { data, error } = await supabase.rpc('obtener_materias_disponibles');
        if (error) {
          console.error('Error RPC obtener_materias_disponibles:', error);
          // Fallback: obtener materias directamente de la tabla
          const { data: materiasFallback, error: fallbackError } = await supabase
            .from('materias')
            .select('id, nombre, codigo')
            .order('nombre');
          if (!fallbackError && materiasFallback) {
            materiasData = materiasFallback.map(m => ({
              id: m.id,
              nombre: m.nombre,
              codigo: m.codigo
            }));
          }
        } else if (data) {
          materiasData = data.map(m => ({
            id: m.materia_id,
            nombre: m.materia_nombre,
            codigo: m.materia_codigo
          }));
        }
      } catch (err) {
        console.warn('Error obteniendo materias:', err);
        // Fallback: obtener materias directamente de la tabla
        try {
          const { data: materiasFallback } = await supabase
            .from('materias')
            .select('id, nombre, codigo')
            .order('nombre');
          if (materiasFallback) {
            materiasData = materiasFallback.map(m => ({
              id: m.id,
              nombre: m.nombre,
              codigo: m.codigo
            }));
          }
        } catch (fallbackErr) {
          console.error('Error en fallback de materias:', fallbackErr);
        }
      }

      // Obtener grupos
      let gruposData = [];
      try {
        // Pasar null explícitamente para los parámetros opcionales
        const { data, error } = await supabase.rpc('obtener_grupos_disponibles', {
          p_periodo: null,
          p_materia_id: null
        });
        if (error) {
          console.error('Error RPC obtener_grupos_disponibles:', error);
          // Fallback: obtener grupos directamente de la tabla
          const { data: gruposFallback, error: fallbackError } = await supabase
            .from('grupos')
            .select(`
              id,
              periodo,
              materia_id,
              materias (nombre)
            `)
            .eq('activo', true)
            .order('periodo', { ascending: false });
          if (!fallbackError && gruposFallback) {
            gruposData = gruposFallback.map(g => {
              const materia = Array.isArray(g.materias) ? g.materias[0] : g.materias;
              return {
                id: g.id,
                nombre: materia?.nombre ? `${materia.nombre} - ${g.periodo}` : `Grupo - ${g.periodo}`,
                materia: materia?.nombre || 'Sin materia',
                periodo: g.periodo
              };
            });
          }
        } else if (data) {
          gruposData = data.map(g => ({
            id: g.grupo_id,
            nombre: g.grupo_nombre,
            materia: g.materia_nombre,
            periodo: g.periodo
          }));
        }
      } catch (err) {
        console.warn('Error obteniendo grupos:', err);
        // Fallback: obtener grupos directamente de la tabla
        try {
          const { data: gruposFallback } = await supabase
            .from('grupos')
            .select(`
              id,
              periodo,
              materia_id,
              materias (nombre)
            `)
            .eq('activo', true)
            .order('periodo', { ascending: false });
          if (gruposFallback) {
            gruposData = gruposFallback.map(g => {
              const materia = Array.isArray(g.materias) ? g.materias[0] : g.materias;
              return {
                id: g.id,
                nombre: materia?.nombre ? `${materia.nombre} - ${g.periodo}` : `Grupo - ${g.periodo}`,
                materia: materia?.nombre || 'Sin materia',
                periodo: g.periodo
              };
            });
          }
        } catch (fallbackErr) {
          console.error('Error en fallback de grupos:', fallbackErr);
        }
      }

      return {
        data: {
          periodos: periodosData,
          materias: materiasData,
          grupos: gruposData
        },
        error: null
      };
    } catch (error) {
      console.error('Error obteniendo filtros:', error);
      toast.error('Error al cargar filtros');
      return { data: { periodos: [], materias: [], grupos: [] }, error };
    }
  }
};


