// =========================================
// src/pages/admin/Grupos.jsx
// CRUD completo de grupos con asignación de docentes
// =========================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  BookOpen,
  Clock,
  MapPin,
} from 'lucide-react';

// Schema de validación
const grupoSchema = z.object({
  materia_id: z.string().min(1, 'Selecciona una materia'),
  docente_id: z.string().min(1, 'Selecciona un docente'),
  periodo: z.string().min(4, 'Ingresa el periodo (ej: 2025-1)'),
  horario: z.string().optional(),
  salon: z.string().optional(),
  cupo_maximo: z.number().min(1).max(100, 'El cupo debe estar entre 1 y 100'),
  activo: z.boolean(),
});

export default function Grupos() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [grupoToDelete, setGrupoToDelete] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(grupoSchema),
    defaultValues: {
      activo: true,
      cupo_maximo: 30,
    }
  });

  const selectedMateria = watch('materia_id');
  const selectedDocente = watch('docente_id');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadGrupos(),
        loadMaterias(),
        loadDocentes(),
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGrupos = async () => {
    try {
      const { data, error } = await supabase
        .from('grupos')
        .select(`
          *,
          materias (nombre, codigo),
          docente:profiles!docente_id (nombre, apellido),
          inscripciones (count)
        `)
        .order('periodo', { ascending: false });

      if (error) throw error;
      setGrupos(data || []);
    } catch (error) {
      console.error('Error cargando grupos:', error);
      setMessage({ type: 'error', text: 'Error al cargar los grupos' });
    }
  };

  const loadMaterias = async () => {
    try {
      const { data, error } = await supabase
        .from('materias')
        .select('id, nombre, codigo')
        .order('nombre');

      if (error) throw error;
      setMaterias(data || []);
    } catch (error) {
      console.error('Error cargando materias:', error);
    }
  };

  const loadDocentes = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nombre, apellido, matricula')
        .eq('role', 'docente')
        .order('nombre');

      if (error) throw error;
      setDocentes(data || []);
    } catch (error) {
      console.error('Error cargando docentes:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingGrupo) {
        // Actualizar grupo
        const { error } = await supabase
          .from('grupos')
          .update(data)
          .eq('id', editingGrupo.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Grupo actualizado exitosamente' });
      } else {
        // Crear nuevo grupo
        const { error } = await supabase
          .from('grupos')
          .insert([data]);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Grupo creado exitosamente' });
      }

      loadGrupos();
      handleCloseDialog();
    } catch (error) {
      console.error('Error guardando grupo:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al guardar el grupo' 
      });
    }
  };

  const handleEdit = (grupo) => {
    setEditingGrupo(grupo);
    setValue('materia_id', grupo.materia_id);
    setValue('docente_id', grupo.docente_id);
    setValue('periodo', grupo.periodo);
    setValue('horario', grupo.horario || '');
    setValue('salon', grupo.salon || '');
    setValue('cupo_maximo', grupo.cupo_maximo);
    setValue('activo', grupo.activo);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('grupos')
        .delete()
        .eq('id', grupoToDelete.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Grupo eliminado exitosamente' });
      loadGrupos();
      setDeleteDialogOpen(false);
      setGrupoToDelete(null);
    } catch (error) {
      console.error('Error eliminando grupo:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error al eliminar el grupo. Puede tener inscripciones o sesiones asociadas.' 
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGrupo(null);
    reset({
      activo: true,
      cupo_maximo: 30,
    });
  };

  // Obtener periodos únicos
  const periodos = [...new Set(grupos.map(g => g.periodo))].sort().reverse();

  // Filtrar grupos
  const filteredGrupos = grupos.filter((grupo) => {
    const matchesSearch = 
      grupo.materias?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grupo.materias?.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grupo.profiles?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPeriodo = periodoFilter === 'all' || grupo.periodo === periodoFilter;
    
    return matchesSearch && matchesPeriodo;
  });

  // Paginación
  const totalPages = Math.ceil(filteredGrupos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentGrupos = filteredGrupos.slice(startIndex, endIndex);

  // Estadísticas
  const stats = {
    total: grupos.length,
    activos: grupos.filter(g => g.activo).length,
    totalEstudiantes: grupos.reduce((sum, g) => sum + (g.inscripciones?.[0]?.count || 0), 0),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center px-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                Gestión de Grupos
              </h1>
              <p className="text-muted-foreground">
                Administra los grupos y asigna docentes
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Grupo
            </Button>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Resultados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{filteredGrupos.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Table Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Grupos</CardTitle>
                  <CardDescription>
                    Todos los grupos registrados
                  </CardDescription>
                </div>
              </div>
              {/* Search and Filter Bar */}
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por materia o docente..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Select value={periodoFilter} onValueChange={(value) => {
                  setPeriodoFilter(value);
                  setCurrentPage(1);
                }}>
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
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="loading-spinner"></div>
                </div>
              ) : currentGrupos.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || periodoFilter !== 'all' 
                      ? 'No se encontraron grupos' 
                      : 'No hay grupos registrados'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Materia</TableHead>
                          <TableHead>Docente</TableHead>
                          <TableHead>Periodo</TableHead>
                          <TableHead>Horario</TableHead>
                          <TableHead className="text-center">Estudiantes</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentGrupos.map((grupo) => (
                          <TableRow key={grupo.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{grupo.materias?.nombre}</div>
                                <div className="text-sm text-muted-foreground font-mono">
                                  {grupo.materias?.codigo}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {grupo.docente?.nombre} {grupo.docente?.apellido}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{grupo.periodo}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {grupo.horario && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Clock className="h-3 w-3" />
                                    {grupo.horario}
                                  </div>
                                )}
                                {grupo.salon && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {grupo.salon}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-medium">
                                  {grupo.inscripciones?.[0]?.count || 0} / {grupo.cupo_maximo}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(((grupo.inscripciones?.[0]?.count || 0) / grupo.cupo_maximo) * 100)}% lleno
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={grupo.activo ? 'default' : 'secondary'}>
                                {grupo.activo ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(grupo)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setGrupoToDelete(grupo);
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredGrupos.length)} de{' '}
                        {filteredGrupos.length} grupos
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog Crear/Editar Grupo */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingGrupo ? 'Editar Grupo' : 'Nuevo Grupo'}
            </DialogTitle>
            <DialogDescription>
              {editingGrupo
                ? 'Actualiza la información del grupo'
                : 'Completa los datos para crear un nuevo grupo'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="materia_id">Materia *</Label>
                <Select 
                  value={selectedMateria} 
                  onValueChange={(value) => setValue('materia_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {materias.map(materia => (
                      <SelectItem key={materia.id} value={materia.id}>
                        {materia.codigo} - {materia.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.materia_id && (
                  <p className="text-sm text-destructive">{errors.materia_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="docente_id">Docente *</Label>
                <Select 
                  value={selectedDocente} 
                  onValueChange={(value) => setValue('docente_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {docentes.map(docente => (
                      <SelectItem key={docente.user_id} value={docente.user_id}>
                        {docente.nombre} {docente.apellido} - {docente.matricula}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.docente_id && (
                  <p className="text-sm text-destructive">{errors.docente_id.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodo">Periodo *</Label>
                  <Input
                    id="periodo"
                    placeholder="2025-1"
                    {...register('periodo')}
                  />
                  {errors.periodo && (
                    <p className="text-sm text-destructive">{errors.periodo.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cupo_maximo">Cupo Máximo *</Label>
                  <Input
                    id="cupo_maximo"
                    type="number"
                    min="1"
                    max="100"
                    {...register('cupo_maximo', { valueAsNumber: true })}
                  />
                  {errors.cupo_maximo && (
                    <p className="text-sm text-destructive">{errors.cupo_maximo.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario">Horario</Label>
                <Input
                  id="horario"
                  placeholder="Lun-Mie-Vie 10:00-12:00"
                  {...register('horario')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salon">Salón</Label>
                <Input
                  id="salon"
                  placeholder="A-201"
                  {...register('salon')}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  className="h-4 w-4 rounded border-gray-300"
                  {...register('activo')}
                />
                <Label htmlFor="activo" className="cursor-pointer">
                  Grupo activo
                </Label>
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
                {isSubmitting ? 'Guardando...' : editingGrupo ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar grupo?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el grupo de{' '}
              <strong>{grupoToDelete?.materias?.nombre}</strong> permanentemente.
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