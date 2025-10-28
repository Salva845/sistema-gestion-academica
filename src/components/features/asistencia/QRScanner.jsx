// =====================================
// src/components/features/asistencia/QRScanner.jsx
// Componente para escanear QR (Estudiante)
// =====================================
import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

export function QRScanner({ onScanSuccess, onScanError, isScanning, onStartScan, onStopScan }) {
  const scannerRef = useRef(null);
  const scannerContainerRef = useRef(null);

  useEffect(() => {
    if (isScanning && scannerContainerRef.current) {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true
      });

      scanner.render(
        (decodedText) => {
          scanner.clear();
          onScanSuccess(decodedText);
        },
        (error) => {
          if (!error.includes('NotFoundException')) {
            console.warn('Error escaneando:', error);
          }
        }
      );

      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
      };
    }
  }, [isScanning, onScanSuccess]);

  if (!isScanning) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Camera className="w-16 h-16 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Listo para escanear</h2>
          <p className="text-gray-600 mb-6">
            Presiona el botón para activar la cámara y escanear el código QR
          </p>
          <Button onClick={onStartScan} className="gap-2">
            <Camera className="w-5 h-5" />
            Activar Cámara
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Área del escáner */}
        <div id="qr-reader" ref={scannerContainerRef} />

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Consejos para escanear:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Mantén el dispositivo estable</li>
                <li>Asegúrate de tener buena iluminación</li>
                <li>Enfoca completamente el código QR</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botón cancelar */}
        <Button
          onClick={onStopScan}
          variant="outline"
          className="w-full"
        >
          Cancelar
        </Button>
      </CardContent>
    </Card>
  );
}