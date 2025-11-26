import React from 'react';

export const Loading = ({ message = 'Cargando...', fullScreen = true }) => {
    const content = (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground text-sm font-medium">{message}</p>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background/50 backdrop-blur-sm">
                {content}
            </div>
        );
    }

    return <div className="flex items-center justify-center p-8">{content}</div>;
};
