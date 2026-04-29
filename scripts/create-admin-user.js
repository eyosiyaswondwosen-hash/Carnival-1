import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('[v0] POSTGRES_URL not set');
  process.exit(1);
}

async function createAdminUser() {
  const db = postgres(connectionString);

  try {
    console.log('[v0] Generating new admin password...');
    
    // Generate a random 12-character alphanumeric password with special chars
    const passwordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += passwordChars.charAt(Math.floor(Math.random() * passwordChars.length));
    }

    console.log('[v0] Hashing password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log('[v0] Creating admin user in database...');
    const result = await db`
      INSERT INTO admin_users (username, password_hash)
      VALUES ('admin', ${hashedPassword})
      ON CONFLICT (username) DO UPDATE
      SET password_hash = ${hashedPassword}
      RETURNING id, username, created_at
    `;

    console.log('\n✅ Admin user created successfully!\n');
    console.log('Username:', result[0].username);
    console.log('Password:', newPassword);
    console.log('Created at:', result[0].created_at);
    console.log('\n⚠️  Save this password in a secure location. You will need it to access the admin dashboard.');

    await db.end();
  } catch (error) {
    console.error('[v0] Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();
