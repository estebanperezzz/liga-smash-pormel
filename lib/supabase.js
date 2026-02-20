import { createClient } from '@supabase/supabase-js';

// Cliente con service role key — solo para uso en el servidor (API routes)
// NUNCA importar este archivo desde componentes cliente
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const CHAMPION_IMAGES_BUCKET = 'champion-images';
