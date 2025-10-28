// =====================================
// ARCHIVO 9: src/pages/estudiante/EscanearAsistencia.jsx
// Página para escanear QR (Estudiante)
// =====================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { asistenciaService } from '../../services/asistencia.service';
import { QRScanner } from '../../components/features/asistencia/QRScanner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Loader, 
  AlertCircle,
  Clock
} from 'lucide-react';

export default function EstudianteEscanearAsistencia() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleStartScan = () => {
    setScanning(true);
    setResult(null);
  };

  const handleStopScan = () => {
    setScanning(false);
  };

  const handleScanSuccess = async (decodedText) => {
    setScanning(false);
    setLoading(true);

    try {
      const { data, error } = await asistenciaService.registrarAsistenciaQR(decodedText, {
        dispositivo: navigator.userAgent
      });

      if (error) throw error;
      setResult(data);
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      setResult({
        success: false,
        error: 'ERROR_GENERAL',
        message: error.message || 'Error al registrar asistencia'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setScanning(false);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container flex h-16 items-center px-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/estudiante/materias')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Mis Materias
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-8 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header Info */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
            <h1 className="text-3xl font-bold mb-2">Registrar Asistencia</h1>
            <p className="text-blue-100">
              Escanea el código QR mostrado por tu profesor
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="text-center py-12">
                <Loader className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
                <h2 className="text-xl font-bold mb-2">Registrando asistencia...</h2>
                <p className="text-gray-600">Por favor espera</p>
              </CardContent>
            </Card>
          )}

          {/* Scanner */}
          {!loading && !result && (
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={(error) => console.error(error)}
              isScanning={scanning}
              onStartScan={handleStartScan}
              onStopScan={handleStopScan}
            />
          )}

          {/* Result Success */}
          {result && result.success && (
            <Card className="border-2 border-green-500">
              <CardContent className="text-center py-12">
                <div className="w-32 h-32 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-green-600 mb-2">
                  ¡Éxito!
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  {result.message}
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                  <div className="flex items-center justify-center gap-2 text-green-800">
                    <Clock className="w-4 h-4" />
                    <p className="text-sm font-medium">
                      {new Date(result.hora_registro).toLocaleString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleReset} variant="outline">
                    Escanear Otro
                  </Button>
                  <Button onClick={() => navigate('/estudiante/materias')}>
                    Ir a Mis Materias
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result Error */}
          {result && !result.success && (
            <Card className="border-2 border-red-500">
              <CardContent className="text-center py-12">
                <div className="w-32 h-32 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
                  <XCircle className="w-16 h-16 text-red-600" />
                </div>
                <h2 className="text-3xl font-bold text-red-600 mb-2">
                  Error
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  {result.message}
                </p>

                {/* Mensajes específicos por tipo de error */}
                {result.error === 'QR_INVALIDO' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-md mx-auto text-left">
                    <p className="text-sm text-red-800 mb-2 font-semibold">
                      Posibles causas:
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      <li>El código QR ha expirado</li>
                      <li>El profesor cerró la sesión de asistencia</li>
                      <li>El código QR no es válido</li>
                    </ul>
                  </div>
                )}

                {result.error === 'YA_REGISTRADO' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                    <p className="text-sm text-yellow-800">
                      Ya has registrado tu asistencia para esta clase.
                    </p>
                  </div>
                )}

                {result.error === 'NO_INSCRITO' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                    <p className="text-sm text-red-800">
                      No estás inscrito en esta materia. Contacta a tu coordinador.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <Button onClick={handleReset}>
                    Reintentar
                  </Button>
                  <Button onClick={() => navigate('/estudiante/materias')} variant="outline">
                    Volver
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ayuda */}
          {!result && !loading && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm text-blue-900">
                    <p className="font-semibold">¿Necesitas ayuda?</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Asegúrate de estar en la clase correcta</li>
                      <li>El profesor debe tener el QR activo</li>
                      <li>Escanea el QR dentro del tiempo límite</li>
                      <li>Verifica que estés inscrito en la materia</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}