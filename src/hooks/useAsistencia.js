// =====================================
// ARCHIVO 3: src/hooks/useAsistencia.js
// =====================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { asistenciaService } from '../services/asistencia.service';

/**
 * Hook personalizado para gestionar asistencias
 */
export function useAsistencia(sesionId) {
  const [qrData, setQrData] = useState(null);
  const [asistentes, setAsistentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  
  const intervalRef = useRef(null);
  const pollingRef = useRef(null);

  /**
   * Generar QR para la sesión
   */
  const generarQR = useCallback(async (duracionMinutos = 10) => {
    if (!sesionId) {
      setError('ID de sesión no proporcionado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await asistenciaService.activarQR(
        sesionId,
        duracionMinutos
      );

      if (err) throw err;

      setQrData(data);
      iniciarContador(duracionMinutos * 60);
      iniciarPollingAsistentes();
    } catch (err) {
      console.error('Error generando QR:', err);
      setError(err.message || 'Error al generar QR');
    } finally {
      setLoading(false);
    }
  }, [sesionId]);

  /**
   * Desactivar QR
   */
  const desactivarQR = useCallback(async () => {
    if (!sesionId) return;

    try {
      await asistenciaService.desactivarQR(sesionId);
      setQrData(null);
      setTiempoRestante(0);
      detenerContador();
      detenerPolling();
    } catch (err) {
      console.error('Error desactivando QR:', err);
      setError(err.message || 'Error al desactivar QR');
    }
  }, [sesionId]);

  /**
   * Cargar asistentes de la sesión
   */
  const cargarAsistentes = useCallback(async () => {
    if (!sesionId) return;

    try {
      const { data, error: err } = await asistenciaService.obtenerAsistentes(sesionId);
      if (err) throw err;
      setAsistentes(data || []);
    } catch (err) {
      console.error('Error cargando asistentes:', err);
    }
  }, [sesionId]);

  /**
   * Iniciar contador regresivo
   */
  const iniciarContador = useCallback((segundos) => {
    detenerContador();
    setTiempoRestante(segundos);

    intervalRef.current = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          detenerContador();
          setQrData(null);
          detenerPolling();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /**
   * Detener contador
   */
  const detenerContador = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Iniciar polling de asistentes
   */
  const iniciarPollingAsistentes = useCallback(() => {
    detenerPolling();
    
    // Cargar inmediatamente
    cargarAsistentes();
    
    // Luego cada 3 segundos
    pollingRef.current = setInterval(() => {
      cargarAsistentes();
    }, 3000);
  }, [cargarAsistentes]);

  /**
   * Detener polling
   */
  const detenerPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  /**
   * Cargar estado inicial del QR desde la sesión
   */
  const cargarEstadoQR = useCallback(async () => {
    if (!sesionId) return;

    try {
      const { data: sesion, error: err } = await asistenciaService.obtenerSesion(sesionId);
      if (err || !sesion) return;

      // Verificar si el QR está realmente activo (no expirado)
      if (sesion.qr_activo && sesion.qr_expira_at) {
        const ahora = new Date();
        const expiraEn = new Date(sesion.qr_expira_at);
        
        if (ahora < expiraEn && sesion.qr_token) {
          // QR está activo y no ha expirado
          const segundosRestantes = Math.floor((expiraEn - ahora) / 1000);
          setQrData({
            token: sesion.qr_token,
            expira_en: sesion.qr_expira_at
          });
          iniciarContador(segundosRestantes);
          iniciarPollingAsistentes();
        }
      }
    } catch (err) {
      console.error('Error cargando estado QR:', err);
    }
  }, [sesionId, iniciarContador, iniciarPollingAsistentes]);

  /**
   * Formatear tiempo restante
   */
  const formatearTiempo = useCallback((segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      detenerContador();
      detenerPolling();
    };
  }, [detenerContador, detenerPolling]);

  // Cargar estado inicial del QR y asistentes al montar
  useEffect(() => {
    if (sesionId) {
      cargarEstadoQR();
      cargarAsistentes();
    }
  }, [sesionId, cargarEstadoQR, cargarAsistentes]);

  return {
    qrData,
    asistentes,
    loading,
    error,
    tiempoRestante,
    generarQR,
    desactivarQR,
    cargarAsistentes,
    formatearTiempo,
    setError
  };
}
