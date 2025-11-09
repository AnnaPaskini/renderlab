// lib/supabase.ts
import { createClient } from './supabaseClient';

// Создаём один инстанс для browser
export const supabase = createClient();
