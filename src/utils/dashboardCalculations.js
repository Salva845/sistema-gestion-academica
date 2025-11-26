import { supabase } from '../lib/supabase';

/**
 * Calcular métricas globales en frontend (fallback)
 */
export const calcularMetricasGlobalesFrontend = async (filtros = {}) => {
    try {
        const { periodo, materiaId, grupoId } = filtros;

        // Contar estudiantes
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
};

/**
 * Calcular distribución de calificaciones en frontend (fallback)
 */
export const calcularDistribucionCalificacionesFrontend = async (filtros = {}) => {
    try {
        const { periodo, materiaId, grupoId } = filtros;
        // Si no hay filtros específicos, buscar directamente en inscripciones
        if (!periodo && !materiaId && !grupoId) {
            const { data: todasInscripciones, error: todasError } = await supabase
                .from('inscripciones')
                .select('id, grupo_id, estado')
                .eq('estado', 'activo')
                .limit(2000);

            if (todasError) {
                console.error('Error obteniendo todas las inscripciones:', todasError);
                return { data: [], error: todasError };
            }

            if (!todasInscripciones || todasInscripciones.length === 0) {
                return { data: [], error: null };
            }
            const inscripcionesIds = todasInscripciones.map(i => i.id);

            // Obtener calificaciones para estas inscripciones
            const { data: calificaciones, error: calError } = await supabase
                .from('calificaciones')
                .select('inscripcion_id, valor, valor_maximo, peso')
                .in('inscripcion_id', inscripcionesIds);

            if (calError) {
                console.error('Error obteniendo calificaciones:', calError);
                return { data: [], error: calError };
            }

            if (!calificaciones || calificaciones.length === 0) {
                return { data: [], error: null };
            }

            return procesarDistribucionCalificaciones(inscripcionesIds, calificaciones);
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
            console.error('Error obteniendo grupos:', gruposError);
            return { data: [], error: gruposError };
        }

        if (!grupos || grupos.length === 0) {
            return { data: [], error: null };
        }

        const gruposIds = grupos.map(g => g.id);

        // Obtener inscripciones de estos grupos
        const { data: inscripciones, error: inscError } = await supabase
            .from('inscripciones')
            .select('id, grupo_id, estado')
            .eq('estado', 'activo')
            .in('grupo_id', gruposIds)
            .limit(2000);

        if (inscError) {
            console.error('Error obteniendo inscripciones:', inscError);
            return { data: [], error: inscError };
        }

        if (!inscripciones || inscripciones.length === 0) {
            return { data: [], error: null };
        }

        // Obtener calificaciones para cada inscripción
        const inscripcionesIds = inscripciones.map(i => i.id);
        const { data: calificaciones, error: calError } = await supabase
            .from('calificaciones')
            .select('inscripcion_id, valor, valor_maximo, peso')
            .in('inscripcion_id', inscripcionesIds);

        if (calError) {
            console.error('Error obteniendo calificaciones:', calError);
            return { data: [], error: calError };
        }

        if (!calificaciones || calificaciones.length === 0) {
            return { data: [], error: null };
        }

        return procesarDistribucionCalificaciones(inscripcionesIds, calificaciones);

    } catch (error) {
        console.error('Error calculando distribución frontend:', error);
        return { data: [], error };
    }
};

const procesarDistribucionCalificaciones = (inscripcionesIds, calificaciones) => {
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

    return {
        data: datosFormateados,
        error: null
    };
};

/**
 * Calcular asistencia por grupo en frontend (fallback)
 */
export const calcularAsistenciaPorGrupoFrontend = async (filtros = {}) => {
    try {
        const { periodo, materiaId } = filtros;
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
            console.error('Error obteniendo grupos:', gruposError);
            return { data: [], error: gruposError };
        }

        if (!grupos || grupos.length === 0) {
            return { data: [], error: null };
        }

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

        return { data: asistenciaPorGrupo, error: null };
    } catch (error) {
        console.error('Error calculando asistencia por grupo frontend:', error);
        return { data: [], error };
    }
};

/**
 * Calcular tendencias de calificaciones en frontend (fallback)
 */
