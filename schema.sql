-- =======================================================
-- SISTEMA DE GESTIÓN ACADÉMICA - SCHEMA SQL (CORREGIDO)
-- =======================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- 1. TABLA PROFILES (Perfiles de usuario) - CORREGIDA
-- =========================================
CREATE TABLE profiles (
    -- 'user_id' es ahora la CLAVE PRIMARIA y la referencia a auth.users
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    foto_url TEXT,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX idx_profiles_matricula ON profiles(matricula);
CREATE INDEX idx_profiles_nombre_apellido ON profiles(nombre, apellido);

-- =========================================
-- 2. TABLA MATERIAS
-- =========================================
CREATE TABLE materias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    creditos INTEGER NOT NULL CHECK (creditos BETWEEN 1 AND 10),
    semestre INTEGER CHECK (semestre BETWEEN 1 AND 10),
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para materias
CREATE INDEX idx_materias_codigo ON materias(codigo);
CREATE INDEX idx_materias_semestre ON materias(semestre);

-- =========================================
-- 3. TABLA GRUPOS
-- =========================================
CREATE TABLE grupos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    materia_id UUID REFERENCES materias(id) ON DELETE CASCADE NOT NULL,
    docente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    periodo VARCHAR(20) NOT NULL,
    horario VARCHAR(100),
    salon VARCHAR(50),
    cupo_maximo INTEGER DEFAULT 30,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para grupos
CREATE INDEX idx_grupos_materia_periodo ON grupos(materia_id, periodo);
CREATE INDEX idx_grupos_docente ON grupos(docente_id);
CREATE INDEX idx_grupos_periodo ON grupos(periodo);

-- =========================================
-- 4. TABLA INSCRIPCIONES
-- =========================================
CREATE TABLE inscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE NOT NULL,
    fecha_inscripcion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'completado', 'abandonado')),
    UNIQUE(estudiante_id, grupo_id)
);

-- Índices para inscripciones
CREATE INDEX idx_inscripciones_estudiante ON inscripciones(estudiante_id);
CREATE INDEX idx_inscripciones_grupo ON inscripciones(grupo_id);

-- =========================================
-- 5. TABLA SESIONES_CLASE
-- =========================================
CREATE TABLE sesiones_clase (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME,
    token_sesion VARCHAR(100) UNIQUE NOT NULL,
    expira_en TIMESTAMP WITH TIME ZONE NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para sesiones_clase
CREATE INDEX idx_sesiones_token ON sesiones_clase(token_sesion);
CREATE INDEX idx_sesiones_grupo_fecha ON sesiones_clase(grupo_id, fecha);
CREATE INDEX idx_sesiones_activa ON sesiones_clase(activa);

-- =========================================
-- 6. TABLA ASISTENCIAS
-- =========================================
CREATE TABLE asistencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sesion_id UUID REFERENCES sesiones_clase(id) ON DELETE CASCADE NOT NULL,
    estudiante_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metodo VARCHAR(20) DEFAULT 'qr' CHECK (metodo IN ('qr', 'manual', 'geolocalizado')),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    UNIQUE(sesion_id, estudiante_id)
);

-- Índices para asistencias
CREATE INDEX idx_asistencias_sesion ON asistencias(sesion_id);
CREATE INDEX idx_asistencias_estudiante ON asistencias(estudiante_id);

-- =========================================
-- 7. TABLA CALIFICACIONES
-- =========================================
CREATE TABLE calificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inscripcion_id UUID REFERENCES inscripciones(id) ON DELETE CASCADE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    valor DECIMAL(5, 2) NOT NULL CHECK (valor >= 0),
    valor_maximo DECIMAL(5, 2) DEFAULT 10 CHECK (valor_maximo > 0),
    peso DECIMAL(5, 2) NOT NULL CHECK (peso BETWEEN 0 AND 100),
    fecha DATE DEFAULT CURRENT_DATE,
    comentarios TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para calificaciones
CREATE INDEX idx_calificaciones_inscripcion ON calificaciones(inscripcion_id);
CREATE INDEX idx_calificaciones_tipo ON calificaciones(tipo);
CREATE INDEX idx_calificaciones_fecha ON calificaciones(fecha);

