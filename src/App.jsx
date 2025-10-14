// =========================================
// src/App.jsx
// Configuración de rutas principales
// =========================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/Profile';
import ResetPassword from './pages/auth/ResetPassword';
import UpdatePassword from './pages/auth/UpdatePassword';

// Dashboard pages
import AdminDashboard from './pages/admin/Dashboard';
import DocenteDashboard from './pages/docente/Dashboard';
import EstudianteDashboard from './pages/estudiante/Dashboard';
import Materias from './pages/admin/Materias';
import Usuarios from './pages/admin/Usuarios';

function App() {
  const { user, profile, loading } = useAuth();

  // Mostrar loading mientras se carga el perfil
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="loading-spinner"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas - Reset Password */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        {/* Rutas públicas */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/" replace />}
        />

        {/* Ruta raíz - redirige según rol SOLO si profile está cargado */}
        <Route
          path="/"
          element={
            user ? (
              profile ? (
                <Navigate
                  to={
                    profile.role === 'admin'
                      ? '/admin'
                      : profile.role === 'docente'
                      ? '/docente'
                      : '/estudiante'
                  }
                  replace
                />
              ) : (
                // Si user existe pero profile no, mostrar loading
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="loading-spinner"></div>
                    <p className="text-muted-foreground">Cargando tu perfil...</p>
                  </div>
                </div>
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Ruta protegida - Profile (todos los roles) */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'docente', 'estudiante']} />}>
        <Route path="/profile" element={<Profile />} /></Route>

        {/* Rutas protegidas - Admin */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/materias" element={<Materias />} />
          <Route path="/admin/usuarios" element={<Usuarios />} />
        </Route>

        {/* Rutas protegidas - Docente */}
        <Route element={<ProtectedRoute allowedRoles={['docente']} />}>
          <Route path="/docente" element={<DocenteDashboard />} />
        </Route>

        {/* Rutas protegidas - Estudiante */}
        <Route element={<ProtectedRoute allowedRoles={['estudiante']} />}>
          <Route path="/estudiante" element={<EstudianteDashboard />} />
        </Route>

        {/* Página de no autorizado */}
        <Route 
          path="/unauthorized" 
          element={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="text-center space-y-4 p-8">
                <div className="text-6xl">🚫</div>
                <h1 className="text-2xl font-bold">Acceso No Autorizado</h1>
                <p className="text-muted-foreground">
                  No tienes permisos para acceder a esta página
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Volver
                </button>
              </div>
            </div>
          }
        />

        {/* 404 */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="text-center space-y-4">
                <div className="text-6xl">404</div>
                <h1 className="text-2xl font-bold">Página no encontrada</h1>
                <p className="text-muted-foreground">
                  La página que buscas no existe
                </p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;