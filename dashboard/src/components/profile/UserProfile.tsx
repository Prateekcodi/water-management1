import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, Home } from '../../lib/supabase'
import { User, Home as HomeIcon, MapPin, Calendar, Shield, Edit3, Plus, Trash2 } from 'lucide-react'

const UserProfile: React.FC = () => {
  const { user, isAdmin } = useAuth()
  const [homes, setHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddHome, setShowAddHome] = useState(false)
  const [newHome, setNewHome] = useState({
    name: '',
    address: '',
    town_id: ''
  })

  useEffect(() => {
    if (user) {
      fetchHomes()
    }
  }, [user])

  const fetchHomes = async () => {
    try {
      const { data, error } = await supabase
        .from('homes')
        .select(`
          *,
          towns (
            name,
            state,
            country
          )
        `)
        .eq('user_id', user?.id)

      if (error) throw error
      setHomes(data || [])
    } catch (error) {
      console.error('Error fetching homes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddHome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { error } = await supabase
        .from('homes')
        .insert({
          ...newHome,
          user_id: user.id
        })

      if (error) throw error

      setNewHome({ name: '', address: '', town_id: '' })
      setShowAddHome(false)
      fetchHomes()
    } catch (error) {
      console.error('Error adding home:', error)
    }
  }

  const handleDeleteHome = async (homeId: string) => {
    if (!confirm('Are you sure you want to delete this home?')) return

    try {
      const { error } = await supabase
        .from('homes')
        .delete()
        .eq('id', homeId)

      if (error) throw error
      fetchHomes()
    } catch (error) {
      console.error('Error deleting home:', error)
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.full_name}</h1>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600 capitalize">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Homes Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <HomeIcon className="h-5 w-5" />
            My Homes
          </h2>
          {homes.length < 1 && (
            <button
              onClick={() => setShowAddHome(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Home
            </button>
          )}
        </div>

        {homes.length === 0 ? (
          <div className="text-center py-8">
            <HomeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No homes added yet</h3>
            <p className="text-gray-600 mb-4">Add your first home to start monitoring your water system</p>
            <button
              onClick={() => setShowAddHome(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Your First Home
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homes.map((home) => (
              <div key={home.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{home.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      {home.address}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Added on {new Date(home.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteHome(home.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Home Modal */}
      {showAddHome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Home</h3>
            <form onSubmit={handleAddHome} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Home Name
                </label>
                <input
                  type="text"
                  value={newHome.name}
                  onChange={(e) => setNewHome({ ...newHome, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., My House"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newHome.address}
                  onChange={(e) => setNewHome({ ...newHome, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main St, City"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Town ID
                </label>
                <input
                  type="text"
                  value={newHome.town_id}
                  onChange={(e) => setNewHome({ ...newHome, town_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter town ID"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddHome(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Add Home
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfile