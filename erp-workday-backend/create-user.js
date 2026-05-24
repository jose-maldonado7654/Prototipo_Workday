const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Usa service_role, NO anon
);

async function createUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test@erp.com',
    password: 'Test123456',
    email_confirm: true,
    user_metadata: {
      first_name: 'Test',
      last_name: 'User'
    }
  });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('✅ Usuario creado:', data.user.email);
    console.log('📝 Credenciales: test@erp.com / Test123456');
  }
}

createUser();