import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="text-center space-y-6 max-w-md">
                <h1 className="text-9xl font-bold text-primary">404</h1>
                <h2 className="text-2xl font-semibold tracking-tight">Página no encontrada</h2>
                <p className="text-muted-foreground">
                    Lo sentimos, la página que estás buscando no existe o ha sido movida.
                </p>
                <Button asChild size="lg">
                    <Link to="/">Volver al Inicio</Link>
                </Button>
            </div>
        </div>
    );
}
