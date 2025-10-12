import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

export interface Home {
  id: string
  user_id: string
  name: string
  address: string
  town_id: string
  created_at: string
  updated_at: string
  users?: {
    full_name: string
    email: string
  }
  towns?: {
    name: string
    state: string
    country: string
  }
}

export interface Town {
  id: string
  name: string
  state: string
  country: string
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  home_id: string
  alert_type: 'LEAK_DETECTED' | 'OVERFLOW' | 'PUMP_FAULT' | 'LOW_LEVEL'
  message: string
  level_cm: number
  percent_full: number
  resolved: boolean
  created_at: string
  updated_at: string
  homes?: {
    name: string
    users: {
      full_name: string
    }
  }
}

export interface SensorData {
  id: string
  home_id: string
  water_level: number
  temperature: number
  ph_level: number
  turbidity: number
  timestamp: string
}

export interface BlockchainData {
  id: string
  home_id: string
  transaction_hash: string
  block_number: number
  gas_used: number
  timestamp: string
}