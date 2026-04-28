import { supabase } from './supabase.js'

let cachedAdminPassword = null
let cacheExpiry = 0

export async function getAdminPassword() {
  const now = Date.now()
  
  // Return cached password if still valid (5 minute cache)
  if (cachedAdminPassword && cacheExpiry > now) {
    console.log('[v0] Returning cached admin password')
    return cachedAdminPassword
  }

  try {
    console.log('[v0] Fetching admin password from Supabase')
    const { data, error } = await supabase
      .from('admin_config')
      .select('config_value')
      .eq('config_key', 'admin_password')
      .single()

    if (error) {
      console.error('[v0] Error fetching admin password:', error)
      return null
    }

    if (data) {
      cachedAdminPassword = data.config_value
      cacheExpiry = now + (5 * 60 * 1000) // 5 minute cache
      console.log('[v0] Admin password retrieved from Supabase')
      return cachedAdminPassword
    }

    return null
  } catch (error) {
    console.error('[v0] Exception fetching admin password:', error)
    return null
  }
}

export async function setAdminPassword(newPassword) {
  try {
    console.log('[v0] Updating admin password in Supabase')
    const { data, error } = await supabase
      .from('admin_config')
      .upsert(
        { config_key: 'admin_password', config_value: newPassword, updated_by: 'admin' },
        { onConflict: 'config_key' }
      )
      .select()

    if (error) {
      console.error('[v0] Error updating admin password:', error)
      return { success: false, error }
    }

    // Clear cache
    cachedAdminPassword = null
    cacheExpiry = 0

    console.log('[v0] Admin password updated successfully')
    return { success: true, data }
  } catch (error) {
    console.error('[v0] Exception updating admin password:', error)
    return { success: false, error }
  }
}

export async function clearAdminPasswordCache() {
  cachedAdminPassword = null
  cacheExpiry = 0
  console.log('[v0] Admin password cache cleared')
}
