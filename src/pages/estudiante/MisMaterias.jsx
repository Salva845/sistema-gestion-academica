// =========================================
// src/pages/estudiante/MisMaterias.jsx
// Vista completa de materias e inscripción para estudiantes
// =========================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
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
  Search,
  Plus,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Users,
  Award,
  X,
} from 'lucide-react';

export default function MisMaterias() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [misInscripciones, setMisInscripciones] = useState([]);
  const [gruposDisponibles, setGruposDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('all');
  const [inscribirDialog, setInscribirDialog] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  // Controlar pestaña activa para evitar manipulación directa del DOM
  const [activeTab, setActiveTab] = useState('inscritas');
  // Detalle por URL
  const { id } = useParams();
  const [selectedInscripcion, setSelectedInscripcion] = useState(null);
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false);

  // Helper para obtener nombre completo del docente con varios formatos posibles
  const getDocenteFullName = (docente) => {
    if (!docente) return 'Sin asignar';
    // Si viene como array (a veces PostgREST devuelve arrays en joins compound)
    const d = Array.isArray(docente) ? docente[0] : docente;
    if (!d) return 'Sin asignar';
    if (d.nombre || d.apellido) return `${d.nombre || ''} ${d.apellido || ''}`.trim();
    // Algunas tablas usan user_id o nombre_completo
    if (d.nombre_completo) return d.nombre_completo;
    if (d.user_id && typeof d.user_id === 'object') {
      return `${d.user_id.nombre || ''} ${d.user_id.apellido || ''}`.trim();
    }
    return 'Sin asignar';
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Si la URL contiene un id, abrir el diálogo de detalle cuando las inscripciones estén cargadas
  useEffect(() => {
    if (id) {
      // Si ya tenemos las inscripciones cargadas, buscar localmente
      const found = misInscripciones.find(i => String(i.id) === String(id));
      if (found) {
        setSelectedInscripcion(found);
        setActiveTab('inscritas');
        setDetalleDialogOpen(true);
      } else {
        // Intentar cargar la inscripcion por id desde el servidor
        (async () => {
          try {
            const { data, error } = await supabase
              .from('inscripciones')
              .select(`
                *,
                grupos (
                  *,
                  materias (nombre, codigo, creditos),
                  docente:profiles!docente_id (nombre, apellido)
                )
              `)
              .eq('id', id)
              .single();

            if (error) throw error;
            setSelectedInscripcion(data || null);
            setActiveTab('inscritas');
            setDetalleDialogOpen(Boolean(data));
          } catch (err) {
            console.error('Error cargando inscripcion por id:', err);
          }
        })();
      }
    } else {
      setSelectedInscripcion(null);
      setDetalleDialogOpen(false);
    }
  }, [id, misInscripciones]);

  const loadData = async () => {
    try {
  setLoading(true);
      await Promise.all([
        loadMisInscripciones(),
        loadGruposDisponibles(),
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMisInscripciones = async () => {
    try {
      const { data, error } = await supabase
        .from('inscripciones')
        .select(`
          *,
          grupos (
            *,
            materias (nombre, codigo, creditos),
            docente:profiles!docente_id (nombre, apellido)
          )
        `)
        .eq('estudiante_id', user.id)
        .eq('estado', 'activo');

      if (error) throw error;
      
      setMisInscripciones(data || []);
    } catch (error) {
      console.error('Error cargando inscripciones:', error);
    }
  };

  const loadGruposDisponibles = async () => {
    try {
        // Obtener IDs de grupos ya inscritos (solo activos)
        const { data: inscripciones } = await supabase
        .from('inscripciones')
        .select('grupo_id')
        .eq('estudiante_id', user.id)
        .eq('estado', 'activo');

        const gruposInscritos = inscripciones?.map(i => i.grupo_id) || [];

        // Obtener todos los grupos activos
        let query = supabase
        .from('grupos')
        .select(`
            *,
            materias (nombre, codigo, creditos, semestre),
            docente:profiles!docente_id (nombre, apellido)
        `)
        .eq('activo', true)
        .order('periodo', { ascending: false });

        // Excluir grupos ya inscritos
        if (gruposInscritos.length > 0) {
        query = query.not('id', 'in', `(${gruposInscritos.join(',')})`);
        }

  const { data: grupos, error } = await query;
  if (error) throw error;

        // Obtener el conteo de inscripciones activas para cada grupo
        const gruposIds = grupos?.map(g => g.id) || [];
        
        if (gruposIds.length === 0) {
        setGruposDisponibles([]);
        return;
        }

        const { data: conteos, error: conteoError } = await supabase
        .from('inscripciones')
        .select('grupo_id')
        .in('grupo_id', gruposIds)
        .eq('estado', 'activo');

        if (conteoError) throw conteoError;

        // Crear mapa de conteos
        const conteoMap = {};
        conteos?.forEach(insc => {
        conteoMap[insc.grupo_id] = (conteoMap[insc.grupo_id] || 0) + 1;
    });

        // Combinar datos y filtrar por cupo
        const gruposConCupo = (grupos || [])
        .map(grupo => ({
            ...grupo,
            inscripciones: [{ count: conteoMap[grupo.id] || 0 }]
        }))
        .filter(grupo => {
            const ocupacion = grupo.inscripciones[0].count;
            return ocupacion < grupo.cupo_maximo;
        });

        setGruposDisponibles(gruposConCupo);
    } catch (error) {
        console.error('Error cargando grupos disponibles:', error);
    }
};

const handleInscribir = async () => {
  if (!selectedGrupo) return;

  try {
    // Primero verificar si ya existe una inscripción (activa o abandonada)
    const { data: inscripcionExistente, error: checkError } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('estudiante_id', user.id)
      .eq('grupo_id', selectedGrupo.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 es "no se encontró", cualquier otro error es problema
      throw checkError;
    }

    let error;

    if (inscripcionExistente) {
      // Si existe, verificar su estado
      if (inscripcionExistente.estado === 'activo') {
        setMessage({ 
          type: 'error', 
          text: 'Ya estás inscrito en esta materia' 
        });
        setInscribirDialog(false);
        return;
      }

      // Si está abandonada, reactivarla
      const { error: updateError } = await supabase
        .from('inscripciones')
        .update({ 
          estado: 'activo'
        })
        .eq('id', inscripcionExistente.id);

      error = updateError;
    } else {
      // Si no existe, crear nueva inscripción
      const { error: insertError } = await supabase
        .from('inscripciones')
        .insert([{
          estudiante_id: user.id,
          grupo_id: selectedGrupo.id,
          estado: 'activo',
        }]);

      error = insertError;
    }

    if (error) throw error;

    setMessage({ 
      type: 'success', 
      text: '¡Te has inscrito exitosamente a la materia!' 
    });
    setInscribirDialog(false);
    setSelectedGrupo(null);
    
    // Recargar datos
    setTimeout(() => {
      loadData();
      setMessage({ type: '', text: '' });
    }, 2000);
  } catch (error) {
    console.error('Error inscribiendo:', error);
    setMessage({ 
      type: 'error', 
      text: 'Error al inscribirse. Verifica que el grupo tenga cupo disponible.' 
    });
  }
};

  const handleDesinscribir = async (inscripcionId, nombreMateria) => {
    if (!confirm(`¿Estás seguro de que quieres darte de baja de ${nombreMateria}?`)) return;

    try {
      const { error } = await supabase
        .from('inscripciones')
        .update({ estado: 'abandonado' })
        .eq('id', inscripcionId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Te has dado de baja exitosamente' });
      
      setTimeout(() => {
        loadData();
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      console.error('Error desinscribiendo:', error);
      setMessage({ type: 'error', text: 'Error al darse de baja' });
    }
  };

  // Obtener periodos únicos
  const periodos = [...new Set([
    ...misInscripciones.map(i => i.grupos?.periodo),
    ...gruposDisponibles.map(g => g.periodo)
  ].filter(Boolean))].sort().reverse();

  // Filtrar mis materias
  const filteredInscripciones = misInscripciones.filter((inscripcion) => {
    const grupo = inscripcion.grupos;
    const matchesSearch = 
      grupo?.materias?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grupo?.materias?.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPeriodo = periodoFilter === 'all' || grupo?.periodo === periodoFilter;
    
    return matchesSearch && matchesPeriodo;
  });

  // Filtrar grupos disponibles
  const filteredDisponibles = gruposDisponibles.filter((grupo) => {
    const matchesSearch = 
      grupo.materias?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grupo.materias?.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPeriodo = periodoFilter === 'all' || grupo.periodo === periodoFilter;
    
    return matchesSearch && matchesPeriodo;
  });

  // Estadísticas
  const stats = {
    totalMaterias: misInscripciones.length,
    totalCreditos: misInscripciones.reduce((sum, i) => sum + (i.grupos?.materias?.creditos || 0), 0),
    gruposDisponibles: gruposDisponibles.length,
  };

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
              Mis Materias
            </h1>
            <p className="text-muted-foreground">
              Gestiona tus inscripciones y explora materias disponibles
            </p>
          </div>

          {/* Message Alert */}
          {message.text && (
            <div
              className={`flex items-center gap-2 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-900 border border-green-200 dark:bg-green-950 dark:text-green-100'
                  : 'bg-red-50 text-red-900 border border-red-200 dark:bg-red-950 dark:text-red-100'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Materias Inscritas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalMaterias}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  materias cursando
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Total Créditos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalCreditos}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  créditos este semestre
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.gruposDisponibles}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  grupos para inscribirse
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="inscritas" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Mis Materias ({stats.totalMaterias})
              </TabsTrigger>
              <TabsTrigger value="disponibles" className="gap-2">
                <Plus className="h-4 w-4" />
                Inscribir Materias ({stats.gruposDisponibles})
              </TabsTrigger>
            </TabsList>

            {/* Search and Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre de materia o código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {periodos.length > 1 && (
                    <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                      <SelectTrigger className="w-[180px]">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Periodo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los periodos</SelectItem>
                        {periodos.map(periodo => (
                          <SelectItem key={periodo} value={periodo}>{periodo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tab: Mis Materias Inscritas */}
            <TabsContent value="inscritas" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="loading-spinner"></div>
                </div>
              ) : filteredInscripciones.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center space-y-4">
                      <BookOpen className="h-16 w-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          {searchTerm || periodoFilter !== 'all'
                            ? 'No se encontraron materias'
                            : 'No tienes materias inscritas'}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {!searchTerm && periodoFilter === 'all' &&
                            'Explora las materias disponibles y comienza tu inscripción'}
                        </p>
                      </div>
                      {!searchTerm && periodoFilter === 'all' && (
                        <Button onClick={() => setActiveTab('disponibles')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Ver Materias Disponibles
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredInscripciones.map((inscripcion) => {
                    const grupo = inscripcion.grupos;
                    const materia = grupo?.materias;
                    const docente = grupo?.docente;
                    
                    return (
                      <Card key={inscripcion.id} className="hover:shadow-lg transition-all">
                        <CardHeader>
                          <div className="space-y-3">
                            <CardTitle className="text-lg leading-tight">
                              {materia?.nombre}
                            </CardTitle>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs font-mono">
                                {materia?.codigo}
                              </Badge>
                              <Badge className="text-xs">
                                {materia?.creditos} créditos
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {grupo?.periodo}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <UserCheck className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium">
                                  {getDocenteFullName(docente)}
                                </p>
                                <p className="text-xs text-muted-foreground">Docente</p>
                              </div>
                            </div>

                            {grupo?.horario && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4 flex-shrink-0" />
                                <span>{grupo.horario}</span>
                              </div>
                            )}

                            {grupo?.salon && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span>Salón: {grupo.salon}</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t space-y-2">
                            <Button 
                              className="w-full" 
                              onClick={() => navigate(`/estudiante/materias/${inscripcion.id}`)}
                            >
                              Ver Detalles
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDesinscribir(inscripcion.id, materia?.nombre)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Darme de Baja
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Tab: Grupos Disponibles para Inscribir */}
            <TabsContent value="disponibles" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="loading-spinner"></div>
                </div>
              ) : filteredDisponibles.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center space-y-4">
                      <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          {searchTerm || periodoFilter !== 'all'
                            ? 'No se encontraron grupos disponibles'
                            : 'No hay grupos disponibles'}
                        </h3>
                        <p className="text-muted-foreground">
                          {searchTerm || periodoFilter !== 'all'
                            ? 'Intenta con otros criterios de búsqueda'
                            : 'No hay materias disponibles para inscripción en este momento'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDisponibles.map((grupo) => {
                    const materia = grupo.materias;
                    const docente = grupo.docente;
                    const ocupacion = grupo.inscripciones?.[0]?.count || 0;
                    const disponibles = grupo.cupo_maximo - ocupacion;
                    const porcentaje = Math.round((ocupacion / grupo.cupo_maximo) * 100);
                    
                    return (
                      <Card key={grupo.id} className="hover:shadow-lg transition-all">
                        <CardHeader>
                          <div className="space-y-3">
                            <CardTitle className="text-lg leading-tight">
                              {materia?.nombre}
                            </CardTitle>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs font-mono">
                                {materia?.codigo}
                              </Badge>
                              <Badge className="text-xs">
                                {materia?.creditos} créditos
                              </Badge>
                              {materia?.semestre && (
                                <Badge variant="secondary" className="text-xs">
                                  {materia.semestre}° sem
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <UserCheck className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium">
                                    {getDocenteFullName(docente)}
                                  </p>
                                <p className="text-xs text-muted-foreground">Docente</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>Periodo: {grupo.periodo}</span>
                            </div>

                            {grupo.horario && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4 flex-shrink-0" />
                                <span>{grupo.horario}</span>
                              </div>
                            )}

                            {grupo.salon && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span>Salón: {grupo.salon}</span>
                              </div>
                            )}
                          </div>

                          {/* Cupo disponible */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Cupo:</span>
                              </div>
                              <span className={`font-medium ${
                                disponibles <= 5 ? 'text-red-600' :
                                disponibles <= 10 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {disponibles} lugares
                              </span>
                            </div>

                            {/* Barra de progreso */}
                            <div className="space-y-1">
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
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{ocupacion} inscritos</span>
                                <span>{grupo.cupo_maximo} máximo</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t">
                            <Button 
                              className="w-full gap-2" 
                              onClick={() => {
                                setSelectedGrupo(grupo);
                                setInscribirDialog(true);
                              }}
                              disabled={disponibles === 0}
                            >
                              <Plus className="h-4 w-4" />
                              {disponibles === 0 ? 'Grupo Lleno' : 'Inscribirme'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Dialog Confirmar Inscripción */}
      <Dialog open={inscribirDialog} onOpenChange={setInscribirDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar Inscripción</DialogTitle>
            <DialogDescription>
              Revisa la información antes de confirmar tu inscripción
            </DialogDescription>
          </DialogHeader>
          {selectedGrupo && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <p className="font-semibold text-lg">{selectedGrupo.materias?.nombre}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedGrupo.materias?.codigo}
                  </Badge>
                  <Badge className="text-xs">
                    {selectedGrupo.materias?.creditos} créditos
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Docente:</span>
                  <span className="font-medium">
                    {getDocenteFullName(selectedGrupo.docente)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Periodo:</span>
                  <span className="font-medium">{selectedGrupo.periodo}</span>
                </div>
                {selectedGrupo.horario && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horario:</span>
                    <span className="font-medium">{selectedGrupo.horario}</span>
                  </div>
                )}
                {selectedGrupo.salon && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salón:</span>
                    <span className="font-medium">{selectedGrupo.salon}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lugares disponibles:</span>
                  <span className="font-medium text-green-600">
                    {selectedGrupo.cupo_maximo - (selectedGrupo.inscripciones?.[0]?.count || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setInscribirDialog(false);
                setSelectedGrupo(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleInscribir}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Inscripción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle Inscripción (abrir desde /estudiante/materias/:id) */}
      <Dialog open={detalleDialogOpen} onOpenChange={(v) => {
        setDetalleDialogOpen(v);
        if (!v) navigate('/estudiante/materias');
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalle de Inscripción</DialogTitle>
            <DialogDescription>
              Información de la materia y grupo
            </DialogDescription>
          </DialogHeader>
          {selectedInscripcion ? (
            <div className="space-y-4 py-2">
              <div>
                <h3 className="text-lg font-semibold">{selectedInscripcion.grupos?.materias?.nombre}</h3>
                <p className="text-sm text-muted-foreground">{selectedInscripcion.grupos?.materias?.codigo} • {selectedInscripcion.grupos?.materias?.creditos} créditos</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Docente</p>
                  <p className="font-medium">{getDocenteFullName(selectedInscripcion.grupos?.docente)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Periodo</p>
                  <p className="font-medium">{selectedInscripcion.grupos?.periodo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Horario</p>
                  <p className="font-medium">{selectedInscripcion.grupos?.horario || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Salón</p>
                  <p className="font-medium">{selectedInscripcion.grupos?.salon || 'N/A'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4">Cargando...</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDetalleDialogOpen(false); navigate('/estudiante/materias'); }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}