export const calcularTendenciasCalificacionesFrontend = async (filtros = {}) => {
    try {
        const { periodo, materiaId, grupoId, agruparPor = 'mes' } = filtros;
        // Si no hay filtros específicos, buscar directamente en inscripciones
        if (!periodo && !materiaId && !grupoId) {
            const { data: todasInscripciones, error: todasError } = await supabase
                .from('inscripciones')
                .select('id, grupo_id, estado')
                .eq('estado', 'activo')
                .limit(2000);

            if (todasError) {
                console.error('Error obteniendo todas las inscripciones:', todasError);
                return { data: [], error: todasError };
            }

            if (!todasInscripciones || todasInscripciones.length === 0) {
                return { data: [], error: null };
            }
            const inscripcionesIds = todasInscripciones.map(i => i.id);

            // Obtener calificaciones
            const { data: calificaciones, error: calError } = await supabase
                .from('calificaciones')
                .select('inscripcion_id, fecha, valor, valor_maximo, peso')
                .in('inscripcion_id', inscripcionesIds)
                .order('fecha', { ascending: true });

            if (calError) {
                console.error('Error obteniendo calificaciones:', calError);
                return { data: [], error: calError };
            }

            if (!calificaciones || calificaciones.length === 0) {
                return { data: [], error: null };
            }

            return procesarTendenciasCalificaciones(calificaciones, agruparPor);
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
            console.error('Error obteniendo grupos:', gruposError);
            return { data: [], error: gruposError };
        }

        if (!grupos || grupos.length === 0) {
            return { data: [], error: null };
        }

        const gruposIds = grupos.map(g => g.id);

        // Obtener inscripciones de estos grupos
        const { data: inscripciones, error: inscError } = await supabase
            .from('inscripciones')
            .select('id, grupo_id, estado')
            .eq('estado', 'activo')
            .in('grupo_id', gruposIds)
            .limit(2000);

        if (inscError) {
            console.error('Error obteniendo inscripciones:', inscError);
            return { data: [], error: inscError };
        }

        if (!inscripciones || inscripciones.length === 0) {
            return { data: [], error: null };
        }

        // Obtener calificaciones
        const inscripcionesIds = inscripciones.map(i => i.id);
        const { data: calificaciones, error: calError } = await supabase
            .from('calificaciones')
            .select('inscripcion_id, fecha, valor, valor_maximo, peso')
            .in('inscripcion_id', inscripcionesIds)
            .order('fecha', { ascending: true });

        if (calError) {
            console.error('Error obteniendo calificaciones:', calError);
            return { data: [], error: calError };
        }

        if (!calificaciones || calificaciones.length === 0) {
            return { data: [], error: null };
        }

        return procesarTendenciasCalificaciones(calificaciones, agruparPor);

    } catch (error) {
        console.error('Error calculando tendencias frontend:', error);
        return { data: [], error };
    }
};

const procesarTendenciasCalificaciones = (calificaciones, agruparPor) => {
    // Agrupar por periodo y calcular promedios acumulados
    const periodosMap = {};
    const inscripcionesProcesadas = new Set();

    // Procesar calificaciones ordenadas por fecha
    calificaciones.forEach(cal => {
        const fecha = new Date(cal.fecha);
        let periodoKey = '';

        if (agruparPor === 'semana') {
            const semana = getWeekNumber(fecha);
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
                periodo: formatearPeriodo(periodo.fecha, agruparPor),
                promedio: parseFloat(promedio.toFixed(2)),
                estudiantes: promedios.length
            };
        });

    return { data: tendencias, error: null };
};

/**
 * Calcular tendencias de asistencia en frontend (fallback)
 */
export const calcularTendenciasAsistenciaFrontend = async (filtros = {}) => {
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

        if (sesionesError) {
            console.error('Error obteniendo sesiones:', sesionesError);
            return { data: [], error: sesionesError };
        }

        if (!sesiones || sesiones.length === 0) {
            return { data: [], error: null };
        }

        // Agrupar sesiones por periodo
        const periodosMap = {};

        sesiones.forEach(sesion => {
            const fecha = new Date(sesion.fecha);
            let periodoKey = '';

            if (agruparPor === 'semana') {
                const semana = getWeekNumber(fecha);
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
                            periodo: formatearPeriodo(periodo.fecha, agruparPor),
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
                        periodo: formatearPeriodo(periodo.fecha, agruparPor),
                        porcentaje,
                        sesiones: periodo.sesiones.length
                    };
                })
        );

        return { data: tendencias, error: null };
    } catch (error) {
        console.error('Error calculando tendencias asistencia frontend:', error);
        return { data: [], error };
    }
};

/**
 * Calcular materias populares en frontend (fallback)
 */
export const calcularMateriasPopularesFrontend = async (filtros = {}) => {
    try {
        const { periodo, limit = 5 } = filtros;
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
            console.error('Error obteniendo grupos:', gruposError);
            return { data: [], error: gruposError };
        }

        if (!grupos || grupos.length === 0) {
            return { data: [], error: null };
        }

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

        return { data: materiasPopulares, error: null };
    } catch (error) {
        console.error('Error calculando materias populares frontend:', error);
        return { data: [], error };
    }
};

// Helper functions
const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};

const formatearPeriodo = (fecha, agruparPor) => {
    if (agruparPor === 'semana') {
        const semana = getWeekNumber(fecha);
        return `Semana ${semana}, ${fecha.getFullYear()}`;
    }
    return fecha.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
};
