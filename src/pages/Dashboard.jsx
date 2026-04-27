import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { MainLayout } from '../components/MainLayout'
import { Package, Layers, Truck, AlertCircle } from 'lucide-react'

export function Dashboard() {
  const [totalStock, setTotalStock] = useState(0)
  const [totalBatches, setTotalBatches] = useState(0)
  const [dispatchesToday, setDispatchesToday] = useState(0)
  const [lowStockAlerts, setLowStockAlerts] = useState([])
  const [recentDispatches, setRecentDispatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const produceSubscription = supabase
      .channel('produce-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produce' }, () => fetchData())
      .subscribe()
    const dispatchSubscription = supabase
      .channel('dispatch-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatches' }, () => fetchData())
      .subscribe()
    return () => {
      produceSubscription.unsubscribe()
      dispatchSubscription.unsubscribe()
    }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: allProduce } = await supabase.from('produce').select('id, name, quantity')
      const total = allProduce?.reduce((sum, item) => sum + item.quantity, 0) || 0
      setTotalStock(total)
      setTotalBatches(allProduce?.length || 0)

      if (allProduce) {
        const grouped = allProduce.reduce((acc, item) => {
          const existing = acc.find((p) => p.name === item.name)
          if (existing) {
            existing.totalQuantity += item.quantity
          } else {
            acc.push({ name: item.name, totalQuantity: item.quantity })
          }
          return acc
        }, [])
        setLowStockAlerts(grouped.filter((p) => p.totalQuantity < 50))
      }

      const { data: dispatches } = await supabase
        .from('dispatches')
        .select('*')
        .order('date_dispatched', { ascending: false })
        .limit(5)
      setRecentDispatches(dispatches || [])

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayCount = dispatches?.filter((d) => new Date(d.date_dispatched) >= today).length || 0
      setDispatchesToday(todayCount)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 rounded-full border-gray-300"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-green-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">Live warehouse overview.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button className="px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm md:text-base">
              New dispatch
            </button>
            <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-all text-sm md:text-base">
              Add produce
            </button>
          </div>
        </div>

        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Total Stock - Prominent Green Card */}
          <div className="sm:col-span-1 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-green-100 text-xs md:text-sm font-semibold uppercase tracking-wide">Total Stock</p>
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold mt-2 sm:mt-3">{totalStock.toLocaleString()}</p>
                <p className="text-green-100 text-xs md:text-sm mt-1">kg</p>
                <p className="text-green-100 text-xs mt-3 sm:mt-4">{totalBatches} batches</p>
              </div>
              <div className="bg-white/20 rounded-full p-2 sm:p-3 flex-shrink-0">
                <Package size={24} className="text-white" />
              </div>
            </div>
          </div>

          {/* Produce Types */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm font-semibold uppercase tracking-wide">Produce Types</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-2 sm:mt-3">{totalBatches}</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-3 sm:mt-4">Distinct items</p>
              </div>
              <div className="bg-green-50 rounded-full p-2 sm:p-3 flex-shrink-0">
                <Layers size={22} className="text-green-600" />
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm font-semibold uppercase tracking-wide">Low Stock</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-2 sm:mt-3">{lowStockAlerts.length}</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-3 sm:mt-4">Below 50 kg</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-full p-2 sm:p-3 flex-shrink-0">
                <AlertCircle size={22} className="text-amber-600" />
              </div>
            </div>
          </div>

          {/* Recent Dispatches */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm font-semibold uppercase tracking-wide">Dispatches</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-2 sm:mt-3">{recentDispatches.length}</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-3 sm:mt-4">Last 5 shipments</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full p-2 sm:p-3 flex-shrink-0">
                <Truck size={22} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Low Stock Alerts Section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 sm:mb-5 flex items-center gap-2">
              <div className="bg-amber-100 rounded-full p-2">
                <AlertCircle size={18} className="text-amber-700" />
              </div>
              Low Stock Alerts
            </h3>
            {lowStockAlerts.length > 0 ? (
              <div className="space-y-4">
                {lowStockAlerts.map((alert) => (
                  <div key={alert.name} className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 gap-2">
                    <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium truncate">{alert.name}</span>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex-shrink-0">
                      {alert.totalQuantity} kg
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-green-800 dark:text-green-400">All produce types above 50 kg. ✓</p>
              </div>
            )}
          </div>

          {/* Recent Dispatches Section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 sm:mb-5 flex items-center gap-2">
              <div className="bg-blue-100 rounded-full p-2">
                <Truck size={18} className="text-blue-700" />
              </div>
              Recent Dispatches
            </h3>
            {recentDispatches.length > 0 ? (
              <div className="space-y-4">
                {recentDispatches.slice(0, 3).map((dispatch) => (
                  <div key={dispatch.id} className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">{dispatch.batch_number}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{dispatch.destination}</p>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex-shrink-0">{dispatch.quantity} kg</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">No dispatches yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

