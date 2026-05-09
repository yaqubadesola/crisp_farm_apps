'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { fmt } from '@/lib/utils'
import type { ApiResponse, PricingTier } from '@/types'

const TIER_DESC: Record<string, string> = {
  RETAIL: 'Walk-in buyers, individuals',
  WHOLESALE: 'Bulk buyers',
  HOTEL: 'Hotels & restaurants',
  DISTRIBUTOR: 'Large-scale distributors',
}

export default function PricingPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<string | null>(null)
  const [price, setPrice] = useState('')

  const { data: tiers, isLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: () => api.get<ApiResponse<PricingTier[]>>('/pricing/tiers').then(r => r.data.data),
  })

  const { mutate: updatePrice, isPending } = useMutation({
    mutationFn: (tierName: string) =>
      api.put(`/pricing/tiers/${tierName}`, { pricePerKg: parseFloat(price) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing'] })
      setEditing(null)
      setPrice('')
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Update failed'),
  })

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pricing Tiers</h2>
        <p className="text-sm text-gray-500 mt-1">Set the price per kg for each customer type</p>
      </div>

      {isLoading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="grid sm:grid-cols-2 gap-4">
          {tiers?.map(tier => (
            <div key={tier.tierName} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{tier.tierName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{TIER_DESC[tier.tierName] ?? ''}</p>
                </div>
                <p className="text-2xl font-bold text-brand-700">{fmt(tier.pricePerKg)}<span className="text-sm font-normal text-gray-500">/kg</span></p>
              </div>

              {editing === tier.tierName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="1" step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="New price per kg"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                  <button
                    onClick={() => updatePrice(tier.tierName)}
                    disabled={isPending || !price}
                    className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
                  >
                    {isPending ? '…' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Last updated by {tier.updatedBy ?? '—'}</span>
                  <button
                    onClick={() => { setEditing(tier.tierName); setPrice(String(tier.pricePerKg)) }}
                    className="text-brand-600 hover:underline font-medium"
                  >
                    Update Price
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
