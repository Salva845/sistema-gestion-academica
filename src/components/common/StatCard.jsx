// =========================================
// src/components/common/StatCard.jsx
// Componente de tarjeta de estadística reutilizable
// =========================================

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  subtitle,
  trend,
  action 
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
            
            {trend && (
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                {trend}
              </p>
            )}
            
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
            
            {action && (
              <Button 
                variant="link" 
                className="mt-2 p-0 h-auto text-primary"
                onClick={action.onClick}
              >
                {action.label} →
              </Button>
            )}
          </div>
          
          <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900`}>
            <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}