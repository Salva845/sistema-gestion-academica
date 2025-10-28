// =====================================
// src/components/features/asistencia/AsistenciaList.jsx
// Lista de asistentes en tiempo real
// =====================================

import { CheckCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';

export function AsistenciaList({ asistentes, loading }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando asistentes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Asistentes</CardTitle>
          <Badge variant="default" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            {asistentes.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {asistentes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Aún no hay estudiantes registrados</p>
            <p className="text-sm mt-2">Los asistentes aparecerán aquí en tiempo real</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {asistentes.map((estudiante, index) => (
              <div 
                key={estudiante.estudiante_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors animate-fadeIn"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                    {estudiante.nombre?.[0]}{estudiante.apellido?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {estudiante.nombre} {estudiante.apellido}
                    </p>
                    <p className="text-sm text-gray-600">{estudiante.matricula}</p>
                  </div>
                </div>
                <div className="text-right">
                  <CheckCircle className="w-5 h-5 text-green-600 mb-1 ml-auto" />
                  <p className="text-xs text-gray-500">
                    {new Date(estudiante.hora_registro).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}