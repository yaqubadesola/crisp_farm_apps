'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, AlertTriangle, Package, Pencil, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { ApiResponse, PageResponse, InventoryItem, InventoryTransaction, InventoryCategory } from '@/types'

const CATEGORIES: InventoryCategory[] = ['FEED', 'MEDICATION', 'EQUIPMENT', 'OTHER']
const TX_TYPES = ['PURCHASE', 'USAGE', 'ADJUSTMENT']

const CAT_COLORS: Record<string, string> = {
  FEED: 'bg-green-100 text-green-700',
  MEDICATION: 'bg-blue-100 text-blue-700',
  EQUIPMENT: 'bg-yellow-100 text-yellow-700',
  OTHER: 'bg-gray-100 text-gray-600',
}

const TX_COLORS: Record<string, string> = {
  PURCHASE: 'bg-green-100 text-green-700',
  USAGE: 'bg-red-100 text-red-600',
  ADJUSTMENT: 'bg-yellow-100 text-yellow-700',
}

export default function InventoryPage() {
  const qc = useQueryClient()
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')
  const canEdit = hasRole('ADMIN', 'FARM_MANAGER')

  const [tab, setTab] = useState<'items' | 'transactions'>('items')
  const [showItemForm, setShowItemForm] = useState(false)
  const [showTxForm, setShowTxForm] = useState(false)
  const [txPage, setTxPage] = useState(0)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('')
  const [txItemFilter, setTxItemFilter] = useState('')

  // New item form
  const [itemName, setItemName] = useState('')
  const [itemCategory, setItemCategory] = useState<InventoryCategory>('FEED')
  const [itemUnit, setItemUnit] = useState('kg')
  const [reorderLevel, setReorderLevel] = useState('')

  // Delete item state
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)

  // Edit item state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState<InventoryCategory>('FEED')
  const [editUnit, setEditUnit] = useState('')
  const [editReorder, setEditReorder] = useState('')

  // New transaction form
  const [txItemId, setTxItemId] = useState('')
  const [txType, setTxType] = useState('PURCHASE')
  const [txQty, setTxQty] = useState('')
  const [txUnitCost, setTxUnitCost] = useState('')
  const [txNotes, setTxNotes] = useState('')

  const openEditItem = (item: InventoryItem) => {
    setEditingItem(item)
    setEditName(item.name)
    setEditCategory(item.category)
    setEditUnit(item.unit)
    setEditReorder(item.reorderLevel != null ? String(item.reorderLevel) : '')
  }

  const { data: items, isLoading: loadingItems } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => api.get<ApiResponse<InventoryItem[]>>('/inventory/items').then(r => r.data.data),
  })

  const { data: transactions, isLoading: loadingTx } = useQuery({
    queryKey: ['inventory-tx', txItemFilter, txPage],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(txPage), size: '20' })
      if (txItemFilter) params.set('itemId', txItemFilter)
      return api.get<ApiResponse<PageResponse<InventoryTransaction>>>(`/inventory/transactions?${params}`)
        .then(r => r.data.data)
    },
    enabled: tab === 'transactions',
  })

  const { mutate: deleteItem, isPending: deletingItem } = useMutation({
    mutationFn: (id: number) => api.delete(`/inventory/items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] })
      setDeletingItemId(null)
    },
    onError: (e: any) => {
      alert(e?.response?.data?.message ?? 'Failed to delete item')
      setDeletingItemId(null)
    },
  })

  const { mutate: updateItem, isPending: updatingItem } = useMutation({
    mutationFn: () =>
      api.put(`/inventory/items/${editingItem!.id}`, {
        name: editName,
        category: editCategory,
        unit: editUnit,
        reorderLevel: editReorder ? parseFloat(editReorder) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] })
      setEditingItem(null)
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Failed to update item'),
  })

  const { mutate: createItem, isPending: creatingItem } = useMutation({
    mutationFn: () => api.post('/inventory/items', {
      name: itemName, category: itemCategory, unit: itemUnit,
      reorderLevel: reorderLevel ? parseFloat(reorderLevel) : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] })
      setShowItemForm(false)
      setItemName(''); setItemUnit('kg'); setReorderLevel('')
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Failed'),
  })

  const { mutate: recordTx, isPending: recordingTx } = useMutation({
    mutationFn: () => api.post('/inventory/transactions', {
      itemId: parseInt(txItemId), transactionType: txType,
      quantity: parseFloat(txQty),
      unitCost: txUnitCost ? parseFloat(txUnitCost) : null,
      notes: txNotes || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] })
      qc.invalidateQueries({ queryKey: ['inventory-tx'] })
      setShowTxForm(false)
      setTxItemId(''); setTxQty(''); setTxUnitCost(''); setTxNotes(''); setTxType('PURCHASE')
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Failed'),
  })

  const lowStockItems = items?.filter(i => i.lowStock) ?? []

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">Inventory</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowTxForm(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Plus size={15} /> Record Transaction
          </button>
          <button onClick={() => setShowItemForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
            <Plus size={15} /> Add Item
          </button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800">Low Stock Alert</p>
            <p className="text-xs text-orange-700 mt-0.5">
              {lowStockItems.map(i => `${i.name} (${Number(i.quantityInStock).toFixed(1)} ${i.unit})`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      {tab === 'items' && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <label className="text-gray-600">Category</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="">All</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}
      {tab === 'transactions' && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <label className="text-gray-600">Item</label>
          <select
            value={txItemFilter}
            onChange={e => { setTxItemFilter(e.target.value); setTxPage(0) }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            <option value="">All items</option>
            {items?.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['items', 'transactions'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'items' && (
        loadingItems ? <p className="text-sm text-gray-400">Loading…</p> : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-right">In Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Reorder At</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {(canEdit || isAdmin) && <th className="px-4 py-3 font-medium"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(!items || items.length === 0) && (
                  <tr><td colSpan={(canEdit || isAdmin) ? 6 : 5} className="px-4 py-8 text-center text-gray-400">
                    <Package size={24} className="mx-auto mb-2 opacity-30" />No inventory items
                  </td></tr>
                )}
                {(items ?? [])
                  .filter(item => !categoryFilter || item.category === categoryFilter)
                  .map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${CAT_COLORS[item.category] ?? ''}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {Number(item.quantityInStock).toFixed(2)} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {item.reorderLevel != null ? `${Number(item.reorderLevel).toFixed(1)} ${item.unit}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {item.lowStock ? (
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Low Stock</span>
                      ) : (
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">OK</span>
                      )}
                    </td>
                    {(canEdit || isAdmin) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button
                              onClick={() => openEditItem(item)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="Edit item"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => setDeletingItemId(item.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete item"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'transactions' && (
        loadingTx ? <p className="text-sm text-gray-400">Loading…</p> : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium text-right">Quantity</th>
                    <th className="px-4 py-3 font-medium text-right">Unit Cost</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                    <th className="px-4 py-3 font-medium">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions?.content.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No transactions</td></tr>
                  )}
                  {transactions?.content.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{t.transactionDate}</td>
                      <td className="px-4 py-3 font-medium">{t.itemName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${TX_COLORS[t.transactionType] ?? ''}`}>
                          {t.transactionType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{Number(t.quantity).toFixed(2)} {t.unit}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {t.unitCost != null ? `₦${Number(t.unitCost).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{t.notes ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{t.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactions && transactions.totalPages > 1 && (
              <div className="flex justify-end gap-2 text-sm">
                <button onClick={() => setTxPage(p => p - 1)} disabled={txPage === 0}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
                <span className="px-3 py-1.5 text-gray-600">{txPage + 1} / {transactions.totalPages}</span>
                <button onClick={() => setTxPage(p => p + 1)} disabled={txPage >= transactions.totalPages - 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            )}
          </>
        )
      )}

      {/* Delete item confirm modal */}
      {deletingItemId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-xl"><Trash2 size={18} className="text-red-600" /></div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Inventory Item?</h3>
                <p className="text-sm text-gray-500 mt-0.5">Items with existing transactions cannot be deleted.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setDeletingItemId(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => deleteItem(deletingItemId)}
                disabled={deletingItem}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deletingItem ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit item modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">Edit Item</h3>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input value={editName} onChange={e => setEditName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setEditCategory(c as InventoryCategory)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-colors ${editCategory === c ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300 text-gray-600'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input value={editUnit} onChange={e => setEditUnit(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder At</label>
                <input type="number" min="0" step="0.1" value={editReorder} onChange={e => setEditReorder(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
            <p className="text-xs text-gray-400">Note: stock quantity is adjusted via transactions, not here.</p>
            <div className="flex gap-3">
              <button onClick={() => setEditingItem(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => updateItem()} disabled={updatingItem || !editName.trim()}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {updatingItem ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add item modal */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">New Inventory Item</h3>
              <button onClick={() => setShowItemForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input value={itemName} onChange={e => setItemName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setItemCategory(c)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-colors ${itemCategory === c ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300 text-gray-600'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input value={itemUnit} onChange={e => setItemUnit(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder At</label>
                <input type="number" min="0" step="0.1" value={reorderLevel} onChange={e => setReorderLevel(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowItemForm(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => createItem()} disabled={creatingItem || !itemName}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {creatingItem ? 'Adding…' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record transaction modal */}
      {showTxForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">Record Transaction</h3>
              <button onClick={() => setShowTxForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item <span className="text-red-500">*</span></label>
              <select value={txItemId} onChange={e => setTxItemId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                <option value="">Select item…</option>
                {items?.map(i => <option key={i.id} value={i.id}>{i.name} ({Number(i.quantityInStock).toFixed(1)} {i.unit})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <div className="flex gap-2">
                {TX_TYPES.map(t => (
                  <button key={t} onClick={() => setTxType(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${txType === t ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300 text-gray-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
                <input type="number" min="0.001" step="0.001" value={txQty} onChange={e => setTxQty(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (₦)</label>
                <input type="number" min="0" step="0.01" value={txUnitCost} onChange={e => setTxUnitCost(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input value={txNotes} onChange={e => setTxNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowTxForm(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => recordTx()} disabled={recordingTx || !txItemId || !txQty}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {recordingTx ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
