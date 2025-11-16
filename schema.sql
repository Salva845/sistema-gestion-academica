-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.asistencias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sesion_id uuid NOT NULL,
  estudiante_id uuid NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  metodo character varying DEFAULT 'qr'::character varying CHECK (metodo::text = ANY (ARRAY['qr'::character varying, 'manual'::character varying, 'geolocalizado'::character varying]::text[])),
  latitud numeric,
  longitud numeric,
  hora_registro timestamp with time zone DEFAULT now(),
  dispositivo text,
  ip_address character varying,
  CONSTRAINT asistencias_pkey PRIMARY KEY (id),
  CONSTRAINT asistencias_sesion_id_fkey FOREIGN KEY (sesion_id) REFERENCES public.sesiones_clase(id),
  CONSTRAINT asistencias_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES auth.users(id)
);
CREATE TABLE public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action character varying NOT NULL,
  table_name character varying,
  record_id uuid,
  changes jsonb,
  ip_address character varying,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.calificaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inscripcion_id uuid NOT NULL,
  tipo character varying NOT NULL,
  nombre character varying NOT NULL,
  valor numeric NOT NULL CHECK (valor >= 0::numeric),
  valor_maximo numeric DEFAULT 10 CHECK (valor_maximo > 0::numeric),
  peso numeric NOT NULL CHECK (peso >= 0::numeric AND peso <= 100::numeric),
  fecha date DEFAULT CURRENT_DATE,
  comentarios text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT calificaciones_pkey PRIMARY KEY (id),
  CONSTRAINT calificaciones_inscripcion_id_fkey FOREIGN KEY (inscripcion_id) REFERENCES public.inscripciones(id)
);
CREATE TABLE public.grupos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  materia_id uuid NOT NULL,
  docente_id uuid NOT NULL,
  periodo character varying NOT NULL,
  horario character varying,
  salon character varying,
  cupo_maximo integer DEFAULT 30,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT grupos_pkey PRIMARY KEY (id),
  CONSTRAINT grupos_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id),
  CONSTRAINT grupos_docente_id_fkey FOREIGN KEY (docente_id) REFERENCES public.profiles(user_id)
);
CREATE TABLE public.inscripciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  estudiante_id uuid NOT NULL,
  grupo_id uuid NOT NULL,
  fecha_inscripcion timestamp with time zone DEFAULT now(),
  estado character varying DEFAULT 'activo'::character varying CHECK (estado::text = ANY (ARRAY['activo'::character varying, 'completado'::character varying, 'abandonado'::character varying]::text[])),
  CONSTRAINT inscripciones_pkey PRIMARY KEY (id),
  CONSTRAINT inscripciones_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES auth.users(id),
  CONSTRAINT inscripciones_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.grupos(id)
);
CREATE TABLE public.materias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre character varying NOT NULL,
  codigo character varying NOT NULL UNIQUE,
  creditos integer NOT NULL CHECK (creditos >= 1 AND creditos <= 10),
  semestre integer CHECK (semestre >= 1 AND semestre <= 10),
  descripcion text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT materias_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  user_id uuid NOT NULL,
  nombre character varying NOT NULL,
  apellido character varying NOT NULL,
  foto_url text,
  matricula character varying NOT NULL UNIQUE,
  telefono character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  role character varying DEFAULT 'estudiante'::character varying CHECK (role::text = ANY (ARRAY['admin'::character varying, 'docente'::character varying, 'estudiante'::character varying]::text[])),
  email character varying,
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.sesiones_clase (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL,
  fecha date NOT NULL,
  hora_inicio time without time zone NOT NULL,
  hora_fin time without time zone,
  token_sesion character varying NOT NULL UNIQUE,
  expira_en timestamp with time zone NOT NULL,
  activa boolean DEFAULT true,
  notas text,
  created_at timestamp with time zone DEFAULT now(),
  tema text,
  qr_token text UNIQUE,
  qr_generado_at timestamp with time zone,
  qr_expira_at timestamp with time zone,
  qr_activo boolean DEFAULT false,
  CONSTRAINT sesiones_clase_pkey PRIMARY KEY (id),
  CONSTRAINT sesiones_clase_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.grupos(id)
);