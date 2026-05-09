'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, PlusCircle } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { ApiResponse, PageResponse, Customer, CustomerTypeDef } from '@/types'

const DEFAULT_TYPE_COLORS: Record<string, string> = {
  RETAIL: 'bg-blue-100 text-blue-700',
  WHOLESALE: 'bg-green-100 text-green-700',
  HOTEL: 'bg-purple-100 text-purple-700',
  DISTRIBUTOR: 'bg-orange-100 text-orange-700',
}

function typeBadgeClass(typeName: string) {
  return DEFAULT_TYPE_COLORS[typeName] ?? 'bg-gray-100 text-gray-700'
}

export default function CustomersPage() {
  const qc = useQueryClient()
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [customerType, setCustomerType] = useState('RETAIL')

  // "Add new type" inline state
  const [showNewType, setShowNewType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypePrice, setNewTypePrice] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () =>
      api.get<ApiResponse<PageResponse<Customer>>>(`/customers?search=${encodeURIComponent(search)}&page=${page}&size=20`)
        .then(r => r.data.data),
  })

  const { data: customerTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['customer-types'],
    queryFn: () =>
      api.get<ApiResponse<CustomerTypeDef[]>>('/customer-types').then(r => r.data.data),
  })

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => {
      const body = { name, phone: phone || null, email: email || null, address: address || null, customerType }
      return editing
        ? api.put(`/customers/${editing.id}`, body)
        : api.post('/customers', body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      closeForm()
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Failed to save'),
  })

  const { mutate: createType, isPending: creatingType } = useMutation({
    mutationFn: () =>
      api.post<ApiResponse<CustomerTypeDef>>('/customer-types', {
        typeName: newTypeName.trim(),
        pricePerKg: parseFloat(newTypePrice),
      }).then(r => r.data.data),
    onSuccess: (newType) => {
      qc.invalidateQueries({ queryKey: ['customer-types'] })
      qc.invalidateQueries({ queryKey: ['pricing'] })
      setCustomerType(newType.typeName)
      setShowNewType(false)
      setNewTypeName('')
      setNewTypePrice('')
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Failed to create type'),
  })

  const openCreate = () => {
    setEditing(null); setName(''); setPhone(''); setEmail(''); setAddress('')
    setCustomerType(customerTypes?.[0]?.typeName ?? 'RETAIL')
    setShowNewType(false); setNewTypeName(''); setNewTypePrice('')
    setShowForm(true)
  }

  const openEdit = (c: Customer) => {
    setEditing(c); setName(c.name); setPhone(c.phone ?? ''); setEmail(c.email ?? '')
    setAddress(c.address ?? ''); setCustomerType(c.customerType)
    setShowNewType(false); setNewTypeName(''); setNewTypePrice('')
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditing(null); setShowNewType(false) }

  const canSubmitNewType = newTypeName.trim().length >= 2 && parseFloat(newTypePrice) > 0

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">Customers</h2>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
          <Plus size={15} /> Add Customer
        </button>
      </div>

      <input
        type="text" placeholder="Search by name…"
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(0) }}
        className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
      />

      {isLoading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.content.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No customers found</td></tr>
                )}
                {data?.content.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${typeBadgeClass(c.customerType)}`}>
                        {c.customerType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{c.address ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(c)} className="text-xs text-brand-600 hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-500">{data.totalElements} customers</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
                <span className="px-3 py-1.5 text-gray-600">{page + 1} / {data.totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages - 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">{editing ? 'Edit Customer' : 'New Customer'}</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            {/* Customer type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Type</label>
              {typesLoading ? (
                <p className="text-xs text-gray-400">Loading types…</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {customerTypes?.map(t => (
                    <button key={t.typeName} onClick={() => { setCustomerType(t.typeName); setShowNewType(false) }}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium border text-left transition-colors ${
                        customerType === t.typeName
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'border-gray-300 text-gray-600 hover:border-brand-400'
                      }`}>
                      <div>{t.typeName}</div>
                      <div className={`text-xs mt-0.5 ${customerType === t.typeName ? 'text-brand-100' : 'text-gray-400'}`}>
                        ₦{Number(t.pricePerKg).toLocaleString()}/kg
                      </div>
                    </button>
                  ))}

                  {/* Add new type — admin only */}
                  {isAdmin && !showNewType && (
                    <button
                      onClick={() => setShowNewType(true)}
                      className="py-2.5 px-3 rounded-lg text-sm border border-dashed border-gray-300 text-gray-400 hover:border-brand-400 hover:text-brand-600 flex items-center gap-1.5 transition-colors"
                    >
                      <PlusCircle size={14} /> Add new type
                    </button>
                  )}
                </div>
              )}

              {/* Inline new-type form */}
              {showNewType && (
                <div className="mt-3 p-3 border border-brand-200 rounded-lg bg-brand-50 space-y-2">
                  <p className="text-xs font-medium text-brand-700">New customer type</p>
                  <input
                    type="text"
                    placeholder="Type name (e.g. SUPERMARKET)"
                    value={newTypeName}
                    onChange={e => setNewTypeName(e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="Price per kg (₦)"
                    value={newTypePrice}
                    onChange={e => setNewTypePrice(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                  <p className="text-xs text-gray-500">A pricing tier will be created automatically.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowNewType(false); setNewTypeName(''); setNewTypePrice('') }}
                      className="flex-1 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => createType()}
                      disabled={creatingType || !canSubmitNewType}
                      className="flex-1 py-1.5 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 font-medium"
                    >
                      {creatingType ? 'Creating…' : 'Create'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={closeForm} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => save()} disabled={isPending || !name.trim() || showNewType}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
