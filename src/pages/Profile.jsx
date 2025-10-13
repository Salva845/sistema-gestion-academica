// =========================================
// src/pages/Profile.jsx
// Página de perfil de usuario completa
// =========================================

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  User,
  Mail,
  Phone,
  IdCard,
  Camera,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    foto_url: '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        nombre: profile.nombre || '',
        apellido: profile.apellido || '',
        telefono: profile.telefono || '',
        foto_url: profile.foto_url || '',
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updateProfile(formData);
      setMessage({ type: 'success', text: '¡Perfil actualizado exitosamente!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al actualizar el perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: '¡Contraseña actualizada exitosamente!' });
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setShowPasswordChange(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al cambiar la contraseña' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor selecciona una imagen válida' });
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen no debe superar los 2MB' });
      return;
    }

    setUploadingImage(true);
    setMessage({ type: '', text: '' });

    try {
      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Subir imagen a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Actualizar perfil con nueva URL
      await updateProfile({ foto_url: urlData.publicUrl });
      setFormData({ ...formData, foto_url: urlData.publicUrl });

      setMessage({ type: 'success', text: '¡Foto actualizada exitosamente!' });
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error al subir la imagen. Asegúrate de configurar el bucket en Supabase.' 
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const getRoleBadgeVariant = (role) => {
    const variants = {
      admin: 'default',
      docente: 'secondary',
      estudiante: 'outline',
    };
    return variants[role] || 'secondary';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
      docente: 'Docente',
      estudiante: 'Estudiante',
    };
    return labels[role] || 'Usuario';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center px-4 md:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 md:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Section */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Mi Perfil</h1>
            <p className="text-muted-foreground">
              Administra tu información personal y configuración de cuenta
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

          <div className="grid gap-8 md:grid-cols-3">
            {/* Sidebar - Avatar y Info Básica */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Foto de Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="h-32 w-32 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {formData.foto_url ? (
                          <img
                            src={formData.foto_url}
                            alt="Foto de perfil"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-16 w-16 text-muted-foreground" />
                        )}
                      </div>
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                    {uploadingImage && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Subiendo imagen...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Información de Cuenta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Correo</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user?.email}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Matrícula</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <IdCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{profile?.matricula}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Rol</Label>
                    <Badge variant={getRoleBadgeVariant(profile?.role)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {getRoleLabel(profile?.role)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Form */}
            <div className="md:col-span-2 space-y-6">
              {/* Información Personal */}
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>
                    Actualiza tu información personal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre *</Label>
                        <Input
                          id="nombre"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          required
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="apellido">Apellido *</Label>
                        <Input
                          id="apellido"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleChange}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        placeholder="+52 777 123 4567"
                        value={formData.telefono}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>

                    <Button type="submit" disabled={loading} className="gap-2">
                      <Save className="h-4 w-4" />
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Seguridad */}
              <Card>
                <CardHeader>
                  <CardTitle>Seguridad</CardTitle>
                  <CardDescription>
                    Gestiona la seguridad de tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="w-full"
                  >
                    {showPasswordChange ? 'Cancelar' : 'Cambiar Contraseña'}
                  </Button>

                  {showPasswordChange && (
                    <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            required
                            disabled={loading}
                            placeholder="Mínimo 6 caracteres"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                          disabled={loading}
                          placeholder="Repite la contraseña"
                        />
                      </div>

                      <Button type="submit" disabled={loading}>
                        {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}