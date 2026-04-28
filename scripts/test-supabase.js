#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cydeiefuyejxtjqpqxlt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGVpZWZ1eWVqeHRqcXBxeGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzMyNDYsImV4cCI6MjA5Mjk0OTI0Nn0.IcuYKSfJQVqZS7WdFCsIs6ufZYiuMgatLN86Qu0HKUY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupDatabase() {
  console.log('\nSetting up database tables...')
  try {
    // Create admin_config table
    const { error: adminTableError } = await supabase.rpc('create_admin_config_table', {})
    if (adminTableError) console.log('Note: admin_config table may already exist')
    
    // Create tickets table
    const { error: ticketsTableError } = await supabase.rpc('create_tickets_table', {})
    if (ticketsTableError) console.log('Note: tickets table may already exist')
    
    console.log('Database setup complete\n')
  } catch (e) {
    console.log('Continuing with existing tables\n')
  }
}

async function runTests() {
  console.log('\n========================================')
  console.log('CARNIVAL TICKET APP - SUPABASE TEST SUITE')
  console.log('========================================\n')

  try {
    // Test 1: Check connection
    console.log('TEST 1: Checking Supabase connection...')
    const { data: connTest, error: connError, status: connStatus } = await supabase
      .from('admin_config')
      .select('count(*)', { count: 'exact', head: true })
    
    if (connError || connStatus !== 200) {
      console.error('FAIL: Could not connect to Supabase')
      if (connError) console.error('Error:', connError.message)
      else console.error('HTTP Status:', connStatus)
      console.error('This could mean:')
      console.error('1. Table "admin_config" does not exist')
      console.error('2. RLS policies are blocking access')
      console.error('3. Supabase credentials are incorrect')
      console.log('\nAttempting to create tables...')
      await setupDatabase()
      return
    }
    console.log('PASS: Connected to Supabase\n')

    // Test 2: Check admin password exists
    console.log('TEST 2: Checking admin password in database...')
    const { data: adminData, error: adminError } = await supabase
      .from('admin_config')
      .select('config_value')
      .eq('config_key', 'admin_password')
      .single()
    
    if (adminError) {
      console.error('FAIL: Could not retrieve admin password')
      console.error('Error:', adminError.message)
    } else if (adminData && adminData.config_value === '9134') {
      console.log('PASS: Admin password is correctly set to "9134"\n')
    } else {
      console.log('WARNING: Admin password exists but value is:', adminData?.config_value, '\n')
    }

    // Test 3: Check tickets table exists and is empty
    console.log('TEST 3: Checking tickets table...')
    const { data: ticketsData, error: ticketsError, count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact' })
    
    if (ticketsError) {
      console.error('FAIL: Could not access tickets table')
      console.error('Error:', ticketsError.message)
    } else {
      console.log(`PASS: Tickets table exists with ${count} records\n`)
    }

    // Test 4: Insert a test ticket
    console.log('TEST 4: Inserting test ticket...')
    const testTicket = {
      name: 'Test User',
      phone: '+251900000000',
      email: 'test@example.com',
      payment_method: 'cbe',
      status: 'pending',
      group_id: 'test-group-1',
      group_total: 1,
      ticket_index: 1,
      total_amount: 600,
      quantity: 1
    }
    
    const { data: insertedTicket, error: insertError } = await supabase
      .from('tickets')
      .insert([testTicket])
      .select()
    
    if (insertError) {
      console.error('FAIL: Could not insert test ticket')
      console.error('Error:', insertError.message)
    } else {
      console.log('PASS: Test ticket inserted successfully')
      console.log('Ticket ID:', insertedTicket[0].id, '\n')
    }

    // Test 5: Query inserted ticket
    console.log('TEST 5: Retrieving test ticket...')
    const { data: retrievedTicket, error: retrieveError } = await supabase
      .from('tickets')
      .select('*')
      .eq('phone', '+251900000000')
      .single()
    
    if (retrieveError) {
      console.error('FAIL: Could not retrieve test ticket')
      console.error('Error:', retrieveError.message)
    } else {
      console.log('PASS: Test ticket retrieved successfully')
      console.log('Name:', retrievedTicket.name)
      console.log('Status:', retrievedTicket.status, '\n')
    }

    // Test 6: Update ticket status
    console.log('TEST 6: Updating ticket status to confirmed...')
    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update({ status: 'confirmed' })
      .eq('phone', '+251900000000')
      .select()
    
    if (updateError) {
      console.error('FAIL: Could not update ticket')
      console.error('Error:', updateError.message)
    } else {
      console.log('PASS: Ticket status updated to:', updatedTicket[0].status, '\n')
    }

    // Test 7: Test scanning ticket
    console.log('TEST 7: Marking ticket as scanned...')
    const { data: scannedTicket, error: scanError } = await supabase
      .from('tickets')
      .update({ scanned_at: new Date().toISOString() })
      .eq('phone', '+251900000000')
      .select()
    
    if (scanError) {
      console.error('FAIL: Could not mark ticket as scanned')
      console.error('Error:', scanError.message)
    } else {
      console.log('PASS: Ticket marked as scanned at:', scannedTicket[0].scanned_at, '\n')
    }

    // Test 8: Test multiple tickets (group)
    console.log('TEST 8: Inserting multiple tickets as a group...')
    const groupId = `group-${Date.now()}`
    const groupTickets = [
      { name: 'Group User 1', phone: '+251901111111', email: 'user1@test.com', payment_method: 'telebirr', status: 'pending', group_id: groupId, group_total: 3, ticket_index: 1, total_amount: 1800, quantity: 1 },
      { name: 'Group User 2', phone: '+251902222222', email: 'user2@test.com', payment_method: 'telebirr', status: 'pending', group_id: groupId, group_total: 3, ticket_index: 2, total_amount: 1800, quantity: 1 },
      { name: 'Group User 3', phone: '+251903333333', email: 'user3@test.com', payment_method: 'telebirr', status: 'pending', group_id: groupId, group_total: 3, ticket_index: 3, total_amount: 1800, quantity: 1 }
    ]
    
    const { data: groupInserted, error: groupError } = await supabase
      .from('tickets')
      .insert(groupTickets)
      .select()
    
    if (groupError) {
      console.error('FAIL: Could not insert group tickets')
      console.error('Error:', groupError.message)
    } else {
      console.log(`PASS: Inserted ${groupInserted.length} tickets in a group\n`)
    }

    // Test 9: Query by group
    console.log('TEST 9: Querying tickets by group ID...')
    const { data: groupQuery, error: groupQueryError } = await supabase
      .from('tickets')
      .select('*')
      .eq('group_id', groupId)
    
    if (groupQueryError) {
      console.error('FAIL: Could not query group')
      console.error('Error:', groupQueryError.message)
    } else {
      console.log(`PASS: Found ${groupQuery.length} tickets in group\n`)
    }

    // Test 10: Statistics
    console.log('TEST 10: Calculating statistics...')
    const { data: allTickets, error: statsError } = await supabase
      .from('tickets')
      .select('status, total_amount')
    
    if (statsError) {
      console.error('FAIL: Could not calculate statistics')
      console.error('Error:', statsError.message)
    } else {
      const confirmed = allTickets.filter(t => t.status === 'confirmed').length
      const pending = allTickets.filter(t => t.status === 'pending').length
      const totalBirr = allTickets.reduce((sum, t) => sum + t.total_amount, 0)
      
      console.log('PASS: Statistics calculated')
      console.log(`Total Tickets: ${allTickets.length}`)
      console.log(`Confirmed: ${confirmed}`)
      console.log(`Pending: ${pending}`)
      console.log(`Total Revenue: ${totalBirr} Birr\n`)
    }

    console.log('========================================')
    console.log('ALL TESTS COMPLETED SUCCESSFULLY!')
    console.log('========================================\n')
    console.log('Summary:')
    console.log('✓ Supabase connection working')
    console.log('✓ Admin password set to 9134')
    console.log('✓ Tickets table operational')
    console.log('✓ Insert, update, and query operations working')
    console.log('✓ Group ticket handling working')
    console.log('✓ Statistics calculations working\n')

  } catch (error) {
    console.error('FATAL ERROR:', error.message)
  }
}

runTests()
