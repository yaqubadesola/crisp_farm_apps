'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, X, Wheat, AlertTriangle, BarChart3, GitMerge, Lock, TrendingUp, TrendingDown } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { fmt } from '@/lib/utils'
import type { ApiResponse, FarmCycle, CycleProfit, CycleMortality, Pond, BackfillResult } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  HARVESTED: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-gray-100 text-gray-500',
}

export default function CyclesPage() {
  const qc = useQueryClient()
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')
  const today = format(new Date(), 'yyyy-MM-dd')

  const [showCreate, setShowCreate] = useState(false)
  const [harvestCycle, setHarvestCycle] = useState<FarmCycle | null>(null)
  const [mortalityCycle, setMortalityCycle] = useState<FarmCycle | null>(null)
  const [profitCycle, setProfitCycle] = useState<FarmCycle | null>(null)
  const [backfillCycle, setBackfillCycle] = useState<FarmCycle | null>(null)
  const [backfillResult, setBackfillResult] = useState<BackfillResult | null>(null)
  const [closingCycle, setClosingCycle] = useState<FarmCycle | null>(null)

  // Create form
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [pondId, setPondId] = useState('')
  const [fingerlingCount, setFingerlingCount] = useState('')
  const [expectedYield, setExpectedYield] = useState('')
  const [notes, setNotes] = useState('')

  // Harvest form
  const [actualYield, setActualYield] = useState('')
  const [endDate, setEndDate] = useState(today)

  // Mortality form
  const [mortalityCount, setMortalityCount] = useState('')
  const [mortalityCause, setMortalityCause] = useState('')
  const [mortalityDate, setMortalityDate] = useState(today)

  const { data: cycles, isLoading } = useQuery({
    queryKey: ['cycles'],
    queryFn: () => api.get<ApiResponse<FarmCycle[]>>('/cycles').then(r => r.data.data),
  })

  const { data: ponds } = useQuery({
    queryKey: ['ponds'],
    queryFn: () => api.get<ApiResponse<Pond[]>>('/ponds?activeOnly=true').then(r => r.data.data),
    retry: false,
  })

  const { data: profit } = useQuery({
    queryKey: ['cycle-profit', profitCycle?.id],
    queryFn: () => api.get<ApiResponse<CycleProfit>>(`/cycles/${profitCycle!.id}/profit`).then(r => r.data.data),
    enabled: !!profitCycle,
  })

  const { data: mortalities } = useQuery({
    queryKey: ['mortalities', mortalityCycle?.id],
    queryFn: () => api.get<ApiResponse<CycleMortality[]>>(`/cycles/${mortalityCycle!.id}/mortalities`).then(r => r.data.data),
    enabled: !!mortalityCycle,
  })

  const { mutate: createCycle, isPending: creating } = useMutation({
    mutationFn: () => api.post('/cycles', {
      name, startDate, pondId: pondId ? parseInt(pondId) : null,
      fingerlingCount: fingerlingCount ? parseInt(fingerlingCount) : null,
      expectedYieldKg: expectedYield ? parseFloat(expectedYield) : null,
      notes: notes || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cycles'] }); setShowCreate(false); resetCreate() },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Failed'),
  })

  const { mutate: doHarvest, isPending: harvesting } = useMutation({
    mutationFn: () => api.post(`/cycles/${harvestCycle!.id}/harvest`, {
      actualYieldKg: parseFloat(actualYield), endDate
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cycles'] }); setHarvestCycle(null) },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Failed'),
  })

  const { mutate: doMortality, isPending: recording } = useMutation({
    mutationFn: () => api.post(`/cycles/${mortalityCycle!.id}/mortalities`, {
      count: parseInt(mortalityCount), cause: mortalityCause || null, recordedDate: mortalityDate
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cycles'] })
      qc.invalidateQueries({ queryKey: ['mortalities', mortalityCycle?.id] })
      setMortalityCount(''); setMortalityCause('')
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Failed'),
  })

  const { mutate: doClose, isPending: closing } = useMutation({
    mutationFn: () => api.post(`/cycles/${closingCycle!.id}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cycles'] })
      setClosingCycle(null)
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Failed to close cycle'),
  })

  const { mutate: doBackfill, isPending: backfilling } = useMutation({
    mutationFn: () => api.post<ApiResponse<BackfillResult>>(`/cycles/${backfillCycle!.id}/backfill`).then(r => r.data.data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['cycles'] })
      setBackfillResult(result)
      setBackfillCycle(null)
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Backfill failed'),
  })

  const resetCreate = () => { setName(''); setStartDate(today); setPondId(''); setFingerlingCount(''); setExpectedYield(''); setNotes('') }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">Farm Cycles</h2>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
          <Plus size={15} /> New Cycle
        </button>
      </div>

      {isLoading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="space-y-3">
          {(!cycles || cycles.length === 0) && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
              <Wheat size={32} className="mx-auto mb-2 opacity-30" />
              <p>No farm cycles yet. Start your first cycle.</p>
            </div>
          )}
          {cycles?.map(cycle => (
            <div key={cycle.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-base">{cycle.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[cycle.status]}`}>
                      {cycle.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Started {cycle.startDate}
                    {cycle.endDate && ` · Ended ${cycle.endDate}`}
                    {cycle.pondName && ` · ${cycle.pondName}`}
                  </p>
                  <div className="flex items-center gap-4 text-sm mt-2 text-gray-700">
                    {cycle.fingerlingCount != null && <span>{cycle.fingerlingCount.toLocaleString()} fingerlings</span>}
                    {cycle.expectedYieldKg != null && <span>Target: {Number(cycle.expectedYieldKg).toFixed(1)} kg</span>}
                    {cycle.actualYieldKg != null && <span>Harvested: {Number(cycle.actualYieldKg).toFixed(1)} kg</span>}
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangle size={12} /> {cycle.totalMortalities} deaths
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => { setProfitCycle(cycle) }}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-gray-50">
                    <BarChart3 size={12} /> P&L
                  </button>
                  <button onClick={() => { setMortalityCycle(cycle) }}
                    className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-700 rounded-lg text-xs hover:bg-red-50">
                    <AlertTriangle size={12} /> Mortality
                  </button>
                  {isAdmin && (
                    <button onClick={() => setBackfillCycle(cycle)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-indigo-200 text-indigo-700 rounded-lg text-xs hover:bg-indigo-50">
                      <GitMerge size={12} /> Assign Records
                    </button>
                  )}
                  {cycle.status === 'ACTIVE' && (
                    <button onClick={() => { setHarvestCycle(cycle); setActualYield(''); setEndDate(today) }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700">
                      <Wheat size={12} /> Harvest
                    </button>
                  )}
                  {cycle.status === 'HARVESTED' && isAdmin && (
                    <button onClick={() => setClosingCycle(cycle)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs hover:bg-gray-800">
                      <Lock size={12} /> Close Cycle
                    </button>
                  )}
                </div>
              </div>

              {/* Inline P&L strip for closed cycles */}
              {cycle.status === 'CLOSED' && (
                <ClosedCyclePnL cycleId={cycle.id} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Close cycle confirm modal */}
      {closingCycle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-gray-100 rounded-xl shrink-0"><Lock size={18} className="text-gray-700" /></div>
              <div>
                <h3 className="font-semibold text-gray-900">Close Cycle?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  This will permanently close <strong>{closingCycle.name}</strong>. No further edits will be possible after closing.
                </p>
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Tip: View P&L first to confirm the numbers look right before closing.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setClosingCycle(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => doClose()} disabled={closing}
                className="flex-1 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
                {closing ? 'Closing…' : 'Close Cycle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create cycle modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">New Farm Cycle</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Name <span className="text-red-500">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Cycle 2025 Q2"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pond <span className="text-gray-400">(optional)</span></label>
              <select value={pondId} onChange={e => setPondId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                <option value="">— None —</option>
                {(Array.isArray(ponds) ? ponds : []).map((p: Pond) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fingerlings</label>
                <input type="number" min="1" value={fingerlingCount} onChange={e => setFingerlingCount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Yield (kg)</label>
                <input type="number" min="0" step="0.1" value={expectedYield} onChange={e => setExpectedYield(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setShowCreate(false); resetCreate() }}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => createCycle()} disabled={creating || !name || !startDate}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {creating ? 'Creating…' : 'Start Cycle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Harvest modal */}
      {harvestCycle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">Record Harvest</h3>
              <button onClick={() => setHarvestCycle(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{harvestCycle.name}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actual Yield (kg) <span className="text-red-500">*</span></label>
              <input type="number" min="0.001" step="0.001" value={actualYield} onChange={e => setActualYield(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setHarvestCycle(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => doHarvest()} disabled={harvesting || !actualYield}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {harvesting ? 'Saving…' : 'Confirm Harvest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mortality modal */}
      {mortalityCycle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">Mortality — {mortalityCycle.name}</h3>
              <button onClick={() => setMortalityCycle(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {/* History */}
            {mortalities && mortalities.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">History</p>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {mortalities.map(m => (
                    <div key={m.id} className="flex justify-between text-xs text-gray-600 py-1 border-b border-gray-50">
                      <span>{m.recordedDate} · {m.cause ?? 'No cause'}</span>
                      <span className="text-red-600 font-medium">–{m.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Count <span className="text-red-500">*</span></label>
              <input type="number" min="1" value={mortalityCount} onChange={e => setMortalityCount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cause <span className="text-gray-400">(optional)</span></label>
              <input value={mortalityCause} onChange={e => setMortalityCause(e.target.value)}
                placeholder="e.g. disease, oxygen deficiency…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={mortalityDate} onChange={e => setMortalityDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMortalityCycle(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Close</button>
              <button onClick={() => doMortality()} disabled={recording || !mortalityCount}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {recording ? 'Recording…' : 'Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backfill confirm modal */}
      {backfillCycle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-100 rounded-xl shrink-0"><GitMerge size={18} className="text-indigo-600" /></div>
              <div>
                <h3 className="font-semibold text-gray-900">Assign Unlinked Records?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  All expenses, sales, and inventory transactions that are <strong>not yet assigned</strong> to any cycle will be linked to <strong>{backfillCycle.name}</strong>.
                </p>
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  This action cannot be undone. Only records with no cycle attached are affected.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setBackfillCycle(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => doBackfill()}
                disabled={backfilling}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {backfilling ? 'Assigning…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backfill result modal */}
      {backfillResult && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">Records Assigned</h3>
              <button onClick={() => setBackfillResult(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-600">
              Successfully linked unassigned records to <strong>{backfillResult.cycleName}</strong>:
            </p>
            <div className="space-y-2">
              {[
                { label: 'Expenses', value: backfillResult.expensesUpdated },
                { label: 'Sales', value: backfillResult.salesUpdated },
                { label: 'Inventory Transactions', value: backfillResult.inventoryTransactionsUpdated },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center px-4 py-2.5 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">{row.label}</span>
                  <span className={`text-sm font-bold ${row.value > 0 ? 'text-indigo-700' : 'text-gray-400'}`}>
                    {row.value > 0 ? `+${row.value}` : '0'}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center px-4 py-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
                <span className="text-sm font-semibold text-indigo-800">Total Updated</span>
                <span className="text-sm font-bold text-indigo-700">{backfillResult.totalUpdated}</span>
              </div>
            </div>
            <button onClick={() => setBackfillResult(null)}
              className="w-full py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
              Done
            </button>
          </div>
        </div>
      )}

      {/* P&L modal */}
      {profitCycle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">P&L — {profitCycle.name}</h3>
              <button onClick={() => setProfitCycle(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {!profit ? (
              <p className="text-sm text-gray-400 text-center py-6">Loading…</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Revenue', value: fmt(profit.totalRevenue), accent: 'text-green-700' },
                    { label: 'Expenses', value: fmt(profit.totalExpenses), accent: 'text-red-600' },
                    { label: 'Net Profit', value: fmt(profit.netProfit), accent: Number(profit.netProfit) >= 0 ? 'text-green-700' : 'text-red-600' },
                    { label: 'ROI', value: `${profit.roiPercent.toFixed(1)}%`, accent: 'text-brand-700' },
                    { label: 'Sales', value: String(profit.totalSalesCount) },
                    { label: 'Mortalities', value: `${profit.totalMortalities} (${profit.lossRatePercent.toFixed(1)}%)`, accent: 'text-red-600' },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-lg px-4 py-3">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className={`font-bold mt-0.5 ${item.accent ?? 'text-gray-900'}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                {profit.expectedYieldKg && profit.actualYieldKg && (
                  <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm">
                    <p className="text-gray-600">Yield: <strong>{Number(profit.actualYieldKg).toFixed(1)} kg</strong> actual vs <strong>{Number(profit.expectedYieldKg).toFixed(1)} kg</strong> expected</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Inline P&L strip shown on closed cycle cards ───────────────────────────
function ClosedCyclePnL({ cycleId }: { cycleId: number }) {
  const { data: profit } = useQuery({
    queryKey: ['cycle-profit', cycleId],
    queryFn: () => api.get<ApiResponse<CycleProfit>>(`/cycles/${cycleId}/profit`).then(r => r.data.data),
  })

  if (!profit) return <div className="mt-3 h-10 bg-gray-50 rounded-lg animate-pulse" />

  const isProfit = Number(profit.netProfit) >= 0
  return (
    <div className={`mt-3 rounded-xl px-4 py-3 flex flex-wrap gap-4 items-center border text-sm ${isProfit ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
      <div className="flex items-center gap-1.5">
        {isProfit
          ? <TrendingUp size={14} className="text-green-600" />
          : <TrendingDown size={14} className="text-red-600" />}
        <span className="text-gray-500">Net P&L:</span>
        <span className={`font-bold ${isProfit ? 'text-green-700' : 'text-red-600'}`}>
          ₦{Number(profit.netProfit).toLocaleString()}
        </span>
      </div>
      <div className="text-gray-400">|</div>
      <div><span className="text-gray-500">Revenue: </span><span className="font-semibold text-gray-800">₦{Number(profit.totalRevenue).toLocaleString()}</span></div>
      <div><span className="text-gray-500">Expenses: </span><span className="font-semibold text-gray-800">₦{Number(profit.totalExpenses).toLocaleString()}</span></div>
      <div><span className="text-gray-500">ROI: </span><span className={`font-semibold ${isProfit ? 'text-green-700' : 'text-red-600'}`}>{profit.roiPercent.toFixed(1)}%</span></div>
      {profit.actualYieldKg && (
        <>
          <div className="text-gray-400">|</div>
          <div><span className="text-gray-500">Yield: </span><span className="font-semibold text-gray-800">{Number(profit.actualYieldKg).toFixed(1)} kg</span></div>
        </>
      )}
    </div>
  )
}
