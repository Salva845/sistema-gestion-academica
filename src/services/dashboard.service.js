// =========================================
// src/services/dashboard.service.js
// Servicio para Dashboard Administrativo
// =========================================
import { supabase } from '../lib/supabase';

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
      return { data: null, error };
    }
  },

  /**
   * Calcular métricas globales en frontend (fallback)
   */
  async calcularMetricasGlobalesFrontend(filtros = {}) {
    try {
      const { periodo, materiaId, grupoId } = filtros;

      // Contar estudiantes (verificar diferentes variaciones del role)
      const { count: estudiantesCount, error: estudiantesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'estudiante');
      
      if (estudiantesError) {
        console.error('Error contando estudiantes:', estudiantesError);
      }

      // Contar docentes
      const { count: docentesCount, error: docentesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'docente');
      
      if (docentesError) {
        console.error('Error contando docentes:', docentesError);
      }
      
      // Debug: Verificar qué roles existen
      const { data: rolesData } = await supabase
        .from('profiles')
        .select('role')
        .limit(100);
      
      if (rolesData) {
        const rolesUnicos = [...new Set(rolesData.map(p => p.role))];
        console.log('Roles encontrados en profiles:', rolesUnicos);
        console.log('Total estudiantes contados:', estudiantesCount);
        console.log('Total docentes contados:', docentesCount);
      }

      // Contar grupos
      let gruposQuery = supabase
        .from('grupos')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);

      if (periodo) gruposQuery = gruposQuery.eq('periodo', periodo);
      if (materiaId) gruposQuery = gruposQuery.eq('materia_id', materiaId);
      if (grupoId) gruposQuery = gruposQuery.eq('id', grupoId);

      const { count: gruposCount } = await gruposQuery;

      // Calcular promedio general (simplificado)
      const promedioGeneral = 0; // Se calcularía con todas las calificaciones
      const asistenciaPromedio = 0; // Se calcularía con todas las asistencias

      return {
        data: {
          totalEstudiantes: estudiantesCount || 0,
          totalDocentes: docentesCount || 0,
          totalGrupos: gruposCount || 0,
          promedioGeneral,
          asistenciaPromedio
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
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
            console.error('❌ Error RPC obtener_distribucion_calificaciones:', error);
            if (error.code === 'PGRST202' || error.message?.includes('Could not find')) {
              funcionesNoDisponibles.add('obtener_distribucion_calificaciones');
            }
            // Continuar con fallback
          } else if (data) {
            console.log(`✅ RPC obtener_distribucion_calificaciones devolvió ${data.length} rangos`);
            if (data.length === 0) {
              console.log('⚠️ RPC devolvió array vacío, usando fallback');
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
      return { data: [], error };
    }
  },

  /**
   * Calcular distribución de calificaciones en frontend (fallback)
   */
  async calcularDistribucionCalificacionesFrontend(filtros = {}) {
    try {
      const { periodo, materiaId, grupoId } = filtros;
      console.log('🔄 Calculando distribución de calificaciones (frontend) con filtros:', filtros);

      // Verificar primero si hay inscripciones en la BD (sin filtros de grupo)
      const { data: todasInscripcionesBD, count: totalInscripciones, error: countError } = await supabase
        .from('inscripciones')
        .select('id, grupo_id, estado', { count: 'exact' })
        .eq('estado', 'activo')
        .limit(20);
      
      console.log(`🔍 [Distribución] Total inscripciones activas en BD: ${totalInscripciones || 0}`);
      if (totalInscripciones > 0) {
        console.log(`🔍 [Distribución] Primeras inscripciones encontradas:`, todasInscripcionesBD);
        // Verificar en qué grupos están
        const gruposConInscripciones = [...new Set(todasInscripcionesBD?.map(i => i.grupo_id) || [])];
        console.log(`🔍 [Distribución] Grupos con inscripciones:`, gruposConInscripciones);
      }

      // Si no hay filtros específicos, buscar directamente en inscripciones
      // Esto evita problemas con RLS o filtros demasiado restrictivos
      if (!periodo && !materiaId && !grupoId) {
        console.log('🔍 [Distribución] Sin filtros específicos, buscando todas las inscripciones activas');
        const { data: todasInscripciones, error: todasError } = await supabase
          .from('inscripciones')
          .select('id, grupo_id, estado')
          .eq('estado', 'activo');

        if (todasError) {
          console.error('❌ Error obteniendo todas las inscripciones:', todasError);
          return { data: [], error: todasError };
        }

        if (!todasInscripciones || todasInscripciones.length === 0) {
          console.log('⚠️ [Distribución] No se encontraron inscripciones activas (sin filtros)');
          return { data: [], error: null };
        }

        console.log(`✅ [Distribución] Encontradas ${todasInscripciones.length} inscripciones (sin filtros)`);
        const inscripcionesIds = todasInscripciones.map(i => i.id);
        
        // Obtener calificaciones para estas inscripciones
        const { data: calificaciones, error: calError } = await supabase
          .from('calificaciones')
          .select('inscripcion_id, valor, valor_maximo, peso')
          .in('inscripcion_id', inscripcionesIds);

        if (calError) {
          console.error('❌ Error obteniendo calificaciones:', calError);
          return { data: [], error: calError };
        }

        if (!calificaciones || calificaciones.length === 0) {
          console.log('⚠️ No se encontraron calificaciones');
          return { data: [], error: null };
        }

        console.log(`✅ Encontradas ${calificaciones.length} calificaciones`);

        // Calcular promedios por inscripción
        const promediosPorInscripcion = {};
        inscripcionesIds.forEach(inscId => {
          const cals = calificaciones.filter(c => c.inscripcion_id === inscId);
          if (cals.length > 0) {
            let sumaPonderada = 0;
            let totalPeso = 0;
            cals.forEach(cal => {
              const valorNormalizado = (Number(cal.valor) / Number(cal.valor_maximo)) * 10;
              const peso = Number(cal.peso) || 0;
              sumaPonderada += valorNormalizado * peso;
              totalPeso += peso;
            });
            if (totalPeso > 0) {
              promediosPorInscripcion[inscId] = sumaPonderada / totalPeso;
            }
          }
        });

        // Agrupar por rangos
        const rangos = {
          '9.5-10': 0,
          '9.0-9.4': 0,
          '8.5-8.9': 0,
          '8.0-8.4': 0,
          '7.5-7.9': 0,
          '7.0-7.4': 0,
          '6.5-6.9': 0,
          '6.0-6.4': 0,
          '5.0-5.9': 0,
          '0-4.9': 0
        };

        Object.values(promediosPorInscripcion).forEach(promedio => {
          if (promedio >= 9.5) rangos['9.5-10']++;
          else if (promedio >= 9.0) rangos['9.0-9.4']++;
          else if (promedio >= 8.5) rangos['8.5-8.9']++;
          else if (promedio >= 8.0) rangos['8.0-8.4']++;
          else if (promedio >= 7.5) rangos['7.5-7.9']++;
          else if (promedio >= 7.0) rangos['7.0-7.4']++;
          else if (promedio >= 6.5) rangos['6.5-6.9']++;
          else if (promedio >= 6.0) rangos['6.0-6.4']++;
          else if (promedio >= 5.0) rangos['5.0-5.9']++;
          else rangos['0-4.9']++;
        });

        const total = Object.values(rangos).reduce((sum, val) => sum + val, 0);

        // Formatear para gráficas
        const ordenRangos = ['9.5-10', '9.0-9.4', '8.5-8.9', '8.0-8.4', '7.5-7.9', '7.0-7.4', '6.5-6.9', '6.0-6.4', '5.0-5.9', '0-4.9'];
        const datosFormateados = ordenRangos.map(rango => ({
          name: rango,
          value: rangos[rango],
          porcentaje: total > 0 ? parseFloat(((rangos[rango] / total) * 100).toFixed(2)) : 0
        }));

        console.log(`✅ Distribución calculada: ${total} estudiantes en ${datosFormateados.filter(d => d.value > 0).length} rangos`);
        return {
          data: datosFormateados,
          error: null
        };
      }

      // Obtener todas las inscripciones activas con filtros
      // Primero obtener grupos con filtros
      let gruposQuery = supabase
        .from('grupos')
        .select('id, periodo, materia_id')
        .eq('activo', true);

      if (periodo) gruposQuery = gruposQuery.eq('periodo', periodo);
      if (materiaId) gruposQuery = gruposQuery.eq('materia_id', materiaId);
      if (grupoId) gruposQuery = gruposQuery.eq('id', grupoId);

      const { data: grupos, error: gruposError } = await gruposQuery;
      
      if (gruposError) {
        console.error('❌ Error obteniendo grupos:', gruposError);
        return { data: [], error: gruposError };
      }

      if (!grupos || grupos.length === 0) {
        console.log('⚠️ No se encontraron grupos con los filtros aplicados');
        return { data: [], error: null };
      }

      console.log(`✅ [Distribución] Encontrados ${grupos.length} grupos activos con los filtros`);
      const gruposIds = grupos.map(g => g.id);
      console.log(`🔍 [Distribución] Buscando inscripciones en ${gruposIds.length} grupos:`, gruposIds);

      // Obtener inscripciones de estos grupos
      const { data: inscripciones, error: inscError } = await supabase
        .from('inscripciones')
        .select('id, grupo_id, estado')
        .eq('estado', 'activo')
        .in('grupo_id', gruposIds);

      if (inscError) {
        console.error('❌ Error obteniendo inscripciones:', inscError);
        // Intentar sin filtro de estado para ver qué hay
        const { data: todasInscripciones } = await supabase
          .from('inscripciones')
          .select('id, grupo_id, estado')
          .in('grupo_id', gruposIds)
          .limit(10);
        console.log('🔍 [Distribución] Todas las inscripciones (sin filtro estado):', todasInscripciones);
        return { data: [], error: inscError };
      }

      if (!inscripciones || inscripciones.length === 0) {
        console.log('⚠️ [Distribución] No se encontraron inscripciones activas');
        // Intentar sin filtro de estado para ver qué hay
        const { data: todasInscripciones } = await supabase
          .from('inscripciones')
          .select('id, grupo_id, estado')
          .in('grupo_id', gruposIds)
          .limit(10);
        console.log('🔍 [Distribución] Todas las inscripciones (sin filtro estado):', todasInscripciones);
        
        // Verificar si hay inscripciones en otros grupos
        const { data: todasInscripcionesGlobales, count } = await supabase
          .from('inscripciones')
          .select('id, grupo_id, estado', { count: 'exact' })
          .eq('estado', 'activo')
          .limit(10);
        console.log(`🔍 [Distribución] Total inscripciones activas en BD: ${count || 0}`, todasInscripcionesGlobales);
        
        return { data: [], error: null };
      }

      console.log(`✅ [Distribución] Encontradas ${inscripciones.length} inscripciones`);

      // Obtener calificaciones para cada inscripción
      const inscripcionesIds = inscripciones.map(i => i.id);
      const { data: calificaciones, error: calError } = await supabase
        .from('calificaciones')
        .select('inscripcion_id, valor, valor_maximo, peso')
        .in('inscripcion_id', inscripcionesIds);

      if (calError) {
        console.error('❌ Error obteniendo calificaciones:', calError);
        return { data: [], error: calError };
      }

      if (!calificaciones || calificaciones.length === 0) {
        console.log('⚠️ No se encontraron calificaciones');
        return { data: [], error: null };
      }

      console.log(`✅ Encontradas ${calificaciones.length} calificaciones`);

      // Calcular promedios por inscripción
      const promediosPorInscripcion = {};
      inscripcionesIds.forEach(inscId => {
        const cals = calificaciones.filter(c => c.inscripcion_id === inscId);
        if (cals.length > 0) {
          let sumaPonderada = 0;
          let totalPeso = 0;
          cals.forEach(cal => {
            const valorNormalizado = (Number(cal.valor) / Number(cal.valor_maximo)) * 10;
            const peso = Number(cal.peso) || 0;
            sumaPonderada += valorNormalizado * peso;
            totalPeso += peso;
          });
          if (totalPeso > 0) {
            promediosPorInscripcion[inscId] = sumaPonderada / totalPeso;
          }
        }
      });

      // Agrupar por rangos
      const rangos = {
        '9.5-10': 0,
        '9.0-9.4': 0,
        '8.5-8.9': 0,
        '8.0-8.4': 0,
        '7.5-7.9': 0,
        '7.0-7.4': 0,
        '6.5-6.9': 0,
        '6.0-6.4': 0,
        '5.0-5.9': 0,
        '0-4.9': 0
      };

      Object.values(promediosPorInscripcion).forEach(promedio => {
        if (promedio >= 9.5) rangos['9.5-10']++;
        else if (promedio >= 9.0) rangos['9.0-9.4']++;
        else if (promedio >= 8.5) rangos['8.5-8.9']++;
        else if (promedio >= 8.0) rangos['8.0-8.4']++;
        else if (promedio >= 7.5) rangos['7.5-7.9']++;
        else if (promedio >= 7.0) rangos['7.0-7.4']++;
        else if (promedio >= 6.5) rangos['6.5-6.9']++;
        else if (promedio >= 6.0) rangos['6.0-6.4']++;
        else if (promedio >= 5.0) rangos['5.0-5.9']++;
        else rangos['0-4.9']++;
      });

      const total = Object.values(rangos).reduce((sum, val) => sum + val, 0);

      // Formatear para gráficas
      const ordenRangos = ['9.5-10', '9.0-9.4', '8.5-8.9', '8.0-8.4', '7.5-7.9', '7.0-7.4', '6.5-6.9', '6.0-6.4', '5.0-5.9', '0-4.9'];
      const datosFormateados = ordenRangos.map(rango => ({
        name: rango,
        value: rangos[rango],
        porcentaje: total > 0 ? parseFloat(((rangos[rango] / total) * 100).toFixed(2)) : 0
      }));

      console.log(`✅ Distribución calculada: ${total} estudiantes en ${datosFormateados.filter(d => d.value > 0).length} rangos`);
      return {
        data: datosFormateados,
        error: null
      };
    } catch (error) {
      console.error('❌ Error calculando distribución frontend:', error);
      return { data: [], error };
    }
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
            console.error('❌ Error RPC obtener_asistencia_por_grupo:', error);
            if (error.code === 'PGRST202' || error.message?.includes('Could not find')) {
              funcionesNoDisponibles.add('obtener_asistencia_por_grupo');
            }
            // Continuar con fallback
          } else if (data) {
            console.log(`✅ RPC obtener_asistencia_por_grupo devolvió ${data.length} grupos`);
            if (data.length === 0) {
              console.log('⚠️ RPC devolvió array vacío, usando fallback');
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
      return { data: [], error };
    }
  },

  /**
   * Calcular asistencia por grupo en frontend (fallback)
   */
  async calcularAsistenciaPorGrupoFrontend(filtros = {}) {
    try {
      const { periodo, materiaId } = filtros;
      console.log('🔄 Calculando asistencia por grupo (frontend) con filtros:', filtros);

      // Obtener grupos con filtros
      let gruposQuery = supabase
        .from('grupos')
        .select(`
          id,
          periodo,
          materias!inner(nombre)
        `)
        .eq('activo', true);

      if (periodo) gruposQuery = gruposQuery.eq('periodo', periodo);
      if (materiaId) gruposQuery = gruposQuery.eq('materia_id', materiaId);

      const { data: grupos, error: gruposError } = await gruposQuery;

      if (gruposError) {
        console.error('❌ Error obteniendo grupos:', gruposError);
        return { data: [], error: gruposError };
      }

      if (!grupos || grupos.length === 0) {
        console.log('⚠️ No se encontraron grupos activos');
        return { data: [], error: null };
      }

      console.log(`✅ Encontrados ${grupos.length} grupos`);

      // Calcular asistencia para cada grupo
      const asistenciaPorGrupo = await Promise.all(
        grupos.map(async (grupo) => {
          const materia = Array.isArray(grupo.materias) ? grupo.materias[0] : grupo.materias;

          // Obtener inscripciones activas
          const { data: inscripciones } = await supabase
            .from('inscripciones')
            .select('estudiante_id')
            .eq('grupo_id', grupo.id)
            .eq('estado', 'activo');

          // Obtener sesiones
          const { data: sesiones } = await supabase
            .from('sesiones_clase')
            .select('id')
            .eq('grupo_id', grupo.id);

          if (!sesiones || sesiones.length === 0 || !inscripciones || inscripciones.length === 0) {
            return {
              grupo: `${materia?.nombre || 'Grupo'} - ${grupo.periodo}`,
              asistencia: 0,
              estudiantes: inscripciones?.length || 0
            };
          }

          // Obtener asistencias
          const sesionesIds = sesiones.map(s => s.id);
          const estudiantesIds = inscripciones.map(i => i.estudiante_id);

          const { data: asistencias } = await supabase
            .from('asistencias')
            .select('id')
            .in('sesion_id', sesionesIds)
            .in('estudiante_id', estudiantesIds);

          const totalPosibles = sesiones.length * inscripciones.length;
          const porcentaje = totalPosibles > 0 
            ? parseFloat(((asistencias?.length || 0) / totalPosibles * 100).toFixed(2))
            : 0;

          return {
            grupo: `${materia?.nombre || 'Grupo'} - ${grupo.periodo}`,
            asistencia: porcentaje,
            estudiantes: inscripciones.length
          };
        })
      );

      console.log(`✅ Asistencia por grupo calculada: ${asistenciaPorGrupo.length} grupos`);
      return { data: asistenciaPorGrupo, error: null };
    } catch (error) {
      console.error('❌ Error calculando asistencia por grupo frontend:', error);
      return { data: [], error };
    }
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
            console.error('❌ Error RPC obtener_tendencias_calificaciones:', error);
            if (error.code === 'PGRST202' || error.message?.includes('Could not find')) {
              funcionesNoDisponibles.add('obtener_tendencias_calificaciones');
            }
            // Continuar con fallback
          } else if (data) {
            console.log(`✅ RPC obtener_tendencias_calificaciones devolvió ${data.length} periodos`);
            if (data.length === 0) {
              console.log('⚠️ RPC devolvió array vacío, usando fallback');
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
      return { data: [], error };
    }
  },

  /**
   * Calcular tendencias de calificaciones en frontend (fallback)
   */
  async calcularTendenciasCalificacionesFrontend(filtros = {}) {
    try {
      const { periodo, materiaId, grupoId, agruparPor = 'mes' } = filtros;
      console.log('🔄 Calculando tendencias de calificaciones (frontend) con filtros:', filtros);

      // Si no hay filtros específicos, buscar directamente en inscripciones
      if (!periodo && !materiaId && !grupoId) {
        console.log('🔍 [Tendencias] Sin filtros específicos, buscando todas las inscripciones activas');
        const { data: todasInscripciones, error: todasError } = await supabase
          .from('inscripciones')
          .select('id, grupo_id, estado')
          .eq('estado', 'activo');

        if (todasError) {
          console.error('❌ Error obteniendo todas las inscripciones:', todasError);
          return { data: [], error: todasError };
        }

        if (!todasInscripciones || todasInscripciones.length === 0) {
          console.log('⚠️ [Tendencias] No se encontraron inscripciones activas (sin filtros)');
          return { data: [], error: null };
        }

        console.log(`✅ [Tendencias] Encontradas ${todasInscripciones.length} inscripciones (sin filtros)`);
        const inscripcionesIds = todasInscripciones.map(i => i.id);
        
        // Obtener calificaciones
        const { data: calificaciones, error: calError } = await supabase
          .from('calificaciones')
          .select('inscripcion_id, fecha, valor, valor_maximo, peso')
          .in('inscripcion_id', inscripcionesIds)
          .order('fecha', { ascending: true });

        if (calError) {
          console.error('❌ Error obteniendo calificaciones:', calError);
          return { data: [], error: calError };
        }

        if (!calificaciones || calificaciones.length === 0) {
          console.log('⚠️ No se encontraron calificaciones');
          return { data: [], error: null };
        }

        console.log(`✅ Encontradas ${calificaciones.length} calificaciones`);

        // Agrupar por periodo y calcular promedios acumulados
        const periodosMap = {};
        const inscripcionesProcesadas = new Set();

        // Procesar calificaciones ordenadas por fecha
        calificaciones.forEach(cal => {
          const fecha = new Date(cal.fecha);
          let periodoKey = '';
          
          if (agruparPor === 'semana') {
            const semana = this.getWeekNumber(fecha);
            periodoKey = `${fecha.getFullYear()}-W${semana}`;
          } else {
            periodoKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
          }

          if (!periodosMap[periodoKey]) {
            periodosMap[periodoKey] = {
              fecha: new Date(fecha.getFullYear(), fecha.getMonth(), 1),
              inscripciones: []
            };
          }

          // Calcular promedio acumulado hasta esta fecha para esta inscripción
          const inscripcionKey = `${cal.inscripcion_id}-${periodoKey}`;
          if (!inscripcionesProcesadas.has(inscripcionKey)) {
            inscripcionesProcesadas.add(inscripcionKey);
            
            const calsHastaAhora = calificaciones.filter(c => 
              c.inscripcion_id === cal.inscripcion_id && 
              new Date(c.fecha) <= fecha
            );

            let sumaPonderada = 0;
            let totalPeso = 0;
            calsHastaAhora.forEach(c => {
              const valorNormalizado = (Number(c.valor) / Number(c.valor_maximo)) * 10;
              const peso = Number(c.peso) || 0;
              sumaPonderada += valorNormalizado * peso;
              totalPeso += peso;
            });

            if (totalPeso > 0) {
              const promedio = sumaPonderada / totalPeso;
              // Verificar que no esté ya agregado
              const yaExiste = periodosMap[periodoKey].inscripciones.some(
                p => p.inscripcionId === cal.inscripcion_id
              );
              if (!yaExiste) {
                periodosMap[periodoKey].inscripciones.push({
                  inscripcionId: cal.inscripcion_id,
                  promedio
                });
              }
            }
          }
        });

        // Calcular promedio por periodo
        const tendencias = Object.keys(periodosMap)
          .sort()
          .map(key => {
            const periodo = periodosMap[key];
            const promedios = periodo.inscripciones.map(p => p.promedio);
            const promedio = promedios.length > 0
              ? promedios.reduce((sum, p) => sum + p, 0) / promedios.length
              : 0;

            return {
              periodo: this.formatearPeriodo(periodo.fecha, agruparPor),
              promedio: parseFloat(promedio.toFixed(2)),
              estudiantes: promedios.length
            };
          });

        console.log(`✅ Tendencias de calificaciones calculadas: ${tendencias.length} periodos`);
        return { data: tendencias, error: null };
      }

      // Primero obtener grupos con filtros
      let gruposQuery = supabase
        .from('grupos')
        .select('id, periodo, materia_id')
        .eq('activo', true);

      if (periodo) gruposQuery = gruposQuery.eq('periodo', periodo);
      if (materiaId) gruposQuery = gruposQuery.eq('materia_id', materiaId);
      if (grupoId) gruposQuery = gruposQuery.eq('id', grupoId);

      const { data: grupos, error: gruposError } = await gruposQuery;
      
      if (gruposError) {
        console.error('❌ Error obteniendo grupos:', gruposError);
        return { data: [], error: gruposError };
      }

      if (!grupos || grupos.length === 0) {
        console.log('⚠️ No se encontraron grupos con los filtros aplicados');
        return { data: [], error: null };
      }

      const gruposIds = grupos.map(g => g.id);
      console.log(`🔍 [Tendencias] Buscando inscripciones en ${gruposIds.length} grupos:`, gruposIds);

      // Obtener inscripciones de estos grupos
      const { data: inscripciones, error: inscError } = await supabase
        .from('inscripciones')
        .select('id, grupo_id, estado')
        .eq('estado', 'activo')
        .in('grupo_id', gruposIds);

      if (inscError) {
        console.error('❌ [Tendencias] Error obteniendo inscripciones:', inscError);
        // Intentar sin filtro de estado para ver qué hay
        const { data: todasInscripciones } = await supabase
          .from('inscripciones')
          .select('id, grupo_id, estado')
          .in('grupo_id', gruposIds)
          .limit(10);
        console.log('🔍 [Tendencias] Todas las inscripciones (sin filtro estado):', todasInscripciones);
        return { data: [], error: inscError };
      }

      if (!inscripciones || inscripciones.length === 0) {
        console.log('⚠️ [Tendencias] No se encontraron inscripciones activas');
        // Intentar sin filtro de estado para ver qué hay
        const { data: todasInscripciones } = await supabase
          .from('inscripciones')
          .select('id, grupo_id, estado')
          .in('grupo_id', gruposIds)
          .limit(10);
        console.log('🔍 [Tendencias] Todas las inscripciones (sin filtro estado):', todasInscripciones);
        
        // Verificar si hay inscripciones en otros grupos
        const { data: todasInscripcionesGlobales, count } = await supabase
          .from('inscripciones')
          .select('id, grupo_id, estado', { count: 'exact' })
          .eq('estado', 'activo')
          .limit(10);
        console.log(`🔍 [Tendencias] Total inscripciones activas en BD: ${count || 0}`, todasInscripcionesGlobales);
        
        return { data: [], error: null };
      }

      console.log(`✅ [Tendencias] Encontradas ${inscripciones.length} inscripciones`);

      // Obtener calificaciones
      const inscripcionesIds = inscripciones.map(i => i.id);
      const { data: calificaciones, error: calError } = await supabase
        .from('calificaciones')
        .select('inscripcion_id, fecha, valor, valor_maximo, peso')
        .in('inscripcion_id', inscripcionesIds)
        .order('fecha', { ascending: true });

      if (calError) {
        console.error('❌ Error obteniendo calificaciones:', calError);
        return { data: [], error: calError };
      }

      if (!calificaciones || calificaciones.length === 0) {
        console.log('⚠️ No se encontraron calificaciones');
        return { data: [], error: null };
      }

      console.log(`✅ Encontradas ${calificaciones.length} calificaciones`);

      // Agrupar por periodo y calcular promedios acumulados
      const periodosMap = {};
      const inscripcionesProcesadas = new Set();

      // Procesar calificaciones ordenadas por fecha
      calificaciones.forEach(cal => {
        const fecha = new Date(cal.fecha);
        let periodoKey = '';
        
        if (agruparPor === 'semana') {
          const semana = this.getWeekNumber(fecha);
          periodoKey = `${fecha.getFullYear()}-W${semana}`;
        } else {
          periodoKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!periodosMap[periodoKey]) {
          periodosMap[periodoKey] = {
            fecha: new Date(fecha.getFullYear(), fecha.getMonth(), 1),
            inscripciones: []
          };
        }

        // Calcular promedio acumulado hasta esta fecha para esta inscripción
        const inscripcionKey = `${cal.inscripcion_id}-${periodoKey}`;
        if (!inscripcionesProcesadas.has(inscripcionKey)) {
          inscripcionesProcesadas.add(inscripcionKey);
          
          const calsHastaAhora = calificaciones.filter(c => 
            c.inscripcion_id === cal.inscripcion_id && 
            new Date(c.fecha) <= fecha
          );

          let sumaPonderada = 0;
          let totalPeso = 0;
          calsHastaAhora.forEach(c => {
            const valorNormalizado = (Number(c.valor) / Number(c.valor_maximo)) * 10;
            const peso = Number(c.peso) || 0;
            sumaPonderada += valorNormalizado * peso;
            totalPeso += peso;
          });

          if (totalPeso > 0) {
            const promedio = sumaPonderada / totalPeso;
            // Verificar que no esté ya agregado
            const yaExiste = periodosMap[periodoKey].inscripciones.some(
              p => p.inscripcionId === cal.inscripcion_id
            );
            if (!yaExiste) {
              periodosMap[periodoKey].inscripciones.push({
                inscripcionId: cal.inscripcion_id,
                promedio
              });
            }
          }
        }
      });

      // Calcular promedio por periodo
      const tendencias = Object.keys(periodosMap)
        .sort()
        .map(key => {
          const periodo = periodosMap[key];
          const promedios = periodo.inscripciones.map(p => p.promedio);
          const promedio = promedios.length > 0
            ? promedios.reduce((sum, p) => sum + p, 0) / promedios.length
            : 0;

          return {
            periodo: this.formatearPeriodo(periodo.fecha, agruparPor),
            promedio: parseFloat(promedio.toFixed(2)),
            estudiantes: promedios.length
          };
        });

      console.log(`✅ Tendencias de calificaciones calculadas: ${tendencias.length} periodos`);
      return { data: tendencias, error: null };
    } catch (error) {
      console.error('❌ Error calculando tendencias calificaciones frontend:', error);
      return { data: [], error };
    }
  },

  /**
   * Calcular tendencias de asistencia en frontend (fallback)
   */
  async calcularTendenciasAsistenciaFrontend(filtros = {}) {
    try {
      const { periodo, materiaId, grupoId, agruparPor = 'mes' } = filtros;

      // Obtener grupos con filtros
      let gruposQuery = supabase
        .from('grupos')
        .select('id, periodo, materia_id')
        .eq('activo', true);

      if (periodo) gruposQuery = gruposQuery.eq('periodo', periodo);
      if (materiaId) gruposQuery = gruposQuery.eq('materia_id', materiaId);
      if (grupoId) gruposQuery = gruposQuery.eq('id', grupoId);

      const { data: grupos, error: gruposError } = await gruposQuery;

      if (gruposError || !grupos || grupos.length === 0) {
        return { data: [], error: null };
      }

      const gruposIds = grupos.map(g => g.id);

      // Obtener sesiones
      const { data: sesiones, error: sesionesError } = await supabase
        .from('sesiones_clase')
        .select('id, fecha, grupo_id')
        .in('grupo_id', gruposIds)
        .order('fecha', { ascending: true });

      if (sesionesError || !sesiones || sesiones.length === 0) {
        return { data: [], error: null };
      }

      // Agrupar sesiones por periodo
      const periodosMap = {};

      sesiones.forEach(sesion => {
        const fecha = new Date(sesion.fecha);
        let periodoKey = '';
        
        if (agruparPor === 'semana') {
          const semana = this.getWeekNumber(fecha);
          periodoKey = `${fecha.getFullYear()}-W${semana}`;
        } else {
          periodoKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!periodosMap[periodoKey]) {
          periodosMap[periodoKey] = {
            fecha: new Date(fecha.getFullYear(), fecha.getMonth(), 1),
            sesiones: [],
            grupos: new Set()
          };
        }

        periodosMap[periodoKey].sesiones.push(sesion.id);
        periodosMap[periodoKey].grupos.add(sesion.grupo_id);
      });

      // Calcular asistencia por periodo
      const tendencias = await Promise.all(
        Object.keys(periodosMap)
          .sort()
          .map(async (key) => {
            const periodo = periodosMap[key];
            const gruposIds = Array.from(periodo.grupos);

            // Obtener inscripciones activas de estos grupos
            const { data: inscripciones } = await supabase
              .from('inscripciones')
              .select('estudiante_id')
              .in('grupo_id', gruposIds)
              .eq('estado', 'activo');

            if (!inscripciones || inscripciones.length === 0) {
              return {
                periodo: this.formatearPeriodo(periodo.fecha, agruparPor),
                porcentaje: 0,
                sesiones: periodo.sesiones.length
              };
            }

            // Obtener asistencias
            const estudiantesIds = inscripciones.map(i => i.estudiante_id);
            const { data: asistencias } = await supabase
              .from('asistencias')
              .select('id')
              .in('sesion_id', periodo.sesiones)
              .in('estudiante_id', estudiantesIds);

            const totalPosibles = periodo.sesiones.length * inscripciones.length;
            const porcentaje = totalPosibles > 0
              ? parseFloat(((asistencias?.length || 0) / totalPosibles * 100).toFixed(2))
              : 0;

            return {
              periodo: this.formatearPeriodo(periodo.fecha, agruparPor),
              porcentaje,
              sesiones: periodo.sesiones.length
            };
          })
      );

      console.log(`✅ Tendencias de asistencia calculadas: ${tendencias.length} periodos`);
      return { data: tendencias, error: null };
    } catch (error) {
      console.error('❌ Error calculando tendencias asistencia frontend:', error);
      return { data: [], error };
    }
  },

  /**
   * Utilidades para formateo de fechas
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  },

  formatearPeriodo(fecha, agruparPor) {
    try {
      if (agruparPor === 'semana') {
        return fecha.toLocaleDateString('es-MX', { month: 'short', year: 'numeric', day: 'numeric' });
      } else {
        return fecha.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
      }
    } catch (e) {
      return fecha.toString();
    }
  },

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
            console.error('❌ Error RPC obtener_tendencias_asistencia:', error);
            if (error.code === 'PGRST202' || error.message?.includes('Could not find')) {
              funcionesNoDisponibles.add('obtener_tendencias_asistencia');
            }
            // Continuar con fallback
          } else if (data) {
            console.log(`✅ RPC obtener_tendencias_asistencia devolvió ${data.length} periodos`);
            if (data.length === 0) {
              console.log('⚠️ RPC devolvió array vacío, usando fallback');
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
            console.error('❌ Error RPC obtener_materias_populares:', error);
            if (error.code === 'PGRST202' || error.message?.includes('Could not find')) {
              funcionesNoDisponibles.add('obtener_materias_populares');
            }
            // Continuar con fallback
          } else if (data) {
            console.log(`✅ RPC obtener_materias_populares devolvió ${data.length} materias`);
            if (data.length === 0) {
              console.log('⚠️ RPC devolvió array vacío, usando fallback');
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
      return { data: [], error };
    }
  },

  /**
   * Calcular materias populares en frontend (fallback)
   */
  async calcularMateriasPopularesFrontend(filtros = {}) {
    try {
      const { periodo, limit = 5 } = filtros;
      console.log('🔄 Calculando materias populares (frontend) con filtros:', filtros);

      // Obtener grupos con filtros
      let gruposQuery = supabase
        .from('grupos')
        .select(`
          id,
          materia_id,
          materias!inner(id, nombre, codigo)
        `)
        .eq('activo', true);

      if (periodo) gruposQuery = gruposQuery.eq('periodo', periodo);

      const { data: grupos, error: gruposError } = await gruposQuery;

      if (gruposError) {
        console.error('❌ Error obteniendo grupos:', gruposError);
        return { data: [], error: gruposError };
      }

      if (!grupos || grupos.length === 0) {
        console.log('⚠️ No se encontraron grupos activos');
        return { data: [], error: null };
      }

      console.log(`✅ Encontrados ${grupos.length} grupos`);

      // Agrupar por materia
      const materiasMap = {};

      grupos.forEach(grupo => {
        const materia = Array.isArray(grupo.materias) ? grupo.materias[0] : grupo.materias;
        if (!materia) return;

        if (!materiasMap[materia.id]) {
          materiasMap[materia.id] = {
            id: materia.id,
            nombre: materia.nombre,
            codigo: materia.codigo,
            grupos: new Set(),
            estudiantes: new Set()
          };
        }

        materiasMap[materia.id].grupos.add(grupo.id);
      });

      // Contar estudiantes por materia
      await Promise.all(
        Object.values(materiasMap).map(async (materia) => {
          const gruposIds = Array.from(materia.grupos);
          const { data: inscripciones } = await supabase
            .from('inscripciones')
            .select('estudiante_id')
            .in('grupo_id', gruposIds)
            .eq('estado', 'activo');

          if (inscripciones) {
            inscripciones.forEach(insc => {
              materia.estudiantes.add(insc.estudiante_id);
            });
          }
        })
      );

      // Formatear y ordenar
      const materiasPopulares = Object.values(materiasMap)
        .map(m => ({
          name: m.nombre?.substring(0, 25) || 'Materia',
          estudiantes: m.estudiantes.size,
          grupos: m.grupos.size
        }))
        .sort((a, b) => b.estudiantes - a.estudiantes)
        .slice(0, limit);

      console.log(`✅ Materias populares calculadas: ${materiasPopulares.length} materias`);
      return { data: materiasPopulares, error: null };
    } catch (error) {
      console.error('❌ Error calculando materias populares frontend:', error);
      return { data: [], error };
    }
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
      return { data: { periodos: [], materias: [], grupos: [] }, error };
    }
  }
};


