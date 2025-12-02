// =========================================
// src/pages/admin/Dashboard.jsx
// Dashboard completo para administradores - Módulo 5
// =========================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard.service';
import { User, Filter, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  TrendingUp,
  UserCheck,
  Award,
  LogOut,
  Settings,
  BarChart3,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtros, setFiltros] = useState({
    periodo: 'all',
    materiaId: 'all',
    grupoId: 'all'
  });

  // Filtros disponibles
  const [filtrosDisponibles, setFiltrosDisponibles] = useState({
    periodos: [],
    materias: [],
    grupos: []
  });

  // Métricas globales
  const [stats, setStats] = useState({
    totalEstudiantes: 0,
    totalDocentes: 0,
    totalMaterias: 0,
    totalGrupos: 0,
    promedioGeneral: 0,
    asistenciaPromedio: 0,
  });

  // Datos para gráficas
  const [chartData, setChartData] = useState({
    materiasPopulares: [],
    distribucionCalificaciones: [], // Histograma
    distribucionCalificacionesPie: [], // Pie chart
    asistenciaPorGrupo: [],
    tendenciaAsistencia: [],
    tendenciaCalificaciones: [],
  });

  useEffect(() => {
    loadFiltrosDisponibles();
  }, []);

  useEffect(() => {
    if (filtrosDisponibles.periodos.length > 0) {
      loadDashboardData();
    }
  }, [filtros, filtrosDisponibles]);

  const loadFiltrosDisponibles = async () => {
    try {
      const { data } = await dashboardService.obtenerFiltrosDisponibles();
      if (data) {
        setFiltrosDisponibles(data);
      }
    } catch (error) {
      console.error('Error cargando filtros:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Preparar filtros para las funciones
      const filtrosParams = {
        periodo: filtros.periodo !== 'all' ? filtros.periodo : null,
        materiaId: filtros.materiaId !== 'all' ? filtros.materiaId : null,
        grupoId: filtros.grupoId !== 'all' ? filtros.grupoId : null
      };

      // Cargar métricas globales
      const { data: metricas } = await dashboardService.obtenerMetricasGlobales(filtrosParams);
      if (metricas) {
        setStats({
          totalEstudiantes: metricas.totalEstudiantes,
          totalDocentes: metricas.totalDocentes,
          totalMaterias: filtrosDisponibles.materias.length,
          totalGrupos: metricas.totalGrupos,
          promedioGeneral: metricas.promedioGeneral,
          asistenciaPromedio: metricas.asistenciaPromedio,
        });
      }

      // Cargar todas las gráficas en paralelo
      const [
        materiasPopulares,
        distribucionCalificaciones,
        asistenciaPorGrupo,
        tendenciaAsistencia,
        tendenciaCalificaciones
      ] = await Promise.all([
        dashboardService.obtenerMateriasPopulares({ periodo: filtrosParams.periodo }),
        dashboardService.obtenerDistribucionCalificaciones(filtrosParams),
        dashboardService.obtenerAsistenciaPorGrupo({ periodo: filtrosParams.periodo, materiaId: filtrosParams.materiaId }),
        dashboardService.obtenerTendenciasAsistencia({ ...filtrosParams, agruparPor: 'mes' }),
        dashboardService.obtenerTendenciasCalificaciones({ ...filtrosParams, agruparPor: 'mes' })
      ]);

      setChartData({
        materiasPopulares: materiasPopulares.data || [],
        distribucionCalificaciones: distribucionCalificaciones.data || [],
        distribucionCalificacionesPie: distribucionCalificaciones.data || [],
        asistenciaPorGrupo: asistenciaPorGrupo.data || [],
        tendenciaAsistencia: tendenciaAsistencia.data || [],
        tendenciaCalificaciones: tendenciaCalificaciones.data || [],
      });

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (tipo, value) => {
    setFiltros(prev => {
      const nuevos = { ...prev, [tipo]: value };
      // Si cambia periodo o materia, resetear grupo
      if (tipo === 'periodo' || tipo === 'materiaId') {
        nuevos.grupoId = 'all';
      }
      return nuevos;
    });
  };

  const limpiarFiltros = () => {
    setFiltros({
      periodo: 'all',
      materiaId: 'all',
      grupoId: 'all'
    });
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
            {trend && (
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900`}>
            <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const tieneFiltrosActivos = filtros.periodo !== 'all' || filtros.materiaId !== 'all' || filtros.grupoId !== 'all';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="loading-spinner mx-auto"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Sistema Académico</span>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              Administrador
            </Badge>
            {/* <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button> */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/profile')}
              title="Mi Perfil"
            >
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Bienvenido, {profile?.nombre}
          </h1>
          <p className="text-muted-foreground text-lg">
            Panel de control administrativo - Vista general del sistema
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
                <CardDescription>Filtra los datos por periodo, materia o grupo</CardDescription>
              </div>
              {tieneFiltrosActivos && (
                <Button variant="outline" size="sm" onClick={limpiarFiltros} className="gap-2">
                  <X className="h-4 w-4" />
                  Limpiar Filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Periodo</label>
                <Select value={filtros.periodo} onValueChange={(value) => handleFiltroChange('periodo', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los periodos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los periodos</SelectItem>
                    {filtrosDisponibles.periodos.map(periodo => (
                      <SelectItem key={periodo} value={periodo}>{periodo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Materia</label>
                <Select value={filtros.materiaId} onValueChange={(value) => handleFiltroChange('materiaId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las materias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las materias</SelectItem>
                    {filtrosDisponibles.materias.map(materia => (
                      <SelectItem key={materia.id} value={materia.id}>
                        {materia.nombre} ({materia.codigo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Grupo</label>
                <Select value={filtros.grupoId} onValueChange={(value) => handleFiltroChange('grupoId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los grupos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los grupos</SelectItem>
                    {filtrosDisponibles.grupos
                      .filter(g =>
                        (filtros.periodo === 'all' || g.periodo === filtros.periodo) &&
                        (filtros.materiaId === 'all' || g.materia === filtrosDisponibles.materias.find(m => m.id === filtros.materiaId)?.nombre)
                      )
                      .map(grupo => (
                        <SelectItem key={grupo.id} value={grupo.id}>
                          {grupo.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <StatCard
            title="Total Estudiantes"
            value={stats.totalEstudiantes}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Total Docentes"
            value={stats.totalDocentes}
            icon={UserCheck}
            color="green"
          />
          <StatCard
            title="Materias Activas"
            value={stats.totalMaterias}
            icon={BookOpen}
            color="purple"
          />
          <StatCard
            title="Grupos Activos"
            value={stats.totalGrupos}
            icon={Calendar}
            color="orange"
          />
          <StatCard
            title="Promedio General"
            value={stats.promedioGeneral > 0 ? stats.promedioGeneral.toFixed(1) : '--'}
            icon={Award}
            color="yellow"
          />
          <StatCard
            title="Asistencia Promedio"
            value={stats.asistenciaPromedio > 0 ? `${stats.asistenciaPromedio.toFixed(1)}%` : '--'}
            icon={Clock}
            color="green"
          />
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Gestiona los elementos principales del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button
                onClick={() => navigate('/admin/usuarios')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <Users className="h-6 w-6" />
                <span>Gestionar Usuarios</span>
              </Button>
              <Button
                onClick={() => navigate('/admin/materias')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <BookOpen className="h-6 w-6" />
                <span>Gestionar Materias</span>
              </Button>
              <Button
                onClick={() => navigate('/admin/grupos')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <Calendar className="h-6 w-6" />
                <span>Gestionar Grupos</span>
              </Button>
              <Button
                onClick={() => toast.info('Próximamente: Esta funcionalidad estará disponible en futuras actualizaciones')}
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <BarChart3 className="h-6 w-6" />
                <span>Ver Reportes</span>
                <span className="text-xs text-muted-foreground">(Próximamente)</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Materias Populares */}
          <Card>
            <CardHeader>
              <CardTitle>Materias con Más Estudiantes</CardTitle>
              <CardDescription>Top 5 materias más demandadas</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.materiasPopulares.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No hay datos disponibles
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.materiasPopulares}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="estudiantes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Distribución de Calificaciones - Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Calificaciones</CardTitle>
              <CardDescription>Rangos de calificaciones</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.distribucionCalificacionesPie.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No hay datos disponibles
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.distribucionCalificacionesPie}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.distribucionCalificacionesPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Histograma de Distribución de Calificaciones */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Histograma de Distribución de Calificaciones</CardTitle>
            <CardDescription>Distribución por rangos de calificaciones</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.distribucionCalificaciones.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No hay datos disponibles
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.distribucionCalificaciones}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Cantidad de Estudiantes" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Asistencia por Grupo */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Asistencia por Grupo</CardTitle>
            <CardDescription>Porcentaje de asistencia promedio por grupo</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.asistenciaPorGrupo.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No hay datos disponibles
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.asistenciaPorGrupo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grupo" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="asistencia" fill="#10b981" radius={[8, 8, 0, 0]} name="Asistencia (%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tendencias Temporales */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Tendencia de Asistencia */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Asistencia</CardTitle>
              <CardDescription>Evolución mensual de asistencia</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.tendenciaAsistencia.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No hay datos disponibles
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.tendenciaAsistencia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="porcentaje"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Asistencia (%)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Tendencia de Calificaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Calificaciones</CardTitle>
              <CardDescription>Evolución mensual de promedios</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.tendenciaCalificaciones.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No hay datos disponibles
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.tendenciaCalificaciones}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="promedio"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Promedio"
                      dot={{ r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
