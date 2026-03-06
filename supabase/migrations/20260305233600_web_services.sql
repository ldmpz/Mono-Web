CREATE TABLE IF NOT EXISTS public.web_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    price TEXT NOT NULL,
    icon TEXT NOT NULL,
    features TEXT[] NOT NULL DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.web_services ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public profiles are viewable by everyone."
ON public.web_services FOR SELECT
USING ( true );

-- Restrict other operations to authenticated users if needed (we'll just use service role for admin for simplicity if needed, but here's basic auth check)
CREATE POLICY "Authenticated users can manipulate web services"
ON public.web_services FOR ALL
USING ( auth.role() = 'authenticated' )
WITH CHECK ( auth.role() = 'authenticated' );

-- Insert default services
INSERT INTO public.web_services (title, price, icon, features, display_order)
VALUES
(
    'Diagnóstico & Roadmap', 
    '$2,500 MXN', 
    'Brain', 
    ARRAY['Auditoría de Procesos Actuales', 'Identificación de Oportunidades IA', 'Plan de Implementación Paso a Paso', 'Estimación de ROI y Costos', 'Sesión de Estrategia (2 Horas)'],
    0
),
(
    'Agentes Inteligentes', 
    'Desde $8,000 MXN', 
    'Bot', 
    ARRAY['Chatbots de Atención al Cliente 24/7', 'Asistentes de Ventas y Lead Gen', 'Integración con WhatsApp/CRM', 'Entrenamiento con Datos Propios', 'Soporte y Mantenimiento Mensual'],
    1
),
(
    'Ecosistema Total', 
    'A Medida', 
    'Workflow', 
    ARRAY['Automatización de Flujos Complejos', 'Conexión de Múltiples Agentes', 'Dashboards de Control en Tiempo Real', 'Infraestructura Escalable en Nube', 'Desarrollo de Software a Medida'],
    2
);