-- =========================================
-- 8. TABLA AUDIT_LOG
-- =========================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id UUID,
    changes JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para audit_log
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);

-- =========================================
-- FUNCIONES Y TRIGGERS
-- =========================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserta usando NEW.id en la columna 'user_id' de la tabla 'profiles'
    INSERT INTO public.profiles (user_id, nombre, apellido, matricula)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', 'Sin nombre'),
        COALESCE(NEW.raw_user_meta_data->>'apellido', 'Sin apellido'),
        COALESCE(NEW.raw_user_meta_data->>'matricula', 'TEMP-' || substr(NEW.id::text, 1, 8))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automático
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_user();

-- =========================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================
-- (El resto del script de RLS y VISTAS no necesita cambios y se incluye aquí)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_clase ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY "Authenticated users can view materias" ON materias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify materias" ON materias FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY "Authenticated users can view grupos" ON grupos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Docentes can view their grupos" ON grupos FOR SELECT USING (docente_id = auth.uid());
CREATE POLICY "Only admins can modify grupos" ON grupos FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY "Students can view own inscripciones" ON inscripciones FOR SELECT USING (estudiante_id = auth.uid());
CREATE POLICY "Docentes can view inscripciones of their grupos" ON inscripciones FOR SELECT USING (EXISTS (SELECT 1 FROM grupos WHERE grupos.id = inscripciones.grupo_id AND grupos.docente_id = auth.uid()));
CREATE POLICY "Students can view own asistencias" ON asistencias FOR SELECT USING (estudiante_id = auth.uid());
CREATE POLICY "Students can insert own asistencias" ON asistencias FOR INSERT WITH CHECK (estudiante_id = auth.uid());
CREATE POLICY "Students can view own calificaciones" ON calificaciones FOR SELECT USING (EXISTS (SELECT 1 FROM inscripciones WHERE inscripciones.id = calificaciones.inscripcion_id AND inscripciones.estudiante_id = auth.uid()));

-- =========================================
-- VISTAS ÚTILES
-- =========================================

CREATE OR REPLACE VIEW vista_estudiantes_materias AS
SELECT 
    p.user_id, p.nombre, p.apellido, p.matricula,
    m.nombre as materia, m.codigo as codigo_materia,
    g.periodo, g.horario, i.estado
FROM profiles p
JOIN inscripciones i ON p.user_id = i.estudiante_id
JOIN grupos g ON i.grupo_id = g.id
JOIN materias m ON g.materia_id = m.id;

CREATE OR REPLACE VIEW vista_asistencia_estudiante AS
SELECT 
    p.user_id, p.matricula, p.nombre, p.apellido, m.nombre as materia,
    COUNT(a.id) as asistencias_total,
    COUNT(DISTINCT sc.id) as sesiones_total,
    ROUND((COUNT(a.id)::DECIMAL / NULLIF(COUNT(DISTINCT sc.id), 0)) * 100, 2) as porcentaje_asistencia
FROM profiles p
JOIN inscripciones i ON p.user_id = i.estudiante_id
JOIN grupos g ON i.grupo_id = g.id
JOIN materias m ON g.materia_id = m.id
LEFT JOIN sesiones_clase sc ON g.id = sc.grupo_id
LEFT JOIN asistencias a ON sc.id = a.sesion_id AND a.estudiante_id = p.user_id
GROUP BY p.user_id, p.matricula, p.nombre, p.apellido, m.nombre;

-- =========================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =========================================

INSERT INTO materias (nombre, codigo, creditos, semestre, descripcion) VALUES
('Cálculo Diferencial', 'MAT101', 8, 1, 'Fundamentos del cálculo diferencial'),
('Programación I', 'INF101', 6, 1, 'Introducción a la programación'),
('Álgebra Lineal', 'MAT102', 8, 2, 'Matrices, vectores y sistemas lineales'),
('Bases de Datos', 'INF201', 6, 3, 'Diseño y gestión de bases de datos'),
('Desarrollo Web', 'INF301', 8, 5, 'Aplicaciones web modernas');

-- =========================================
-- FIN DEL SCRIPT
-- =========================================