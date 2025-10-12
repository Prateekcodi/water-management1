import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, Loader2, Database, AlertTriangle } from 'lucide-react'

const DatabaseSetup: React.FC = () => {
  const [isChecking, setIsChecking] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [tablesExist, setTablesExist] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkDatabaseSetup()
  }, [])

  const checkDatabaseSetup = async () => {
    try {
      setIsChecking(true)
      setError('')

      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (connectionError) {
        throw new Error(`Database connection failed: ${connectionError.message}`)
      }

      setIsConnected(true)

      // Check if tables exist by trying to query them
      const tables = ['users', 'homes', 'alerts', 'sensor_data', 'towns']
      let existingTables = 0

      for (const table of tables) {
        try {
          const { error } = await supabase
            .from(table)
            .select('*')
            .limit(1)
          
          if (!error) {
            existingTables++
          }
        } catch (e) {
          console.log(`Table ${table} doesn't exist or has issues`)
        }
      }

      if (existingTables === tables.length) {
        setTablesExist(true)
      } else {
        setError(`Only ${existingTables}/${tables.length} tables exist. Please run the SQL setup script.`)
      }

    } catch (err: any) {
      setError(err.message)
      setIsConnected(false)
      setTablesExist(false)
    } finally {
      setIsChecking(false)
    }
  }

  const runSetupScript = () => {
    window.open('https://supabase.com/dashboard/project/nywdoakinnaeguhulxhk/sql', '_blank')
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Checking Database Setup</h2>
          <p className="text-gray-600">Please wait while we verify your Supabase connection...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Database Connection Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Please check:</p>
            <ul className="text-sm text-gray-500 text-left space-y-1">
              <li>• Your Supabase project is running</li>
              <li>• Environment variables are correct</li>
              <li>• Your internet connection is working</li>
            </ul>
          </div>
          <button
            onClick={checkDatabaseSetup}
            className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  if (!tablesExist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <Database className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Database Setup Required</h2>
            <p className="text-gray-600">{error}</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h3 className="font-medium text-yellow-800">Setup Required</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You need to run the SQL setup script in your Supabase dashboard to create the required tables.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Steps to complete setup:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Click the button below to open your Supabase SQL Editor</li>
              <li>Copy the SQL script from the file I provided</li>
              <li>Paste it into the SQL Editor and run it</li>
              <li>Come back here and click "Check Again"</li>
            </ol>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={runSetupScript}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <Database className="h-4 w-4" />
              Open Supabase SQL Editor
            </button>
            <button
              onClick={checkDatabaseSetup}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Check Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Database Ready!</h2>
        <p className="text-gray-600 mb-6">Your Supabase database is properly configured and ready to use.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
        >
          Continue to App
        </button>
      </div>
    </div>
  )
}

export default DatabaseSetup