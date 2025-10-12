// =========================================
// src/components/layout/DashboardLayout.jsx
// Layout compartido para todos los dashboards
// =========================================

import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  GraduationCap,
  LogOut,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({ children, title = 'Dashboard' }) {
  const { profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleBadge = () => {
    const roleMap = {
      admin: { label: 'Administrador', variant: 'default' },
      docente: { label: 'Docente', variant: 'secondary' },
      estudiante: { label: 'Estudiante', variant: 'outline' },
    };
    return roleMap[profile?.role] || { label: 'Usuario', variant: 'secondary' };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold hidden sm:inline">{title}</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* User Info - Hidden on mobile */}
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium">{profile?.nombre} {profile?.apellido}</p>
              {profile?.matricula && (
                <p className="text-xs text-muted-foreground">Mat: {profile?.matricula}</p>
              )}
            </div>
            
            <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
            
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Settings className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={signOut} 
              className="hidden md:flex gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Salir</span>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background p-4 space-y-2">
            <div className="pb-3 border-b">
              <p className="font-medium">{profile?.nombre} {profile?.apellido}</p>
              {profile?.matricula && (
                <p className="text-sm text-muted-foreground">Mat: {profile?.matricula}</p>
              )}
            </div>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </Button>
            <Button 
              variant="ghost" 
              onClick={signOut}
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container px-4 md:px-8 py-6 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container px-4 md:px-8 py-6 text-center text-sm text-muted-foreground">
          <p>© 2025 Sistema de Gestión Académica. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}