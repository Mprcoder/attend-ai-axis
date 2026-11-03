// Attend AI — Backend Database & Auth Configuration
import * as dotenv from 'dotenv';

dotenv.config();

export const backendConfig = {
  port: process.env.PORT || 3000,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || '',
};
