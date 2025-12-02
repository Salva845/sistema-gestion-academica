// =========================================
// src/pages/estudiante/Dashboard.jsx
// Dashboard completo para estudiantes
// =========================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  BookOpen,
  QrCode,
  Award,
  Calendar,
  TrendingUp,
  Clock,
  Target,
  LogOut,
  Settings,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { parseHorario } from '../../utils/dashboardCalculations';

export default function EstudianteDashboard() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [misMaterias, setMisMaterias] = useState([]);
  const [stats, setStats] = useState({
    materiasInscritas: 0,
    promedioGeneral: 0,
    asistenciaPromedio: 0,
    creditosTotales: 0,
  });

  const [chartData, setChartData] = useState({
    calificacionesPorMateria: [],
    asistenciaPorMateria: [],
    rendimientoGeneral: [],
  });

  const [proximasClases, setProximasClases] = useState([]);
  const [horarioDialogOpen, setHorarioDialogOpen] = useState(false);
  const [horarioSemanal, setHorarioSemanal] = useState({});

  useEffect(() => {
    loadEstudianteData();
  }, [user]);

  const loadEstudianteData = async () => {
    try {
      setLoading(true);

      // Obtener inscripciones del estudiante
      const { data: inscripciones, error: inscripcionesError } = await supabase
        .from('inscripciones')
        .select(`
          *,
          grupos (
            *,
            materias (nombre, codigo, creditos)
          )
        `)
        .eq('estudiante_id', user.id)
        .eq('estado', 'activo');

      if (inscripcionesError) throw inscripcionesError;

      setMisMaterias(inscripciones || []);

      // Calcular estadísticas
      const creditosTotales = inscripciones?.reduce(
        (sum, ins) => sum + (ins.grupos?.materias?.creditos || 0),
        0
      ) || 0;

      setStats({
        materiasInscritas: inscripciones?.length || 0,
        promedioGeneral: 8.7, // Simulado - después calcular real
        asistenciaPromedio: 89, // Simulado
        creditosTotales,
      });

      // Datos para gráficas (simulados)
      setChartData({
        calificacionesPorMateria: inscripciones?.slice(0, 6).map(ins => ({
          materia: ins.grupos?.materias?.nombre?.substring(0, 12) || 'Materia',
          calificacion: (Math.random() * 2 + 8).toFixed(1),
        })) || [],
        asistenciaPorMateria: inscripciones?.slice(0, 6).map(ins => ({
          materia: ins.grupos?.materias?.nombre?.substring(0, 12) || 'Materia',
          asistencia: Math.floor(Math.random() * 20) + 80,
        })) || [],
        rendimientoGeneral: [
          { mes: 'Ene', promedio: 8.5 },
          { mes: 'Feb', promedio: 8.7 },
          { mes: 'Mar', promedio: 8.6 },
          { mes: 'Abr', promedio: 8.8 },
          { mes: 'May', promedio: 8.9 },
          { mes: 'Jun', promedio: 8.7 },
        ],
      });

      // Calcular próximas clases reales
      const today = new Date();
      const dayOfWeek = today.getDay();
      const nowTime = today.getHours() * 60 + today.getMinutes();

      const clasesHoy = (inscripciones || [])
        .map(ins => {
          const grupo = ins.grupos;
          const horario = parseHorario(grupo?.horario);

          if (!horario || !horario.days.includes(dayOfWeek)) return null;

          const [startHour, startMin] = horario.startTime.split(':').map(Number);
          const [endHour, endMin] = horario.endTime.split(':').map(Number);
          const startTimeVal = startHour * 60 + startMin;
          const endTimeVal = endHour * 60 + endMin;

          // Solo mostrar si la clase no ha terminado
          if (endTimeVal <= nowTime) return null;

          return {
            materia: grupo.materias?.nombre,
            hora: `${horario.startTime} - ${horario.endTime}`,
            salon: grupo.salon || 'Por asignar',
            startTimeVal
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.startTimeVal - b.startTimeVal);

      setProximasClases(clasesHoy);

      // Organizar horario semanal
      const horarioMap = {
        1: [], // Lunes
        2: [], // Martes
        3: [], // Miércoles
        4: [], // Jueves
        5: [], // Viernes
        6: [], // Sábado
        0: []  // Domingo
      };

      (inscripciones || []).forEach(ins => {
        const grupo = ins.grupos;
        const horario = parseHorario(grupo?.horario);

        if (horario) {
          horario.days.forEach(day => {
            horarioMap[day].push({
              materia: grupo.materias?.nombre,
              codigo: grupo.materias?.codigo,
              hora: `${horario.startTime} - ${horario.endTime}`,
              salon: grupo.salon || 'Por asignar',
              startTimeVal: parseInt(horario.startTime.replace(':', ''))
            });
          });
        }
      });

      // Ordenar clases por hora
      Object.keys(horarioMap).forEach(day => {
        horarioMap[day].sort((a, b) => a.startTimeVal - b.startTimeVal);
      });

      setHorarioSemanal(horarioMap);

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCalificacionColor = (cal) => {
    if (cal >= 9) return 'text-green-600';
    if (cal >= 8) return 'text-blue-600';
    if (cal >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCalificacionBadge = (cal) => {
    if (cal >= 9) return 'success';
    if (cal >= 8) return 'default';
    if (cal >= 7) return 'warning';
    return 'destructive';
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900`}>
            <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="loading-spinner mx-auto"></div>
          <p className="text-muted-foreground">Cargando tu información...</p>
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
            <span className="text-xl font-bold">Mi Portal Estudiantil</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium">{profile?.nombre} {profile?.apellido}</p>
              <p className="text-xs text-muted-foreground">Mat: {profile?.matricula}</p>
            </div>
            <Badge variant="secondary">Estudiante</Badge>
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
            ¡Hola, {profile?.nombre}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Aquí está tu resumen académico del día de hoy
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Materias Inscritas"
            value={stats.materiasInscritas}
            icon={BookOpen}
            color="blue"
            subtitle={`${stats.creditosTotales} créditos totales`}
          />
          <StatCard
            title="Promedio General"
            value={stats.promedioGeneral.toFixed(1)}
            icon={Award}
            color="green"
            subtitle="¡Excelente trabajo!"
          />
          <StatCard
            title="Asistencia"
            value={`${stats.asistenciaPromedio}%`}
            icon={CheckCircle}
            color="purple"
            subtitle="Promedio del semestre"
          />
          <StatCard
            title="Créditos"
            value={stats.creditosTotales}
            icon={Target}
            color="orange"
            subtitle="Cursando actualmente"
          />
        </div>

        {/* Quick Actions + Próximas Clases */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Herramientas que necesitas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button
                  onClick={() => navigate('/estudiante/materias')}
                  className="h-24 flex flex-col gap-2"
                  size="lg"
                >
                  <BookOpen className="h-8 w-8" />
                  <span className="text-sm">Mis Materias</span>
                </Button>
                <Button
                  onClick={() => navigate('/estudiante/asistencia')}
                  className="h-24 flex flex-col gap-2"
                  size="lg"
                  variant="outline"
                >
                  <QrCode className="h-8 w-8" />
                  <span className="text-sm">Registrar Asistencia</span>
                </Button>
                <Button
                  onClick={() => navigate('/estudiante/calificaciones')}
                  className="h-24 flex flex-col gap-2"
                  size="lg"
                  variant="outline"
                >
                  <Award className="h-8 w-8" />
                  <span className="text-sm">Ver Calificaciones</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Próximas Clases */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Próximas Clases</CardTitle>
                <CardDescription>Hoy</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setHorarioDialogOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Ver Horario
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-3">
                  {proximasClases.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No hay más clases por hoy</p>
                    </div>
                  ) : (
                    proximasClases.map((clase, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{clase.materia}</p>
                          <p className="text-xs text-muted-foreground">
                            {clase.hora} • {clase.salon}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {clase.hora.split(' - ')[0]}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mis Materias */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mis Materias del Semestre</CardTitle>
            <CardDescription>Resumen de tus materias inscritas</CardDescription>
          </CardHeader>
          <CardContent>
            {misMaterias.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tienes materias inscritas</p>
                <Button className="mt-4" onClick={() => navigate('/estudiante/materias')}>
                  Inscribir Materias
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {misMaterias.map((inscripcion) => {
                  const materia = inscripcion.grupos?.materias;
                  const grupo = inscripcion.grupos;
                  const calificacion = (Math.random() * 2 + 8).toFixed(1); // Simulado
                  const asistencia = Math.floor(Math.random() * 20) + 80; // Simulado

                  return (
                    <Card key={inscripcion.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base leading-tight">
                              {materia?.nombre || 'Sin nombre'}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                {materia?.codigo || 'N/A'}
                              </Badge>
                            </CardDescription>
                          </div>
                          <Badge variant={getCalificacionBadge(calificacion)}>
                            {calificacion}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Asistencia:</span>
                          <span className={asistencia >= 80 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {asistencia}%
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          {grupo?.horario || 'Sin horario'}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-2" />
                          Salón: {grupo?.salon || 'Por asignar'}
                        </div>
                        <Button
                          className="w-full mt-3"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/estudiante/materias/${inscripcion.id}`)}
                        >
                          Ver Detalles
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Calificaciones por Materia */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Calificaciones</CardTitle>
              <CardDescription>Calificaciones actuales por materia</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.calificacionesPorMateria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="materia" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="calificacion" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Asistencia por Materia */}
          <Card>
            <CardHeader>
              <CardTitle>Mi Asistencia</CardTitle>
              <CardDescription>Porcentaje de asistencia por materia</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.asistenciaPorMateria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="materia" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="asistencia" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tendencia de Rendimiento */}
        <Card>
          <CardHeader>
            <CardTitle>Mi Rendimiento en el Semestre</CardTitle>
            <CardDescription>Evolución de tu promedio mensual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.rendimientoGeneral}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="promedio"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Promedio General"
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Motivational Message */}
        {stats.promedioGeneral >= 9 && (
          <Card className="mt-8 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    ¡Excelente desempeño!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Tu promedio de {stats.promedioGeneral.toFixed(1)} te coloca entre los mejores estudiantes. ¡Sigue así!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Dialog Horario */}
      <Dialog open={horarioDialogOpen} onOpenChange={setHorarioDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Horario de Clases</DialogTitle>
            <DialogDescription>Tu horario semanal completo</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {[1, 2, 3, 4, 5, 6].map(dayIndex => {
              const clases = horarioSemanal[dayIndex];
              if (!clases || clases.length === 0) return null;

              const daysNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

              return (
                <Card key={dayIndex} className="border-l-4 border-l-primary">
                  <CardHeader className="py-3 bg-muted/50">
                    <CardTitle className="text-base">{daysNames[dayIndex]}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-3">
                    {clases.map((clase, idx) => (
                      <div key={idx} className="text-sm border-b last:border-0 pb-2 last:pb-0">
                        <p className="font-semibold">{clase.materia}</p>
                        <div className="flex justify-between text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {clase.hora}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {clase.salon}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}

            {Object.values(horarioSemanal).every(day => day.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No tienes clases registradas con horario asignado</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}