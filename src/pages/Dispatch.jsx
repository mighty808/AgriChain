import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { addBlock } from '../utils/blockchain'
import { MainLayout } from '../components/MainLayout'
import { Package, Scale, MapPin, Truck, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'

export function Dispatch() {
  const [produce, setProduce] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [dispatchQty, setDispatchQty] = useState('')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const { user } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    fetchProduce()
  }, [])

  const fetchProduce = async () => {
    try {
      setFetchLoading(true)
      const { data } = await supabase.from('produce').select('*').order('date_received', { ascending: false })
      setProduce(data || [])
    } catch (error) {
      toast.error('Failed to fetch produce')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selected = produce.find((p) => p.id === selectedBatch)
      if (!selected) throw new Error('Please select a batch')

      const qty = parseInt(dispatchQty)
      if (qty <= 0 || qty > selected.quantity)
        throw new Error(`Invalid quantity. Available: ${selected.quantity} kg`)

      await supabase.from('dispatches').insert({
        batch_number: selected.batch_number,
        quantity: qty,
        destination,
        dispatched_by: user.email,
      })

      const newQty = selected.quantity - qty
      if (newQty === 0) {
        await supabase.from('produce').delete().eq('id', selected.id)
      } else {
        await supabase.from('produce').update({ quantity: newQty }).eq('id', selected.id)
      }

      await addBlock(supabase, `DISPATCHED: ${selected.batch_number} | ${qty} | ${destination}`)

      toast.success('Dispatch recorded')
      setSelectedBatch('')
      setDispatchQty('')
      setDestination('')
      navigate('/reports')
    } catch (error) {
      toast.error(error.message || 'Failed to dispatch')
    } finally {
      setLoading(false)
    }
  }

  const selectedProduce = produce.find((p) => p.id === selectedBatch)

  if (fetchLoading) {
    return (
      <MainLayout title="Dispatch">
        <div className="flex items-center justify-center h-96">
          <div className="relative w-12 h-12">
            <div className={`absolute inset-0 border-4 rounded-full ${isDark ? 'border-gray-700' : 'border-gray-300'}`}></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-green-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout breadcrumb={['Dispatch', 'Send Produce']}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-gray-50' : 'text-gray-900'}`}>Dispatch Produce</h1>
          <p className={`text-base mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Ship produce to market or retailers
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 flex items-center gap-2 text-gray-900">
                <Package size={16} /> Select Batch
              </label>
              <select
                required
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              >
                <option value="">Choose a batch...</option>
                {produce.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.batch_number} - {p.name} ({p.quantity} kg)
                  </option>
                ))}
              </select>
            </div>

            {selectedProduce && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-green-700 dark:text-green-400">
                  <BarChart3 size={18} /> Available: <span className="text-lg font-bold">{selectedProduce.quantity} kg</span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-gray-900">
                <Scale size={16} /> Quantity (kg)
              </label>
              <input
                type="number"
                required
                min="0"
                max={selectedProduce?.quantity}
                value={dispatchQty}
                onChange={(e) => setDispatchQty(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-gray-900">
                <MapPin size={16} /> Destination
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm sm:text-base transition-all focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="Market A, Retailer B..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selectedBatch}
              className="w-full py-2.5 sm:py-3 rounded-lg font-bold text-white text-sm sm:text-base transition-all bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : <><Truck size={18} /> Dispatch</>}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}
