// =========================================
// src/pages/admin/Usuarios.jsx
// CRUD completo de usuarios con DEBUG
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
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserCheck,
  GraduationCap,
  Shield,
} from 'lucide-react';

// Schema de validación para creación
const usuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  matricula: z.string().min(3, 'La matrícula debe tener al menos 3 caracteres'),
  role: z.enum(['estudiante', 'docente', 'admin']),
  telefono: z.string().optional(),
});

// Schema para edición (sin password)
const editUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  matricula: z.string().min(3, 'La matrícula debe tener al menos 3 caracteres'),
  role: z.enum(['estudiante', 'docente', 'admin']),
  telefono: z.string().optional(),
});

export default function Usuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState(null);
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
    resolver: zodResolver(editingUsuario ? editUsuarioSchema : usuarioSchema),
  });

  const selectedRole = watch('role');

  useEffect(() => {
    loadUsuarios();
    checkCurrentUser(); // ✅ Verificar usuario actual
  }, []);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Usuario actual logueado:', user);
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      console.log('👤 Perfil del usuario actual:', profile);
      console.log('🔐 Rol del usuario:', profile?.role);
    }
  };

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando usuarios...');
      
      // Cargar perfiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('nombre', { ascending: true });

      if (profilesError) {
        console.error('❌ Error en query de profiles:', profilesError);
        throw profilesError;
      }
      
      console.log('✅ Perfiles cargados:', profilesData?.length || 0);
      
      // Obtener emails desde auth.users para usuarios que no tienen email en profiles
      const userIds = profilesData?.map(p => p.user_id) || [];
      const usuariosCompletos = [];
      
      for (const profile of profilesData || []) {
        let email = profile.email;
        
        // Si no tiene email en el perfil, intentar obtenerlo de auth.users
        if (!email && profile.user_id) {
          try {
            // Nota: No podemos consultar auth.users directamente desde el cliente
            // El email debería estar en el perfil o venir del metadata
            // Por ahora, usaremos el email del perfil o null
            console.warn(`⚠️ Usuario ${profile.user_id} (${profile.nombre}) no tiene email en perfil`);
          } catch (e) {
            console.error('Error obteniendo email:', e);
          }
        }
        
        usuariosCompletos.push({
          ...profile,
          email: email || null // Asegurar que email sea null si no existe
        });
      }
      
      console.log('📋 Usuarios completos:', usuariosCompletos);
      
      // Debug: Verificar roles y emails de cada usuario
      usuariosCompletos.forEach((usuario, index) => {
        console.log(`Usuario ${index}:`, {
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          role: usuario.role,
          role_normalized: usuario.role?.toLowerCase().trim(),
          email: usuario.email,
          matricula: usuario.matricula,
          user_id: usuario.user_id
        });
      });
      
      // Contar por roles
      const conteoRoles = usuariosCompletos.reduce((acc, u) => {
        const role = u.role?.toLowerCase().trim() || 'sin-rol';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 Conteo por roles:', conteoRoles);
      
      setUsuarios(usuariosCompletos);
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      setMessage({ type: 'error', text: `Error al cargar los usuarios: ${error.message}` });
      setUsuarios([]); // Asegurar que el array esté vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      console.log('=== INICIO onSubmit ===');
      console.log('editingUsuario:', editingUsuario);
      console.log('data recibida:', data);
      
      if (editingUsuario) {
        // Actualizar usuario
        console.log('🔄 MODO: Actualización');
        console.log('user_id a actualizar:', editingUsuario.user_id);
        console.log('Datos a enviar:', {
          nombre: data.nombre,
          apellido: data.apellido,
          matricula: data.matricula,
          role: data.role,
          telefono: data.telefono,
        });
        
        const { data: updatedData, error: profileError } = await supabase
          .from('profiles')
          .update({
            nombre: data.nombre,
            apellido: data.apellido,
            matricula: data.matricula,
            role: data.role,
            telefono: data.telefono,
          })
          .eq('user_id', editingUsuario.user_id)
          .select();

        console.log('✅ Respuesta de Supabase:');
        console.log('- updatedData:', updatedData);
        console.log('- profileError:', profileError);

        if (profileError) {
          console.error('❌ ERROR en profileError:', profileError);
          throw new Error(`Error de base de datos: ${profileError.message}`);
        }
        
        if (!updatedData || updatedData.length === 0) {
          console.warn('⚠️ No se actualizó ningún registro');
          throw new Error('No se pudo actualizar el usuario. Verifica los permisos de la base de datos.');
        }
        
        console.log('✅ Usuario actualizado correctamente');
        setMessage({ type: 'success', text: 'Usuario actualizado exitosamente' });
      } else {
        console.log('➕ MODO: Creación');
        // Crear nuevo usuario
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              nombre: data.nombre,
              apellido: data.apellido,
              matricula: data.matricula,
              role: data.role,
            },
          },
        });

        console.log('Respuesta signUp:', { authData, authError });

        if (authError) throw authError;

        if (authData.user) {
          // Actualizar el perfil con todos los datos necesarios
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              role: data.role, 
              telefono: data.telefono,
              email: data.email,
              nombre: data.nombre,
              apellido: data.apellido,
              matricula: data.matricula
            })
            .eq('user_id', authData.user.id);
            
          if (updateError) {
            console.error('❌ Error actualizando perfil:', updateError);
            // Si el perfil no existe, crearlo
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                user_id: authData.user.id,
                email: data.email,
                nombre: data.nombre,
                apellido: data.apellido,
                matricula: data.matricula,
                role: data.role,
                telefono: data.telefono || null
              });
            
            if (insertError) {
              console.error('❌ Error creando perfil:', insertError);
              throw new Error(`Error creando perfil: ${insertError.message}`);
            }
          }
        }

        setMessage({ type: 'success', text: 'Usuario creado exitosamente' });
      }

      console.log('🔄 Recargando usuarios...');
      await loadUsuarios();
      console.log('✅ Usuarios recargados');
      handleCloseDialog();
      console.log('=== FIN onSubmit ===');
    } catch (error) {
      console.error('❌ ERROR CATCH:', error);
      console.error('Error completo:', JSON.stringify(error, null, 2));
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al guardar el usuario' 
      });
    }
  };

  const handleEdit = (usuario) => {
    console.log('📝 handleEdit llamado con usuario:', usuario);
    setEditingUsuario(usuario);
    setValue('email', usuario.email);
    setValue('nombre', usuario.nombre);
    setValue('apellido', usuario.apellido);
    setValue('matricula', usuario.matricula);
    setValue('role', usuario.role);
    setValue('telefono', usuario.telefono || '');
    setDialogOpen(true);
    console.log('✅ Formulario poblado y dialog abierto');
  };

  const handleDelete = async () => {
    try {
      console.log('🗑️ Intentando eliminar usuario:', usuarioToDelete.user_id);
      
      // Primero eliminar el perfil (esto es lo que podemos hacer desde el cliente)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', usuarioToDelete.user_id);

      if (profileError) {
        console.error('Error eliminando perfil:', profileError);
        throw profileError;
      }

      console.log('✅ Perfil eliminado correctamente');
      setMessage({ type: 'success', text: 'Usuario eliminado exitosamente' });
      await loadUsuarios();
      setDeleteDialogOpen(false);
      setUsuarioToDelete(null);
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al eliminar el usuario. Verifica que no tenga datos asociados.' 
      });
    }
  };

  const handleCloseDialog = () => {
    console.log('🚪 Cerrando dialog');
    setDialogOpen(false);
    setEditingUsuario(null);
    reset();
  };

  // Filtrar usuarios (comparación case-insensitive para roles)
  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch = 
      (usuario.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (usuario.apellido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (usuario.matricula || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (usuario.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
      (usuario.role && usuario.role.toLowerCase().trim() === roleFilter.toLowerCase().trim());
    
    return matchesSearch && matchesRole;
  });

  // Paginación
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(startIndex, endIndex);

  // Estadísticas por rol (usar toLowerCase para comparación case-insensitive)
  const stats = {
    estudiantes: usuarios.filter(u => u.role && u.role.toLowerCase().trim() === 'estudiante').length,
    docentes: usuarios.filter(u => u.role && u.role.toLowerCase().trim() === 'docente').length,
    admins: usuarios.filter(u => u.role && u.role.toLowerCase().trim() === 'admin').length,
  };

  const getRoleBadge = (role) => {
    const config = {
      admin: { label: 'Admin', variant: 'default', icon: Shield },
      docente: { label: 'Docente', variant: 'secondary', icon: UserCheck },
      estudiante: { label: 'Estudiante', variant: 'outline', icon: GraduationCap },
    };
    return config[role] || config.estudiante;
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
                Gestión de Usuarios
              </h1>
              <p className="text-muted-foreground">
                Administra estudiantes, docentes y administradores
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Usuario
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
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{usuarios.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Estudiantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.estudiantes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Docentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.docentes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Administradores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.admins}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Table Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Usuarios</CardTitle>
                  <CardDescription>
                    Todos los usuarios registrados en el sistema
                  </CardDescription>
                </div>
              </div>
              {/* Search and Filter Bar */}
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, matrícula o email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={(value) => {
                  setRoleFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="estudiante">Estudiantes</SelectItem>
                    <SelectItem value="docente">Docentes</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="loading-spinner"></div>
                </div>
              ) : currentUsuarios.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || roleFilter !== 'all' 
                      ? 'No se encontraron usuarios' 
                      : 'No hay usuarios registrados'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Matrícula</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentUsuarios.map((usuario) => {
                          const roleBadge = getRoleBadge(usuario.role);
                          const Icon = roleBadge.icon;
                          return (
                            <TableRow key={usuario.user_id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    {usuario.foto_url ? (
                                      <img 
                                        src={usuario.foto_url} 
                                        alt={usuario.nombre}
                                        className="h-full w-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-sm font-medium">
                                        {usuario.nombre[0]}{usuario.apellido[0]}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {usuario.nombre} {usuario.apellido}
                                    </div>
                                    {usuario.telefono && (
                                      <div className="text-sm text-muted-foreground">
                                        {usuario.telefono}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm">{usuario.matricula}</span>
                              </TableCell>
                              <TableCell className="text-sm">
                                {usuario.email || (
                                  <span className="text-muted-foreground italic">
                                    Sin email
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={roleBadge.variant} className="gap-1">
                                  <Icon className="h-3 w-3" />
                                  {roleBadge.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(usuario)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setUsuarioToDelete(usuario);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsuarios.length)} de{' '}
                        {filteredUsuarios.length} usuarios
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

      {/* Dialog Crear/Editar Usuario */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              {editingUsuario
                ? 'Actualiza la información del usuario'
                : 'Completa los datos para crear un nuevo usuario'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4">
              {/* Email siempre visible pero readonly en edición */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  {...register('email')}
                  disabled={!!editingUsuario}
                  className={editingUsuario ? 'bg-muted' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password solo en creación */}
              {!editingUsuario && (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    placeholder="Juan"
                    {...register('nombre')}
                  />
                  {errors.nombre && (
                    <p className="text-sm text-destructive">{errors.nombre.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input
                    id="apellido"
                    placeholder="Pérez"
                    {...register('apellido')}
                  />
                  {errors.apellido && (
                    <p className="text-sm text-destructive">{errors.apellido.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula *</Label>
                  <Input
                    id="matricula"
                    placeholder="EST001"
                    {...register('matricula')}
                  />
                  {errors.matricula && (
                    <p className="text-sm text-destructive">{errors.matricula.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol *</Label>
                  <Select 
                    value={selectedRole} 
                    onValueChange={(value) => setValue('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estudiante">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Estudiante
                        </div>
                      </SelectItem>
                      <SelectItem value="docente">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Docente
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Administrador
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-destructive">{errors.role.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="+52 777 123 4567"
                  {...register('telefono')}
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
                {isSubmitting ? 'Guardando...' : editingUsuario ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar usuario?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el usuario{' '}
              <strong>{usuarioToDelete?.nombre} {usuarioToDelete?.apellido}</strong> permanentemente.
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