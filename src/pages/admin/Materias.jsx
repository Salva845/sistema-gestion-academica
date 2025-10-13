// =========================================
// src/pages/admin/Materias.jsx
// CRUD completo de materias con tabla interactiva
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
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Schema de validación con Zod
const materiaSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  codigo: z.string().min(2, 'El código debe tener al menos 2 caracteres'),
  creditos: z.number().min(1).max(10, 'Los créditos deben estar entre 1 y 10'),
  // Permitir null/undefined para campos opcionales que vienen como '' desde el formulario
  semestre: z.number().min(1).max(10, 'El semestre debe estar entre 1 y 10').nullable().optional(),
  descripcion: z.string().optional(),
});

export default function Materias() {
  const navigate = useNavigate();
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materiaToDelete, setMateriaToDelete] = useState(null);
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
  } = useForm({
    resolver: zodResolver(materiaSchema),
  });

  useEffect(() => {
    loadMaterias();
  }, []);

  const loadMaterias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('materias')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setMaterias(data || []);
    } catch (error) {
      console.error('Error cargando materias:', error);
      setMessage({ type: 'error', text: 'Error al cargar las materias' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingMateria) {
        // Actualizar materia
        const { error } = await supabase
          .from('materias')
          .update(data)
          .eq('id', editingMateria.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Materia actualizada exitosamente' });
      } else {
        // Crear nueva materia
        const { error } = await supabase
          .from('materias')
          .insert([data]);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Materia creada exitosamente' });
      }

      loadMaterias();
      handleCloseDialog();
    } catch (error) {
      console.error('Error guardando materia:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al guardar la materia' 
      });
    }
  };

  const handleEdit = (materia) => {
    setEditingMateria(materia);
    setValue('nombre', materia.nombre);
    setValue('codigo', materia.codigo);
    setValue('creditos', materia.creditos);
    setValue('semestre', materia.semestre || '');
    setValue('descripcion', materia.descripcion || '');
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('materias')
        .delete()
        .eq('id', materiaToDelete.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Materia eliminada exitosamente' });
      loadMaterias();
      setDeleteDialogOpen(false);
      setMateriaToDelete(null);
    } catch (error) {
      console.error('Error eliminando materia:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error al eliminar la materia. Puede tener grupos asociados.' 
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMateria(null);
    reset();
  };

  // Filtrar materias por búsqueda
  const filteredMaterias = materias.filter((materia) =>
    materia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    materia.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredMaterias.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMaterias = filteredMaterias.slice(startIndex, endIndex);

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
                Gestión de Materias
              </h1>
              <p className="text-muted-foreground">
                Administra el catálogo de materias del sistema
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Materia
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
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Materias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{materias.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Créditos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {materias.reduce((sum, m) => sum + m.creditos, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Resultados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{filteredMaterias.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Table Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Catálogo de Materias</CardTitle>
                  <CardDescription>
                    Lista completa de materias registradas
                  </CardDescription>
                </div>
              </div>
              {/* Search Bar */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="loading-spinner"></div>
                </div>
              ) : currentMaterias.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No se encontraron materias' : 'No hay materias registradas'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead className="text-center">Créditos</TableHead>
                          <TableHead className="text-center">Semestre</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentMaterias.map((materia) => (
                          <TableRow key={materia.id}>
                            <TableCell className="font-mono font-medium">
                              {materia.codigo}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{materia.nombre}</div>
                                {materia.descripcion && (
                                  <div className="text-sm text-muted-foreground truncate max-w-md">
                                    {materia.descripcion}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{materia.creditos}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {materia.semestre ? (
                                <Badge>{materia.semestre}°</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(materia)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setMateriaToDelete(materia);
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
                        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredMaterias.length)} de{' '}
                        {filteredMaterias.length} materias
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
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8"
                            >
                              {page}
                            </Button>
                          ))}
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

      {/* Dialog Crear/Editar Materia */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMateria ? 'Editar Materia' : 'Nueva Materia'}
            </DialogTitle>
            <DialogDescription>
              {editingMateria
                ? 'Actualiza la información de la materia'
                : 'Completa los datos para crear una nueva materia'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  placeholder="Ej: MAT101"
                  {...register('codigo')}
                />
                {errors.codigo && (
                  <p className="text-sm text-destructive">{errors.codigo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Cálculo Diferencial"
                  {...register('nombre')}
                />
                {errors.nombre && (
                  <p className="text-sm text-destructive">{errors.nombre.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creditos">Créditos *</Label>
                  <Input
                    id="creditos"
                    type="number"
                    min="1"
                    max="10"
                    {...register('creditos', { valueAsNumber: true })}
                  />
                  {errors.creditos && (
                    <p className="text-sm text-destructive">{errors.creditos.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semestre">Semestre</Label>
                  <Input
                    id="semestre"
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Opcional"
                    {...register('semestre', { 
                      // Devolver undefined cuando el input esté vacío para que Zod lo trate como opcional
                      setValueAs: v => (v === '' ? undefined : parseInt(v))
                    })}
                  />
                  {errors.semestre && (
                    <p className="text-sm text-destructive">{errors.semestre.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Descripción opcional de la materia"
                  {...register('descripcion')}
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
                {isSubmitting ? 'Guardando...' : editingMateria ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar materia?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará la materia{' '}
              <strong>{materiaToDelete?.nombre}</strong> permanentemente.
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