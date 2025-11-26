// =========================================
// src/pages/docente/GrupoDetalle.jsx
// Vista detallada de un grupo específico para el docente
// =========================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Plus,
  Eye,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';

export default function DocenteGrupoDetalle() {
  const { grupoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [grupoInfo, setGrupoInfo] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [sesiones, setSesiones] = useState([]);

  useEffect(() => {
    cargarDatosGrupo();
  }, [grupoId]);

  const cargarDatosGrupo = async () => {
    try {
      setLoading(true);

      // Cargar información del grupo
      const { data: grupo, error: grupoError } = await supabase
        .from('grupos')
        .select(`
          *,
          materias (nombre, codigo, creditos, descripcion)
        `)
        .eq('id', grupoId)
        .single();

      if (grupoError) throw grupoError;

      // Verificar que el docente es el propietario
      if (grupo.docente_id !== user.id) {
        throw new Error('No tienes permiso para ver este grupo');
      }

      setGrupoInfo(grupo);

      // Cargar estudiantes inscritos
      // Primero obtener las inscripciones
      const { data: inscripciones, error: inscripcionesError } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('grupo_id', grupoId)
        .eq('estado', 'activo');

      if (inscripcionesError) throw inscripcionesError;

      // Luego obtener los perfiles de los estudiantes
      if (inscripciones && inscripciones.length > 0) {
        const estudiantesIds = inscripciones
          .map(i => i.estudiante_id)
          .filter(id => id != null); // Filtrar IDs nulos

        if (estudiantesIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, nombre, apellido, matricula, email')
            .in('user_id', estudiantesIds);

          if (profilesError) {
            console.error('Error obteniendo perfiles:', profilesError);
            // Continuar sin perfiles en lugar de fallar completamente
            setEstudiantes(inscripciones.map(inscripcion => ({
              ...inscripcion,
              profiles: null
            })));
          } else {
            // Combinar inscripciones con perfiles
            const estudiantesConPerfiles = inscripciones.map(inscripcion => ({
              ...inscripcion,
              profiles: profiles?.find(p => p.user_id === inscripcion.estudiante_id) || null
            }));

            setEstudiantes(estudiantesConPerfiles);
          }
        } else {
          // Si no hay IDs válidos, establecer inscripciones sin perfiles
          setEstudiantes(inscripciones.map(inscripcion => ({
            ...inscripcion,
            profiles: null
          })));
        }
      } else {
        setEstudiantes([]);
      }

      // Cargar sesiones de clase
      const { data: sesionesData, error: sesionesError } = await supabase
        .from('sesiones_clase')
        .select('*')
        .eq('grupo_id', grupoId)
        .order('fecha', { ascending: false });

      // Verificar y actualizar el estado real del QR para cada sesión
      // (qr_activo puede estar desactualizado si el QR expiró)
      if (sesionesData) {
        const ahora = new Date();
        sesionesData.forEach(sesion => {
          // Si qr_activo es true pero el QR expiró, considerarlo inactivo
          if (sesion.qr_activo && sesion.qr_expira_at) {
            const expiraEn = new Date(sesion.qr_expira_at);
            if (ahora > expiraEn) {
              sesion.qr_activo = false;
            }
          }
        });
      }

      if (sesionesError) throw sesionesError;
      setSesiones(sesionesData || []);

    } catch (error) {
      console.error('Error cargando datos del grupo:', error);
      alert(error.message);
      navigate('/docente/grupos');
    } finally {
      setLoading(false);
    }
  };

  const crearNuevaSesion = async () => {
    try {
      const nuevaSesion = {
        grupo_id: grupoId,
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: new Date().toTimeString().split(' ')[0].substring(0, 5),
        tema: `Clase del ${new Date().toLocaleDateString('es-MX')}`,
        token_sesion: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        expira_en: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 horas de validez por defecto
      };

      const { data, error } = await supabase
        .from('sesiones_clase')
        .insert([nuevaSesion])
        .select()
        .single();

      if (error) throw error;

      // Navegar a la página de asistencia
      navigate(`/docente/asistencia/${data.id}`);
    } catch (error) {
      console.error('Error creando sesión:', error);
      alert('Error al crear la sesión de clase');
    }
  };

  const eliminarSesion = async (sesionId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta sesión? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sesiones_clase')
        .delete()
        .eq('id', sesionId);

      if (error) throw error;

      // Actualizar la lista de sesiones
      setSesiones(sesiones.filter(s => s.id !== sesionId));
    } catch (error) {
      console.error('Error eliminando sesión:', error);
      alert('Error al eliminar la sesión');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información del grupo...</p>
        </div>
      </div>
    );
  }

  if (!grupoInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Grupo no encontrado</h2>
            <p className="text-muted-foreground mb-4">
              El grupo que buscas no existe o no tienes permiso para verlo
            </p>
            <Button onClick={() => navigate('/docente/grupos')}>
              Volver a Mis Grupos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container flex h-16 items-center px-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/docente/grupos')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Mis Grupos
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <CardTitle className="text-3xl">
                      {grupoInfo.materias?.nombre}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <Badge variant="outline" className="text-sm">
                      {grupoInfo.materias?.codigo}
                    </Badge>
                    <Badge className="text-sm">
                      {grupoInfo.materias?.creditos} créditos
                    </Badge>
                    <Badge variant="secondary" className="text-sm">
                      {grupoInfo.periodo}
                    </Badge>
                  </div>
                </div>
                <Button onClick={crearNuevaSesion} className="gap-2">
                  <QrCode className="h-4 w-4" />
                  Nueva Sesión / QR
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                {grupoInfo.horario && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{grupoInfo.horario}</span>
                  </div>
                )}
                {grupoInfo.salon && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Salón: {grupoInfo.salon}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{estudiantes.length} estudiantes inscritos</span>
                </div>
              </div>
              {grupoInfo.materias?.descripcion && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{grupoInfo.materias.descripcion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="estudiantes" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="estudiantes" className="gap-2">
                <Users className="h-4 w-4" />
                Estudiantes
              </TabsTrigger>
              <TabsTrigger value="sesiones" className="gap-2">
                <Calendar className="h-4 w-4" />
                Sesiones
              </TabsTrigger>
              <TabsTrigger value="calificaciones" className="gap-2">
                <Award className="h-4 w-4" />
                Calificaciones
              </TabsTrigger>
            </TabsList>

            {/* Tab: Estudiantes */}
            <TabsContent value="estudiantes">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Lista de Estudiantes</CardTitle>
                      <CardDescription>
                        {estudiantes.length} estudiantes inscritos en este grupo
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {estudiantes.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Sin estudiantes</h3>
                      <p className="text-muted-foreground">
                        Aún no hay estudiantes inscritos en este grupo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {estudiantes.map((inscripcion) => {
                        const estudiante = inscripcion.profiles;
                        return (
                          <div
                            key={inscripcion.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-lg">
                                {estudiante?.nombre?.[0]}{estudiante?.apellido?.[0]}
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {estudiante?.nombre} {estudiante?.apellido}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {estudiante?.matricula}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">Activo</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Sesiones */}
            <TabsContent value="sesiones">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Sesiones de Clase</CardTitle>
                      <CardDescription>
                        {sesiones.length} sesiones registradas
                      </CardDescription>
                    </div>
                    <Button onClick={crearNuevaSesion} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nueva Sesión
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {sesiones.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Sin sesiones</h3>
                      <p className="text-muted-foreground mb-4">
                        Aún no has creado sesiones de clase
                      </p>
                      <Button onClick={crearNuevaSesion} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Crear Primera Sesión
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sesiones.map((sesion) => (
                        <div
                          key={sesion.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${sesion.qr_activo ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                              }`}>
                              {sesion.qr_activo ? (
                                <CheckCircle className="w-6 h-6" />
                              ) : (
                                <Calendar className="w-6 h-6" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">
                                {new Date(sesion.fecha).toLocaleDateString('es-MX', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {sesion.tema || 'Sin tema definido'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {sesion.qr_activo && (
                              <Badge variant="default" className="animate-pulse">
                                QR Activo
                              </Badge>
                            )}
                            <Button
                              onClick={() => navigate(`/docente/asistencia/${sesion.id}`)}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Ver Asistencia
                            </Button>
                            <Button
                              onClick={() => eliminarSesion(sesion.id)}
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Calificaciones */}
            <TabsContent value="calificaciones">
              <Card>
                <CardHeader>
                  <CardTitle>Calificaciones</CardTitle>
                  <CardDescription>Gestión de calificaciones del grupo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Próximamente</h3>
                    <p className="text-muted-foreground">
                      El módulo de calificaciones estará disponible pronto
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}