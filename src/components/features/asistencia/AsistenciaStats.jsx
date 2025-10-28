// =====================================
// src/components/features/asistencia/AsistenciaStats.jsx
// Estadísticas de asistencia
// =====================================

import { TrendingUp, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

export function AsistenciaStats({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-20 bg-gray-200 animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      title: 'Total Sesiones',
      value: stats?.totalSesiones || 0,
      icon: Calendar,
      color: 'blue'
    },
    {
      title: 'Asistencias',
      value: stats?.totalAsistencias || 0,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Faltas',
      value: stats?.faltas || 0,
      icon: XCircle,
      color: 'red'
    },
    {
      title: 'Porcentaje',
      value: `${stats?.porcentaje || 0}%`,
      icon: TrendingUp,
      color: stats?.porcentaje >= 80 ? 'green' : stats?.porcentaje >= 60 ? 'yellow' : 'red'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              {item.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}