// =========================================
// src/pages/docente/Calificaciones.jsx
// Vista para registrar calificaciones (Docente)
// =========================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { calificacionesService } from '../../services/calificaciones.service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Award,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

// Schema de validación
const calificacionSchema = z.object({
  tipo: z.enum(['examen', 'tarea', 'proyecto', 'participacion', 'exposicion']),
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  valor: z.number().min(0, 'El valor debe ser positivo'),
  valor_maximo: z.number().min(1, 'El valor máximo debe ser al menos 1'),
  peso: z.number().min(0.1).max(100, 'El peso debe estar entre 0.1 y 100'),
  fecha: z.string(),
  comentarios: z.string().optional(),
});

export default function DocenteCalificaciones() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const grupoIdParam = searchParams.get('grupo');

  const [misGrupos, setMisGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(grupoIdParam || '');
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [calificaciones, setCalificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCalificacion, setEditingCalificacion] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [calificacionToDelete, setCalificacionToDelete] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(calificacionSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      valor_maximo: 10,
      peso: 10,
    }
  });

  const selectedTipo = watch('tipo');

  useEffect(() => {
    if (user) {
      loadMisGrupos();
    }
  }, [user]);

  useEffect(() => {
    if (grupoSeleccionado) {
      loadEstudiantes();
    }
  }, [grupoSeleccionado]);

  useEffect(() => {
    if (estudianteSeleccionado) {
      loadCalificaciones();
    }
  }, [estudianteSeleccionado]);

  const loadMisGrupos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grupos')
        .select(`
          *,
          materias (nombre, codigo)
        `)
        .eq('docente_id', user.id)
        .eq('activo', true)
        .order('periodo', { ascending: false });

      if (error) throw error;
      setMisGrupos(data || []);
      
      if (grupoIdParam && data?.length > 0) {
        setGrupoSeleccionado(grupoIdParam);
      }
    } catch (error) {
      console.error('Error cargando grupos:', error);
      setMessage({ type: 'error', text: 'Error al cargar los grupos' });
    } finally {
      setLoading(false);
    }
  };

  const loadEstudiantes = async () => {
    try {
      // Primero obtener inscripciones
      const { data: inscripciones, error: inscError } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('grupo_id', grupoSeleccionado)
        .eq('estado', 'activo');

      if (inscError) throw inscError;

      console.log('📋 Inscripciones encontradas:', inscripciones);

      // Luego obtener los perfiles de los estudiantes
      const estudiantesIds = inscripciones?.map(i => i.estudiante_id) || [];
      
      if (estudiantesIds.length === 0) {
        setEstudiantes([]);
        return;
      }

      console.log('🔍 Buscando perfiles para IDs:', estudiantesIds);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nombre, apellido, matricula, foto_url')
        .in('user_id', estudiantesIds)
        .order('apellido', { ascending: true });

      if (profilesError) throw profilesError;

      console.log('👤 Perfiles encontrados:', profiles);

      // Combinar inscripciones con profiles y calcular promedios usando PostgreSQL
      const estudiantesConPromedio = await Promise.all(
        (inscripciones || []).map(async (insc) => {
          const profile = profiles?.find(p => p.user_id === insc.estudiante_id);
          
          console.log(`Estudiante ${insc.estudiante_id}:`, profile);
          
          // Usar función que retorna calificaciones y promedio calculado en PostgreSQL
          const { data: cals, promedio } = await calificacionesService.obtenerCalificacionesPorGrupo(insc.id);
          
          return {
            ...insc,
            profiles: profile || {
              user_id: insc.estudiante_id,
              nombre: 'Usuario',
              apellido: 'Sin perfil',
              matricula: 'N/A'
            },
            promedio: promedio || 0
          };
        })
      );

      // Ordenar por apellido
      estudiantesConPromedio.sort((a, b) => {
        const apellidoA = a.profiles?.apellido || '';
        const apellidoB = b.profiles?.apellido || '';
        return apellidoA.localeCompare(apellidoB);
      });

      console.log('✅ Estudiantes con promedio:', estudiantesConPromedio);

      setEstudiantes(estudiantesConPromedio);
    } catch (error) {
      console.error('❌ Error cargando estudiantes:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error al cargar estudiantes. Verifica la consola.' 
      });
    }
  };

  const loadCalificaciones = async () => {
    try {
      const { data, error, promedio } = await calificacionesService.obtenerCalificacionesPorGrupo(
        estudianteSeleccionado.id
      );

      if (error) throw error;
      setCalificaciones(data || []);
      // El promedio ya viene calculado desde PostgreSQL
    } catch (error) {
      console.error('Error cargando calificaciones:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      const calificacionData = {
        ...data,
        inscripcion_id: estudianteSeleccionado.id,
      };

      if (editingCalificacion) {
        const { error } = await calificacionesService.actualizarCalificacion(
          editingCalificacion.id,
          calificacionData
        );
        if (error) throw error;
        setMessage({ type: 'success', text: 'Calificación actualizada exitosamente' });
      } else {
        const { error } = await calificacionesService.crearCalificacion(calificacionData);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Calificación registrada exitosamente' });
      }

      loadCalificaciones();
      loadEstudiantes(); // Actualizar promedios
      handleCloseDialog();
    } catch (error) {
      console.error('Error guardando calificación:', error);
      setMessage({ type: 'error', text: 'Error al guardar la calificación' });
    }
  };

  const handleEdit = (calificacion) => {
    setEditingCalificacion(calificacion);
    setValue('tipo', calificacion.tipo);
    setValue('nombre', calificacion.nombre);
    setValue('valor', Number(calificacion.valor));
    setValue('valor_maximo', Number(calificacion.valor_maximo));
    setValue('peso', Number(calificacion.peso));
    setValue('fecha', calificacion.fecha);
    setValue('comentarios', calificacion.comentarios || '');
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      const { error } = await calificacionesService.eliminarCalificacion(calificacionToDelete.id);
      if (error) throw error;

      setMessage({ type: 'success', text: 'Calificación eliminada exitosamente' });
      loadCalificaciones();
      loadEstudiantes();
      setDeleteDialogOpen(false);
      setCalificacionToDelete(null);
    } catch (error) {
      console.error('Error eliminando calificación:', error);
      setMessage({ type: 'error', text: 'Error al eliminar la calificación' });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCalificacion(null);
    reset({
      fecha: new Date().toISOString().split('T')[0],
      valor_maximo: 10,
      peso: 10,
    });
  };

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

  const grupoActual = misGrupos.find(g => g.id === grupoSeleccionado);
  // Obtener promedio del estudiante seleccionado (ya calculado en PostgreSQL)
  const promedioPonderado = estudianteSeleccionado?.promedio || 0;

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
              Registro de Calificaciones
            </h1>
            <p className="text-muted-foreground">
              Registra y gestiona las calificaciones de tus estudiantes
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

          {/* Selector de Grupo */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Grupo</CardTitle>
              <CardDescription>Elige el grupo para registrar calificaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={grupoSeleccionado} onValueChange={setGrupoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {misGrupos.map(grupo => (
                    <SelectItem key={grupo.id} value={grupo.id}>
                      {grupo.materias?.nombre} - {grupo.periodo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {grupoSeleccionado && (
            <>
              {/* Lista de Estudiantes */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Estudiantes de {grupoActual?.materias?.nombre}</CardTitle>
                      <CardDescription>
                        {estudiantes.length} estudiantes inscritos
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {grupoActual?.periodo}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="loading-spinner"></div>
                    </div>
                  ) : estudiantes.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No hay estudiantes inscritos</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {estudiantes.map((estudiante) => {
                        const profile = estudiante.profiles || {};
                        const nombre = profile.nombre || 'Sin';
                        const apellido = profile.apellido || 'nombre';
                        const matricula = profile.matricula || 'N/A';
                        const iniciales = `${nombre[0] || 'S'}${apellido[0] || 'N'}`;
                        
                        return (
                          <div
                            key={estudiante.id}
                            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                              estudianteSeleccionado?.id === estudiante.id
                                ? 'bg-primary/5 border-primary'
                                : 'hover:bg-accent'
                            }`}
                            onClick={() => setEstudianteSeleccionado(estudiante)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-lg">
                                {iniciales}
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {nombre} {apellido}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {matricula}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${getPromedioColor(estudiante.promedio)}`}>
                                {estudiante.promedio > 0 ? estudiante.promedio : '--'}
                              </p>
                              <p className="text-xs text-muted-foreground">Promedio</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Calificaciones del Estudiante Seleccionado */}
              {estudianteSeleccionado && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>
                          Calificaciones de {estudianteSeleccionado.profiles?.nombre || 'Estudiante'}{' '}
                          {estudianteSeleccionado.profiles?.apellido || ''}
                        </CardTitle>
                        <CardDescription>
                          Matrícula: {estudianteSeleccionado.profiles?.matricula || 'N/A'} | 
                          Promedio ponderado: 
                          <span className={`ml-2 text-lg font-bold ${getPromedioColor(parseFloat(promedioPonderado))}`}>
                            {promedioPonderado > 0 ? promedioPonderado : '--'}
                          </span>
                        </CardDescription>
                      </div>
                      <Button onClick={() => setDialogOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nueva Calificación
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {calificaciones.length === 0 ? (
                      <div className="text-center py-12">
                        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          Sin calificaciones registradas
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Agrega la primera calificación para este estudiante
                        </p>
                        <Button onClick={() => setDialogOpen(true)} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Agregar Calificación
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead className="text-center">Calificación</TableHead>
                              <TableHead className="text-center">Peso (%)</TableHead>
                              <TableHead>Fecha</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {calificaciones.map((cal) => (
                              <TableRow key={cal.id}>
                                <TableCell>
                                  <Badge variant={getTipoBadgeVariant(cal.tipo)}>
                                    {getTipoLabel(cal.tipo)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{cal.nombre}</p>
                                    {cal.comentarios && (
                                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                                        {cal.comentarios}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="text-lg font-bold">
                                    {cal.valor} / {cal.valor_maximo}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline">{cal.peso}%</Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(cal.fecha).toLocaleDateString('es-MX')}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(cal)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setCalificacionToDelete(cal);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      {/* Dialog Crear/Editar Calificación */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingCalificacion ? 'Editar Calificación' : 'Nueva Calificación'}
            </DialogTitle>
            <DialogDescription>
              {estudianteSeleccionado && (
                <>
                  Para: {estudianteSeleccionado.profiles?.nombre || 'Estudiante'}{' '}
                  {estudianteSeleccionado.profiles?.apellido || ''} 
                  {' '}({estudianteSeleccionado.profiles?.matricula || 'N/A'})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select 
                    value={selectedTipo} 
                    onValueChange={(value) => setValue('tipo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="examen">Examen</SelectItem>
                      <SelectItem value="tarea">Tarea</SelectItem>
                      <SelectItem value="proyecto">Proyecto</SelectItem>
                      <SelectItem value="participacion">Participación</SelectItem>
                      <SelectItem value="exposicion">Exposición</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.tipo && (
                    <p className="text-sm text-destructive">{errors.tipo.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    {...register('fecha')}
                  />
                  {errors.fecha && (
                    <p className="text-sm text-destructive">{errors.fecha.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la Evaluación *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Examen Parcial 1, Tarea de investigación..."
                  {...register('nombre')}
                />
                {errors.nombre && (
                  <p className="text-sm text-destructive">{errors.nombre.message}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Calificación *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    placeholder="8.5"
                    {...register('valor', { valueAsNumber: true })}
                  />
                  {errors.valor && (
                    <p className="text-sm text-destructive">{errors.valor.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_maximo">Valor Máximo *</Label>
                  <Input
                    id="valor_maximo"
                    type="number"
                    step="0.01"
                    placeholder="10"
                    {...register('valor_maximo', { valueAsNumber: true })}
                  />
                  {errors.valor_maximo && (
                    <p className="text-sm text-destructive">{errors.valor_maximo.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="peso">Peso (%) *</Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.1"
                    placeholder="10"
                    {...register('peso', { valueAsNumber: true })}
                  />
                  {errors.peso && (
                    <p className="text-sm text-destructive">{errors.peso.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comentarios">Comentarios (opcional)</Label>
                <textarea
                  id="comentarios"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Observaciones adicionales..."
                  {...register('comentarios')}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : editingCalificacion ? 'Actualizar' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar calificación?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará la calificación{' '}
              <strong>{calificacionToDelete?.nombre}</strong> permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}