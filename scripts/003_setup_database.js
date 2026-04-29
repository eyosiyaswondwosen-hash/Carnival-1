import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const postgresUrl = process.env.POSTGRES_URL_NON_POOLING

if (!supabaseUrl || !supabaseServiceKey || !postgresUrl) {
  console.error('Missing required environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  console.error('POSTGRES_URL_NON_POOLING:', !!postgresUrl)
  process.exit(1)
}

console.log('Connecting to database...')

// Run schema SQL using direct postgres connection
const sql = postgres(postgresUrl, { max: 1, ssl: 'require' })

try {
  const schemaPath = path.join(__dirname, '001_create_admin_schema.sql')
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8')

  console.log('Executing schema SQL...')
  await sql.unsafe(schemaSQL)
  console.log('Schema created successfully')

  // Seed admin user with bcrypt-hashed password
  const password = '9134'
  const passwordHash = await bcrypt.hash(password, 10)

  console.log('Seeding admin user...')
  await sql`
    insert into public.admin_users (username, password_hash)
    values ('admin', ${passwordHash})
    on conflict (username) do update set password_hash = ${passwordHash}
  `

  console.log('Admin user seeded successfully')
  console.log('Username: admin')
  console.log('Password: 9134')

  // Verify
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: admins } = await supabase.from('admin_users').select('id, username, created_at')
  console.log('Admin users in DB:', admins)

  const { data: tickets, error: ticketsErr } = await supabase.from('tickets').select('id').limit(1)
  if (ticketsErr) {
    console.error('Tickets table error:', ticketsErr.message)
  } else {
    console.log('Tickets table accessible')
  }
} catch (err) {
  console.error('Error setting up database:', err.message)
  console.error(err)
  process.exit(1)
} finally {
  await sql.end()
}

console.log('\nDatabase setup complete!')
