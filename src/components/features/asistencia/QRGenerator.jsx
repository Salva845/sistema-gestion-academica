// =====================================
// src/components/features/asistencia/QRGenerator.jsx
// Componente para generar y mostrar QR (Docente)
// =====================================
import { QRCodeSVG } from 'qrcode.react';
import { Clock, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';

export function QRGenerator({ qrData, tiempoRestante, onRegenerar, onDesactivar, formatearTiempo }) {
  if (!qrData) {
    return null;
  }

  const tiempoCritico = tiempoRestante <= 60;

  return (
    <Card className="border-4 border-blue-600">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg inline-block">
            <QRCodeSVG 
              value={qrData.token}
              size={300}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Tiempo restante */}
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-6 h-6" />
            <Badge 
              variant={tiempoCritico ? "destructive" : "default"}
              className="text-2xl font-bold px-4 py-2"
            >
              {formatearTiempo(tiempoRestante)}
            </Badge>
          </div>

          {tiempoCritico && (
            <p className="text-sm text-red-600 font-semibold animate-pulse">
              ⚠️ El QR está por expirar
            </p>
          )}

          {/* Controles */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => onRegenerar(10)}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerar
            </Button>
            <Button
              onClick={onDesactivar}
              variant="destructive"
              className="gap-2"
            >
              <XCircle className="w-4 h-4" />
              Desactivar
            </Button>
          </div>

          <p className="text-sm text-gray-500">
            Los estudiantes deben escanear este código para registrar su asistencia
          </p>
        </div>
      </CardContent>
    </Card>
  );
}