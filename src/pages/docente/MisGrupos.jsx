// =========================================
// src/pages/docente/MisGrupos.jsx
// Vista de grupos asignados al docente
// =========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
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
  ArrowLeft,
  Search,
  Users,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  AlertCircle,
  UserCheck,
  TrendingUp,
} from 'lucide-react';

export default function MisGrupos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('all');

  useEffect(() => {
    if (user) {
      loadMisGrupos();
    }
  }, [user]);

  const loadMisGrupos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grupos')
        .select(`
          *,
          materias (nombre, codigo, creditos),
          inscripciones (count)
        `)
        .eq('docente_id', user.id)
        .order('periodo', { ascending: false });

      if (error) throw error;
      setGrupos(data || []);
    } catch (error) {
      console.error('Error cargando grupos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener periodos únicos
  const periodos = [...new Set(grupos.map(g => g.periodo))].sort().reverse();

  // Filtrar grupos
  const filteredGrupos = grupos.filter((grupo) => {
    const matchesSearch = 
      grupo.materias?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grupo.materias?.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPeriodo = periodoFilter === 'all' || grupo.periodo === periodoFilter;
    
    return matchesSearch && matchesPeriodo;
  });

  // Estadísticas
  const stats = {
    total: grupos.length,
    activos: grupos.filter(g => g.activo).length,
    totalEstudiantes: grupos.reduce((sum, g) => sum + (g.inscripciones?.[0]?.count || 0), 0),
    promedioEstudiantes: grupos.length > 0 
      ? Math.round(grupos.reduce((sum, g) => sum + (g.inscripciones?.[0]?.count || 0), 0) / grupos.length)
      : 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center px-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/docente')}
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
              Mis Grupos
            </h1>
            <p className="text-muted-foreground">
              Grupos que impartes en el sistema
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Grupos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Grupos Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.activos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Estudiantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalEstudiantes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.promedioEstudiantes}</div>
                <p className="text-xs text-muted-foreground mt-1">estudiantes/grupo</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por materia o código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los periodos</SelectItem>
                    {periodos.map(periodo => (
                      <SelectItem key={periodo} value={periodo}>{periodo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          {/* Grupos Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner"></div>
            </div>
          ) : filteredGrupos.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || periodoFilter !== 'all'
                      ? 'No se encontraron grupos'
                      : 'No tienes grupos asignados'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredGrupos.map((grupo) => {
                const ocupacion = grupo.inscripciones?.[0]?.count || 0;
                const porcentaje = Math.round((ocupacion / grupo.cupo_maximo) * 100);
                
                return (
                  <Card key={grupo.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg leading-tight mb-2">
                            {grupo.materias?.nombre}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {grupo.materias?.codigo}
                            </Badge>
                            <Badge variant={grupo.activo ? 'default' : 'secondary'} className="text-xs">
                              {grupo.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Periodo:</span>
                          <span>{grupo.periodo}</span>
                        </div>

                        {grupo.horario && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{grupo.horario}</span>
                          </div>
                        )}

                        {grupo.salon && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>Salón: {grupo.salon}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {ocupacion} / {grupo.cupo_maximo} estudiantes
                          </span>
                        </div>

                        {/* Barra de progreso */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Ocupación</span>
                            <span>{porcentaje}%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                porcentaje >= 90 ? 'bg-red-500' :
                                porcentaje >= 70 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t space-y-2">
                        <Button 
                          className="w-full" 
                          onClick={() => navigate(`/docente/grupos/${grupo.id}`)}
                        >
                          Ver Detalles
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/docente/asistencia?grupo=${grupo.id}`)}
                          >
                            Asistencia
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/docente/calificaciones?grupo=${grupo.id}`)}
                          >
                            Calificar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}