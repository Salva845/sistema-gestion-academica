// =========================================
// src/App.jsx
// Configuración de rutas principales
// =========================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

import { Loading } from './components/ui/Loading';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

import { Suspense, lazy } from 'react';

// Auth pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const UpdatePassword = lazy(() => import('./pages/auth/UpdatePassword'));

// Paginas Admin
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const Materias = lazy(() => import('./pages/admin/Materias'));
const Usuarios = lazy(() => import('./pages/admin/Usuarios'));
const Grupos = lazy(() => import('./pages/admin/Grupos'));

// Paginas Estudiante
const EstudianteDashboard = lazy(() => import('./pages/estudiante/Dashboard'));
const MisMaterias = lazy(() => import('./pages/estudiante/MisMaterias'));
const EstudianteEscanearAsistencia = lazy(() => import('./pages/estudiante/EscanearAsistencia'));
const EstudianteMisCalificaciones = lazy(() => import('./pages/estudiante/MisCalificaciones'));

// Paginas Docente
const DocenteDashboard = lazy(() => import('./pages/docente/Dashboard'));
const MisGrupos = lazy(() => import('./pages/docente/MisGrupos'));
const DocenteAsistencia = lazy(() => import('./pages/docente/Asistencia'));
const DocenteGrupoDetalle = lazy(() => import('./pages/docente/GrupoDetalle'));
const DocenteCalificaciones = lazy(() => import('./pages/docente/Calificaciones'));


function App() {
  const { user, profile, loading } = useAuth();
  if (loading) {
    return <Loading />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loading />}>
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
                    <Loading message="Cargando tu perfil..." />
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
              <Route path="/admin/grupos" element={<Grupos />} />
            </Route>

            {/* Rutas protegidas - Docente */}
            <Route element={<ProtectedRoute allowedRoles={['docente']} />}>
              <Route path="/docente" element={<DocenteDashboard />} />
              <Route path="/docente/grupos" element={<MisGrupos />} />
              <Route path="/docente/misgrupos" element={<MisGrupos />} />
              <Route path="/docente/grupos/:grupoId" element={<DocenteGrupoDetalle />} />
              <Route path="/docente/asistencia/:sesionId" element={<DocenteAsistencia />} />
              <Route path="/docente/calificaciones" element={<DocenteCalificaciones />} />

            </Route>

            {/* Rutas protegidas - Estudiante */}
            <Route element={<ProtectedRoute allowedRoles={['estudiante']} />}>
              <Route path="/estudiante" element={<EstudianteDashboard />} />
              <Route path="/estudiante/asistencia" element={<EstudianteEscanearAsistencia />} />
              <Route path="/estudiante/materias" element={<MisMaterias />} />
              <Route path="/estudiante/materias/:id" element={<MisMaterias />} />
              <Route path="/estudiante/calificaciones" element={<EstudianteMisCalificaciones />} />
            </Route>

            {/* Página de no autorizado */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;