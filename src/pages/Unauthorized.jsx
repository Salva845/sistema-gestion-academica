import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="flex justify-center">
                    <ShieldAlert className="h-24 w-24 text-destructive" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Acceso Denegado</h1>
                <p className="text-muted-foreground">
                    No tienes permisos suficientes para acceder a esta página.
                    Si crees que esto es un error, contacta al administrador.
                </p>
                <Button asChild variant="outline" size="lg">
                    <Link to="/">Volver al Inicio</Link>
                </Button>
            </div>
        </div>
    );
}
