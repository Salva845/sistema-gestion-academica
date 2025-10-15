// =========================================
// src/pages/docente/Dashboard.jsx
// Dashboard completo para docentes
// =========================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User } from 'lucide-react'
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
  BookOpen,
  Users,
  QrCode,
  ClipboardList,
  Calendar,
  TrendingUp,
  Clock,
  Award,
  LogOut,
  Settings,
  GraduationCap,
  CheckCircle,
  AlertCircle,
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
} from 'recharts';

export default function DocenteDashboard() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [misGrupos, setMisGrupos] = useState([]);
  const [stats, setStats] = useState({
    totalGrupos: 0,
    totalEstudiantes: 0,
    sesionesHoy: 0,
    promedioAsistencia: 0,
  });

  const [chartData, setChartData] = useState({
    asistenciaPorGrupo: [],
    calificacionesPorGrupo: [],
  });

  useEffect(() => {
    loadDocenteData();
  }, [user]);

  const loadDocenteData = async () => {
    try {
      setLoading(true);

      // Obtener grupos del docente
      const { data: grupos, error: gruposError } = await supabase
        .from('grupos')
        .select(`
          *,
          materias (nombre, codigo),
          inscripciones (count)
        `)
        .eq('docente_id', user.id)
        .eq('activo', true);

      if (gruposError) throw gruposError;

      setMisGrupos(grupos || []);

      // Calcular estadísticas
      const totalEstudiantes = grupos?.reduce(
        (sum, grupo) => sum + (grupo.inscripciones?.[0]?.count || 0),
        0
      ) || 0;

      setStats({
        totalGrupos: grupos?.length || 0,
        totalEstudiantes,
        sesionesHoy: 2, // Simulado
        promedioAsistencia: 87,
      });

      // Datos para gráficas (simulados)
      setChartData({
        asistenciaPorGrupo: grupos?.slice(0, 5).map(g => ({
          grupo: g.materias?.nombre?.substring(0, 15) || 'Grupo',
          asistencia: Math.floor(Math.random() * 20) + 80,
        })) || [],
        calificacionesPorGrupo: grupos?.slice(0, 5).map(g => ({
          grupo: g.materias?.nombre?.substring(0, 15) || 'Grupo',
          promedio: (Math.random() * 2 + 8).toFixed(1),
        })) || [],
      });

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue', action }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
            {action && (
              <Button 
                variant="link" 
                className="mt-2 p-0 h-auto text-primary"
                onClick={action.onClick}
              >
                {action.label} →
              </Button>
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
            <span className="text-xl font-bold">Panel Docente</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary">Docente</Badge>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
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
            ¡Hola, {profile?.nombre}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Gestiona tus clases, asistencias y calificaciones desde aquí
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Mis Grupos"
            value={stats.totalGrupos}
            icon={BookOpen}
            color="blue"
            action={{ label: 'Ver grupos', onClick: () => navigate('/docente/grupos') }}
          />
          <StatCard
            title="Total Estudiantes"
            value={stats.totalEstudiantes}
            icon={Users}
            color="green"
          />
          <StatCard
            title="Sesiones Hoy"
            value={stats.sesionesHoy}
            icon={Calendar}
            color="orange"
            action={{ label: 'Ver horario', onClick: () => {} }}
          />
          <StatCard
            title="Asistencia Promedio"
            value={`${stats.promedioAsistencia}%`}
            icon={CheckCircle}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Herramientas que más utilizas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button 
                onClick={() => navigate('/docente/asistencia')} 
                className="h-24 flex flex-col gap-2"
                size="lg"
              >
                <QrCode className="h-8 w-8" />
                <span className="text-sm">Generar QR de Asistencia</span>
              </Button>
              <Button 
                onClick={() => navigate('/docente/calificaciones')} 
                className="h-24 flex flex-col gap-2"
                size="lg"
                variant="outline"
              >
                <ClipboardList className="h-8 w-8" />
                <span className="text-sm">Registrar Calificaciones</span>
              </Button>
              <Button 
                onClick={() => navigate('/docente/MisGrupos')} 
                className="h-24 flex flex-col gap-2"
                size="lg"
                variant="outline"
              >
                <Users className="h-8 w-8" />
                <span className="text-sm">Ver Mis Grupos</span>
              </Button>
              <Button 
                onClick={() => navigate('/docente/reportes')} 
                className="h-24 flex flex-col gap-2"
                size="lg"
                variant="outline"
              >
                <Award className="h-8 w-8" />
                <span className="text-sm">Generar Reportes</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mis Grupos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mis Grupos Activos</CardTitle>
            <CardDescription>Grupos que impartes este semestre</CardDescription>
          </CardHeader>
          <CardContent>
            {misGrupos.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tienes grupos asignados aún</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {misGrupos.map((grupo) => (
                  <Card key={grupo.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {grupo.materias?.nombre || 'Sin nombre'}
                      </CardTitle>

                      <div>
                        <Badge variant="outline" className="text-xs">
                          {grupo.materias?.codigo || 'N/A'}
                        </Badge>
                      </div>

                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {grupo.horario || 'Sin horario'}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        {grupo.inscripciones?.[0]?.count || 0} estudiantes
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        Salón: {grupo.salon || 'Por asignar'}
                      </div>
                      <Button 
                        className="w-full mt-4" 
                        variant="outline"
                        onClick={() => navigate(`/docente/grupos/${grupo.id}`)}
                      >
                        Ver Detalles
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Asistencia por Grupo */}
          <Card>
            <CardHeader>
              <CardTitle>Asistencia por Grupo</CardTitle>
              <CardDescription>Porcentaje promedio de asistencia</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.asistenciaPorGrupo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grupo" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="asistencia" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Calificaciones por Grupo */}
          <Card>
            <CardHeader>
              <CardTitle>Promedio de Calificaciones</CardTitle>
              <CardDescription>Promedio general por grupo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.calificacionesPorGrupo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grupo" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="promedio" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Promedio"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}