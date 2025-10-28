// =====================================
// src/pages/docente/Asistencia.jsx
// Página principal de asistencia para docentes
// =====================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAsistencia } from '../../hooks/useAsistencia';
import { asistenciaService } from '../../services/asistencia.service';
import { QRGenerator } from '../../components/features/asistencia/QRGenerator';
import { AsistenciaList } from '../../components/features/asistencia/AsistenciaList';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Clock, 
  MapPin,
  BookOpen,
  AlertCircle
} from 'lucide-react';

export default function DocenteAsistencia() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { grupoId, sesionId } = useParams();
  const [sesionInfo, setSesionInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const {
    qrData,
    asistentes,
    loading: qrLoading,
    error,
    tiempoRestante,
    generarQR,
    desactivarQR,
    formatearTiempo,
    setError
  } = useAsistencia(sesionId);

  // Cargar información de la sesión
  useEffect(() => {
    const cargarSesion = async () => {
      if (!sesionId) {
        setError('ID de sesión no proporcionado');
        setLoadingInfo(false);
        return;
      }

      try {
        const { data, error: err } = await asistenciaService.obtenerSesion(sesionId);
        
        if (err) throw err;
        setSesionInfo(data);
      } catch (err) {
        console.error('Error cargando sesión:', err);
        setError('Error al cargar la información de la sesión');
      } finally {
        setLoadingInfo(false);
      }
    };

    cargarSesion();
  }, [sesionId, setError]);

  if (loadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error && !sesionInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => navigate(-1)}>
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const materia = sesionInfo?.grupos?.materias;
  const grupo = sesionInfo?.grupos;
  const docente = sesionInfo?.grupos?.docente;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container flex h-16 items-center px-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/docente/grupos/${grupoId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Grupo
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Información de la sesión */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-2xl">{materia?.nombre}</CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-4 text-base">
                    <Badge variant="outline">{materia?.codigo}</Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(sesionInfo?.fecha).toLocaleDateString('es-MX', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </CardDescription>
                </div>
                <Badge variant={qrData ? "default" : "secondary"} className="text-sm">
                  {qrData ? '🟢 QR Activo' : '⚫ QR Inactivo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                {grupo?.horario && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{grupo.horario}</span>
                  </div>
                )}
                {grupo?.salon && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Salón: {grupo.salon}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{asistentes.length} asistentes</span>
                </div>
              </div>
              {sesionInfo?.tema && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Tema de la clase:</p>
                  <p className="text-sm text-muted-foreground">{sesionInfo.tema}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Control de QR y Lista de Asistentes */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Panel QR */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Control de Asistencia</CardTitle>
                  <CardDescription>
                    Genera un código QR para que los estudiantes registren su asistencia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!qrData ? (
                    <div className="space-y-3">
                      <Button
                        onClick={() => generarQR(5)}
                        disabled={qrLoading}
                        className="w-full"
                        size="lg"
                      >
                        Generar QR (5 minutos)
                      </Button>
                      <Button
                        onClick={() => generarQR(10)}
                        disabled={qrLoading}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        Generar QR (10 minutos)
                      </Button>
                      <Button
                        onClick={() => generarQR(15)}
                        disabled={qrLoading}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        Generar QR (15 minutos)
                      </Button>
                    </div>
                  ) : (
                    <QRGenerator
                      qrData={qrData}
                      tiempoRestante={tiempoRestante}
                      onRegenerar={generarQR}
                      onDesactivar={desactivarQR}
                      formatearTiempo={formatearTiempo}
                    />
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Panel Asistentes */}
            <AsistenciaList asistentes={asistentes} loading={false} />
          </div>

          {/* Instrucciones */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm text-blue-900">
                  <p className="font-semibold">Instrucciones:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Genera el código QR presionando uno de los botones</li>
                    <li>Proyecta o muestra el código QR a tus estudiantes</li>
                    <li>Los estudiantes deben escanearlo con su aplicación</li>
                    <li>Verás aparecer los asistentes en tiempo real</li>
                    <li>El QR expirará automáticamente al terminar el tiempo</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
