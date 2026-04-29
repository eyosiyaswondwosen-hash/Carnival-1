import postgres from 'postgres'

const postgresUrl = process.env.POSTGRES_URL_NON_POOLING
const sql = postgres(postgresUrl, { max: 1, ssl: 'require' })

try {
  // Reload PostgREST schema cache
  await sql`NOTIFY pgrst, 'reload schema'`
  console.log('PostgREST schema reload triggered')

  // Verify tables exist
  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public'
    order by table_name
  `
  console.log('Tables in public schema:', tables.map(t => t.table_name))

  const admins = await sql`select id, username, created_at from public.admin_users`
  console.log('Admin users:', admins)

  const ticketCount = await sql`select count(*) from public.tickets`
  console.log('Ticket count:', ticketCount[0].count)
} catch (err) {
  console.error('Error:', err.message)
  process.exit(1)
} finally {
  await sql.end()
}
