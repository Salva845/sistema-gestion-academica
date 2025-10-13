// =========================================
// src/pages/admin/Dashboard.jsx
// Dashboard completo para administradores
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
  const [stats, setStats] = useState({
    totalEstudiantes: 0,
    totalDocentes: 0,
    totalMaterias: 0,
    totalGrupos: 0,
    promedioGeneral: 0,
    asistenciaPromedio: 0,
  });

  const [chartData, setChartData] = useState({
    materiasPopulares: [],
    distribucionCalificaciones: [],
    tendenciaAsistencia: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Contar estudiantes
      const { count: estudiantesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'estudiante');

      // Contar docentes
      const { count: docentesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'docente');

      // Contar materias
      const { count: materiasCount } = await supabase
        .from('materias')
        .select('*', { count: 'exact', head: true });

      // Contar grupos activos
      const { count: gruposCount } = await supabase
        .from('grupos')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);

      // Calcular promedio general (simulado por ahora)
      const promedioGeneral = 8.5;
      const asistenciaPromedio = 87;

      setStats({
        totalEstudiantes: estudiantesCount || 0,
        totalDocentes: docentesCount || 0,
        totalMaterias: materiasCount || 0,
        totalGrupos: gruposCount || 0,
        promedioGeneral,
        asistenciaPromedio,
      });

      // Datos para gráficas (simulados - después conectar con datos reales)
      setChartData({
        materiasPopulares: [
          { name: 'Programación I', estudiantes: 45 },
          { name: 'Cálculo', estudiantes: 38 },
          { name: 'Bases de Datos', estudiantes: 42 },
          { name: 'Redes', estudiantes: 35 },
          { name: 'Desarrollo Web', estudiantes: 48 },
        ],
        distribucionCalificaciones: [
          { name: '10', value: 15 },
          { name: '9-9.9', value: 25 },
          { name: '8-8.9', value: 30 },
          { name: '7-7.9', value: 20 },
          { name: '6-6.9', value: 10 },
        ],
        tendenciaAsistencia: [
          { mes: 'Ene', porcentaje: 85 },
          { mes: 'Feb', porcentaje: 87 },
          { mes: 'Mar', porcentaje: 89 },
          { mes: 'Abr', porcentaje: 86 },
          { mes: 'May', porcentaje: 88 },
          { mes: 'Jun', porcentaje: 90 },
        ],
      });

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
            Bienvenido, {profile?.nombre}
          </h1>
          <p className="text-muted-foreground text-lg">
            Panel de control administrativo - Vista general del sistema
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <StatCard
            title="Total Estudiantes"
            value={stats.totalEstudiantes}
            icon={Users}
            trend="+5% vs mes anterior"
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
            value={stats.promedioGeneral.toFixed(1)}
            icon={Award}
            trend="+0.3 vs mes anterior"
            color="yellow"
          />
          <StatCard
            title="Asistencia Promedio"
            value={`${stats.asistenciaPromedio}%`}
            icon={Clock}
            trend="+2% vs mes anterior"
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
                onClick={() => navigate('/admin/reportes')} 
                className="h-20 flex flex-col gap-2"
                variant="outline"
              >
                <BarChart3 className="h-6 w-6" />
                <span>Ver Reportes</span>
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.materiasPopulares}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="estudiantes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribución de Calificaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Calificaciones</CardTitle>
              <CardDescription>Rangos de calificaciones del semestre</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.distribucionCalificaciones}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.distribucionCalificaciones.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tendencia de Asistencia */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Asistencia</CardTitle>
            <CardDescription>Porcentaje mensual de asistencia general</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.tendenciaAsistencia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="porcentaje" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Asistencia (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}