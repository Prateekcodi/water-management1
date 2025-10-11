import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, User, Home, Alert, SensorData } from '../../lib/supabase'
import { 
  User as UserIcon, 
  Home as HomeIcon, 
  AlertTriangle, 
  Activity, 
  Users, 
  Shield, 
  BarChart3,
  Settings,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react'

const AdminProfile: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHomes: 0,
    activeAlerts: 0,
    totalSensors: 0
  })
  const [users, setUsers] = useState<User[]>([])
  const [homes, setHomes] = useState<Home[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Fetch homes
      const { data: homesData, error: homesError } = await supabase
        .from('homes')
        .select(`
          *,
          users (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (homesError) throw homesError

      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select(`
          *,
          homes (
            name,
            users (
              full_name
            )
          )
        `)
        .eq('resolved', false)
        .order('created_at', { ascending: false })

      if (alertsError) throw alertsError

      // Fetch sensor data count
      const { count: sensorsCount, error: sensorsError } = await supabase
        .from('sensor_data')
        .select('*', { count: 'exact', head: true })

      if (sensorsError) throw sensorsError

      setUsers(usersData || [])
      setHomes(homesData || [])
      setAlerts(alertsData || [])
      setStats({
        totalUsers: usersData?.length || 0,
        totalHomes: homesData?.length || 0,
        activeAlerts: alertsData?.length || 0,
        totalSensors: sensorsCount || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will also delete all their homes and data.')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      fetchDashboardData()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const handleDeleteHome = async (homeId: string) => {
    if (!confirm('Are you sure you want to delete this home? This will also delete all associated data.')) return

    try {
      const { error } = await supabase
        .from('homes')
        .delete()
        .eq('id', homeId)

      if (error) throw error
      fetchDashboardData()
    } catch (error) {
      console.error('Error deleting home:', error)
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ resolved: true })
        .eq('id', alertId)

      if (error) throw error
      fetchDashboardData()
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Admin Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.full_name}</h1>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Shield className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600 font-medium">Administrator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Homes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalHomes}</p>
            </div>
            <HomeIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-3xl font-bold text-red-500">{stats.activeAlerts}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sensor Readings</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSensors}</p>
            </div>
            <Activity className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Users Management */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Users Management
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">{user.full_name}</td>
                  <td className="py-3 px-4 text-gray-600">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-blue-500 hover:text-blue-700">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-500 hover:text-green-700">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      {user.role !== 'admin' && (
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Homes Management */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HomeIcon className="h-5 w-5" />
          Homes Management
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Home Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Address</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Owner</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {homes.map((home) => (
                <tr key={home.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">{home.name}</td>
                  <td className="py-3 px-4 text-gray-600">{home.address}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {home.users?.full_name} ({home.users?.email})
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(home.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-blue-500 hover:text-blue-700">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-500 hover:text-green-700">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteHome(home.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Active Alerts
        </h2>
        {alerts.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No active alerts</p>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        {alert.alert_type.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {alert.homes?.users?.full_name} - {alert.homes?.name}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Level: {alert.level_cm}cm ({alert.percent_full}%)</span>
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminProfile