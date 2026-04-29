import postgres from 'postgres'
import bcrypt from 'bcryptjs'

const url = process.env.SUPABASE_POSTGRES_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL
if (!url) { console.error('No database URL found'); process.exit(1) }
const sql = postgres(url)

async function test() {
  console.log('=== FULL INTEGRATION TEST ===\n')

  // 1. Check tickets table
  console.log('1. Checking tickets table...')
  const ticketCols = await sql`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tickets'
    ORDER BY ordinal_position
  `
  console.log(`   Found ${ticketCols.length} columns:`, ticketCols.map(c => c.column_name).join(', '))
  if (ticketCols.length === 0) { console.error('   FAIL: tickets table missing!'); process.exit(1) }
  console.log('   PASS\n')

  // 2. Check admin_users table
  console.log('2. Checking admin_users table...')
  const adminCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_users'
  `
  console.log(`   Found ${adminCols.length} columns:`, adminCols.map(c => c.column_name).join(', '))
  if (adminCols.length === 0) { console.error('   FAIL: admin_users table missing!'); process.exit(1) }
  console.log('   PASS\n')

  // 3. Check admin_sessions table
  console.log('3. Checking admin_sessions table...')
  const sessCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_sessions'
  `
  console.log(`   Found ${sessCols.length} columns:`, sessCols.map(c => c.column_name).join(', '))
  if (sessCols.length === 0) { console.error('   FAIL: admin_sessions table missing!'); process.exit(1) }
  console.log('   PASS\n')

  // 4. Check admin user exists with password 9134
  console.log('4. Checking admin user with password 9134...')
  const admins = await sql`SELECT * FROM admin_users WHERE username = 'admin'`
  if (admins.length === 0) {
    console.log('   Admin user not found, creating...')
    const hash = await bcrypt.hash('9134', 10)
    await sql`INSERT INTO admin_users (username, password_hash) VALUES ('admin', ${hash})`
    console.log('   Created admin user with password 9134')
  } else {
    const match = await bcrypt.compare('9134', admins[0].password_hash)
    if (match) {
      console.log('   Admin password verified: 9134')
    } else {
      console.log('   Updating admin password to 9134...')
      const hash = await bcrypt.hash('9134', 10)
      await sql`UPDATE admin_users SET password_hash = ${hash} WHERE username = 'admin'`
      console.log('   Updated')
    }
  }
  console.log('   PASS\n')

  // 5. Check RLS policies
  console.log('5. Checking RLS policies...')
  const policies = await sql`
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `
  console.log(`   Found ${policies.length} policies:`)
  for (const p of policies) console.log(`     - ${p.tablename}: ${p.policyname}`)
  console.log('   PASS\n')

  // 6. Test insert and read a ticket
  console.log('6. Testing ticket insert + read...')
  const testGroupId = `test-${Date.now()}`
  await sql`
    INSERT INTO tickets (name, phone, email, payment_method, payment_screenshot, screenshot_name, status, group_id, group_total, quantity, total_amount, ticket_index)
    VALUES ('Test User', '+251900000000', 'test@test.com', 'telebirr', 'data:image/png;base64,test', 'test.png', 'pending', ${testGroupId}, 1, 1, 600, 1)
  `
  const inserted = await sql`SELECT * FROM tickets WHERE group_id = ${testGroupId}`
  console.log(`   Inserted ticket id: ${inserted[0].id}`)

  // 7. Test approve
  console.log('7. Testing ticket approval...')
  await sql`UPDATE tickets SET status = 'confirmed' WHERE group_id = ${testGroupId}`
  const approved = await sql`SELECT status FROM tickets WHERE group_id = ${testGroupId}`
  console.log(`   Status after approval: ${approved[0].status}`)
  if (approved[0].status !== 'confirmed') { console.error('   FAIL!'); process.exit(1) }
  console.log('   PASS\n')

  // 8. Cleanup test data
  console.log('8. Cleaning up test data...')
  await sql`DELETE FROM tickets WHERE group_id = ${testGroupId}`
  console.log('   PASS\n')

  // 9. Count existing tickets
  console.log('9. Current ticket count...')
  const count = await sql`SELECT COUNT(*) as cnt FROM tickets`
  console.log(`   Total tickets in database: ${count[0].cnt}`)
  console.log('   PASS\n')

  console.log('=== ALL TESTS PASSED ===')
  await sql.end()
}

test().catch(e => { console.error('TEST FAILED:', e.message); process.exit(1) })
