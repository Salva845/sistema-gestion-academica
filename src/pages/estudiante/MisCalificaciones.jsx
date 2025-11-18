import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { calificacionesService } from '../../services/calificaciones.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  ArrowLeft,
  Award,
  TrendingUp,
  AlertCircle,
  BookOpen,
  Calendar,
  Search,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

export default function EstudianteMisCalificaciones() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [misMaterias, setMisMaterias] = useState([]);
  const [todasCalificaciones, setTodasCalificaciones] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    promedioGeneral: 0,
    materiasAprobadas: 0,
    materiasReprobadas: 0,
    totalMaterias: 0,
  });
  const [evolucionData, setEvolucionData] = useState([]);
  const [materiaSeleccionadaEvolucion, setMateriaSeleccionadaEvolucion] = useState('all');

  useEffect(() => {
    if (user) {
      loadCalificaciones();
    }
  }, [user]);

  const loadCalificaciones = async () => {
    try {
      setLoading(true);

      // Obtener inscripciones activas
      const { data: inscripciones, error: inscError } = await supabase
        .from('inscripciones')
        .select(`
          *,
          grupos (
            id,
            periodo,
            materias (nombre, codigo, creditos)
          )
        `)
        .eq('estudiante_id', user.id)
        .eq('estado', 'activo');

      if (inscError) throw inscError;

      // Para cada inscripción, obtener calificaciones y calcular promedio usando PostgreSQL
      const materiasConCalificaciones = await Promise.all(
        (inscripciones || []).map(async (insc) => {
          const { data: cals, promedio } = await calificacionesService.obtenerCalificacionesPorGrupo(insc.id);
          
          return {
            inscripcion: insc,
            materia: insc.grupos?.materias,
            grupo: insc.grupos,
            calificaciones: cals || [],
            promedio: promedio || 0
          };
        })
      );

      setMisMaterias(materiasConCalificaciones);

      // Aplanar todas las calificaciones
      const todasCals = materiasConCalificaciones.flatMap(m => 
        m.calificaciones.map(c => ({
          ...c,
          materia: m.materia
        }))
      );
      setTodasCalificaciones(todasCals);

      // Calcular estadísticas
      const promedios = materiasConCalificaciones
        .filter(m => m.promedio > 0)
        .map(m => m.promedio);
      
      const promedioGeneral = promedios.length > 0
        ? (promedios.reduce((sum, p) => sum + p, 0) / promedios.length).toFixed(2)
        : 0;

      const materiasAprobadas = materiasConCalificaciones.filter(m => m.promedio >= 6).length;
      const materiasReprobadas = materiasConCalificaciones.filter(m => m.promedio > 0 && m.promedio < 6).length;

      setStats({
        promedioGeneral: parseFloat(promedioGeneral),
        materiasAprobadas,
        materiasReprobadas,
        totalMaterias: materiasConCalificaciones.length,
      });

      // Cargar datos de evolución para la gráfica de línea de tiempo
      await loadEvolucionData(materiasConCalificaciones);

    } catch (error) {
      console.error('Error cargando calificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvolucionData = async (materias) => {
    try {
      if (materiaSeleccionadaEvolucion === 'all') {
        // Si es 'all', combinar datos de todas las materias
        const todasEvoluciones = await Promise.all(
          materias.map(async (m) => {
            const { data } = await calificacionesService.obtenerEvolucionCalificaciones(
              m.inscripcion.id,
              'semana'
            );
            return (data || []).map(item => ({
              ...item,
              materia: m.materia?.nombre || 'Materia',
              periodo: new Date(item.periodo).toLocaleDateString('es-MX', { 
                month: 'short', 
                day: 'numeric' 
              })
            }));
          })
        );

        // Agrupar por fecha y calcular promedio general
        const fechasUnicas = [...new Set(todasEvoluciones.flat().map(e => e.periodo))].sort();
        const evolucionAgrupada = fechasUnicas.map(fecha => {
          const valores = todasEvoluciones
            .flat()
            .filter(e => e.periodo === fecha)
            .map(e => e.promedio_acumulado)
            .filter(v => v > 0);
          
          return {
            periodo: fecha,
            promedio: valores.length > 0 
              ? (valores.reduce((sum, v) => sum + v, 0) / valores.length).toFixed(2)
              : 0
          };
        });

        setEvolucionData(evolucionAgrupada);
      } else {
        // Cargar evolución de una materia específica
        const materia = materias.find(m => m.inscripcion.id === materiaSeleccionadaEvolucion);
        if (materia) {
          const { data } = await calificacionesService.obtenerEvolucionCalificaciones(
            materia.inscripcion.id,
            'semana'
          );
          const evolucion = (data || []).map(item => ({
            periodo: new Date(item.periodo).toLocaleDateString('es-MX', { 
              month: 'short', 
              day: 'numeric' 
            }),
            promedio: parseFloat(item.promedio_acumulado || 0).toFixed(2)
          }));
          setEvolucionData(evolucion);
        }
      }
    } catch (error) {
      console.error('Error cargando datos de evolución:', error);
      setEvolucionData([]);
    }
  };

  useEffect(() => {
    if (misMaterias.length > 0) {
      loadEvolucionData(misMaterias);
    }
  }, [materiaSeleccionadaEvolucion]);

  const getTipoLabel = (tipo) => {
    const labels = {
      examen: 'Examen',
      tarea: 'Tarea',
      proyecto: 'Proyecto',
      participacion: 'Participación',
      exposicion: 'Exposición',
    };
    return labels[tipo] || tipo;
  };

  const getTipoBadgeVariant = (tipo) => {
    const variants = {
      examen: 'default',
      tarea: 'secondary',
      proyecto: 'outline',
      participacion: 'success',
      exposicion: 'warning',
    };
    return variants[tipo] || 'secondary';
  };

  const getPromedioColor = (promedio) => {
    if (promedio >= 9) return 'text-green-600';
    if (promedio >= 8) return 'text-blue-600';
    if (promedio >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPromedioBadge = (promedio) => {
    if (promedio >= 9) return 'default';
    if (promedio >= 8) return 'secondary';
    if (promedio >= 7) return 'warning';
    return 'destructive';
  };

  // Filtrar calificaciones
  const filteredCalificaciones = todasCalificaciones.filter((cal) => {
    const matchesMateria = materiaSeleccionada === 'all' || 
      misMaterias.find(m => 
        m.calificaciones.some(c => c.id === cal.id) && 
        m.inscripcion.id === materiaSeleccionada
      );
    
    const matchesSearch = 
      cal.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cal.materia?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesMateria && matchesSearch;
  });

  // Datos para gráficas
  const chartDataMaterias = misMaterias
    .filter(m => m.promedio > 0)
    .map(m => ({
      materia: m.materia?.nombre?.substring(0, 15) || 'Materia',
      promedio: m.promedio
    }));

  const chartDataTipos = calificacionesService.obtenerResumenPorTipo(
    materiaSeleccionada === 'all' 
      ? todasCalificaciones 
      : misMaterias.find(m => m.inscripcion.id === materiaSeleccionada)?.calificaciones || []
  );

  // Datos para radar chart (rendimiento por tipo)
  const radarData = [
    'examen',
    'tarea',
    'proyecto',
    'participacion',
    'exposicion'
  ].map(tipo => {
    const calsTipo = todasCalificaciones.filter(c => c.tipo === tipo);
    const promedio = calsTipo.length > 0
      ? calsTipo.reduce((sum, c) => sum + (Number(c.valor) / Number(c.valor_maximo)) * 10, 0) / calsTipo.length
      : 0;
    
    return {
      tipo: getTipoLabel(tipo),
      valor: parseFloat(promedio.toFixed(2))
    };
  }).filter(d => d.valor > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center px-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/estudiante')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Mis Calificaciones
            </h1>
            <p className="text-muted-foreground">
              Consulta tus calificaciones y promedio académico
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Promedio General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getPromedioColor(stats.promedioGeneral)}`}>
                  {stats.promedioGeneral > 0 ? stats.promedioGeneral : '--'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Materias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalMaterias}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aprobadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats.materiasAprobadas}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Reprobadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {stats.materiasReprobadas}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="materias" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="materias" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Por Materia
              </TabsTrigger>
              <TabsTrigger value="detalle" className="gap-2">
                <Award className="h-4 w-4" />
                Detalle
              </TabsTrigger>
              <TabsTrigger value="graficas" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Gráficas
              </TabsTrigger>
            </TabsList>

            {/* Tab: Por Materia */}
            <TabsContent value="materias" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="loading-spinner"></div>
                </div>
              ) : misMaterias.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No tienes materias inscritas</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {misMaterias.map((materia) => (
                    <Card key={materia.inscripcion.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg leading-tight">
                              {materia.materia?.nombre}
                            </CardTitle>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                {materia.materia?.codigo}
                              </Badge>
                            </div>
                          </div>
                          {materia.promedio > 0 && (
                            <Badge variant={getPromedioBadge(materia.promedio)} className="text-lg">
                              {materia.promedio}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Calificaciones:</span>
                            <span className="font-medium">{materia.calificaciones.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Créditos:</span>
                            <span className="font-medium">{materia.materia?.creditos}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Periodo:</span>
                            <span className="font-medium">{materia.grupo?.periodo}</span>
                          </div>
                        </div>

                        {materia.calificaciones.length > 0 && (
                          <div className="pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">
                              Últimas evaluaciones:
                            </p>
                            <div className="space-y-1">
                              {materia.calificaciones.slice(0, 3).map((cal) => (
                                <div key={cal.id} className="flex justify-between text-sm">
                                  <span className="truncate mr-2">{cal.nombre}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {cal.valor}/{cal.valor_maximo}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Detalle */}
            <TabsContent value="detalle" className="space-y-4">
              {/* Filtros */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre de evaluación o materia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={materiaSeleccionada} onValueChange={setMateriaSeleccionada}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Todas las materias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las materias</SelectItem>
                        {misMaterias.map(m => (
                          <SelectItem key={m.inscripcion.id} value={m.inscripcion.id}>
                            {m.materia?.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Calificaciones */}
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Calificaciones</CardTitle>
                  <CardDescription>
                    {filteredCalificaciones.length} evaluaciones registradas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredCalificaciones.length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm || materiaSeleccionada !== 'all'
                          ? 'No se encontraron calificaciones'
                          : 'No tienes calificaciones registradas'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredCalificaciones.map((cal) => (
                        <div
                          key={cal.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={getTipoBadgeVariant(cal.tipo)}>
                                {getTipoLabel(cal.tipo)}
                              </Badge>
                              <p className="font-semibold">{cal.nombre}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {cal.materia?.nombre}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(cal.fecha).toLocaleDateString('es-MX')}
                              </span>
                              <span>Peso: {cal.peso}%</span>
                            </div>
                            {cal.comentarios && (
                              <p className="text-sm text-muted-foreground italic">
                                "{cal.comentarios}"
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-2xl font-bold">
                              {cal.valor}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              de {cal.valor_maximo}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Gráficas */}
            <TabsContent value="graficas" className="space-y-6">
              {/* Evolución Temporal - Gráfica de Línea de Tiempo */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Evolución de Calificaciones</CardTitle>
                      <CardDescription>Línea de tiempo de tu rendimiento académico</CardDescription>
                    </div>
                    <Select 
                      value={materiaSeleccionadaEvolucion} 
                      onValueChange={setMateriaSeleccionadaEvolucion}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Todas las materias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las materias</SelectItem>
                        {misMaterias.map(m => (
                          <SelectItem key={m.inscripcion.id} value={m.inscripcion.id}>
                            {m.materia?.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {evolucionData.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No hay datos suficientes para mostrar la evolución
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={evolucionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="periodo" 
                          angle={-45} 
                          textAnchor="end" 
                          height={100}
                          interval={0}
                        />
                        <YAxis domain={[0, 10]} />
                        <Tooltip 
                          formatter={(value) => [`${value}`, 'Promedio']}
                          labelFormatter={(label) => `Fecha: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="promedio" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          name="Promedio Acumulado"
                          dot={{ r: 5 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Promedio por Materia */}
              <Card>
                <CardHeader>
                  <CardTitle>Promedio por Materia</CardTitle>
                  <CardDescription>Comparación de tu rendimiento académico</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartDataMaterias.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No hay datos suficientes para mostrar
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartDataMaterias}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="materia" 
                          angle={-45} 
                          textAnchor="end" 
                          height={100}
                          interval={0}
                        />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Bar dataKey="promedio" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Rendimiento por Tipo de Evaluación */}
                <Card>
                  <CardHeader>
                    <CardTitle>Rendimiento por Tipo</CardTitle>
                    <CardDescription>Promedio por tipo de evaluación</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {radarData.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No hay datos suficientes
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="tipo" />
                          <PolarRadiusAxis domain={[0, 10]} />
                          <Radar 
                            name="Promedio" 
                            dataKey="valor" 
                            stroke="#3b82f6" 
                            fill="#3b82f6" 
                            fillOpacity={0.6} 
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Distribución por Tipo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Evaluaciones</CardTitle>
                    <CardDescription>Cantidad y promedio por tipo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {chartDataTipos.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No hay datos suficientes
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chartDataTipos.map((item) => (
                          <div key={item.tipo} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{getTipoLabel(item.tipo)}</span>
                              <span className={getPromedioColor(parseFloat(item.promedio))}>
                                {item.promedio}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${(item.promedio / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8">
                                {item.cantidad}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Mensaje motivacional */}
          {stats.promedioGeneral >= 9 && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-500">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      ¡Excelente desempeño académico!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Tu promedio de {stats.promedioGeneral} te coloca entre los mejores estudiantes. ¡Sigue así!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}