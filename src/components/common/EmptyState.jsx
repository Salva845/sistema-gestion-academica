import { AlertCircle } from 'lucide-react';

export function EmptyState({ 
  icon: Icon = AlertCircle,
  title = 'No hay datos',
  description,
  action 
}) {
  return (
    <div className="text-center py-12">
      <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}   