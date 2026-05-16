'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, X, Pencil, Trash2, ShieldAlert, CheckCircle2, Circle } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { ApiResponse, PageResponse, CrisisEvent, CrisisSeverity } from '@/types'

const SEVERITIES: CrisisSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const SEVERITY_COLORS: Record<CrisisSeverity, string> = {
  LOW:      'bg-blue-100 text-blue-700',
  MEDIUM:   'bg-yellow-100 text-yellow-700',
  HIGH:     'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

const SEVERITY_DOT: Record<CrisisSeverity, string> = {
  LOW:      'bg-blue-400',
  MEDIUM:   'bg-yellow-400',
  HIGH:     'bg-orange-500',
  CRITICAL: 'bg-red-600',
}

interface EventForm {
  title: string
  eventDate: string
  severity: CrisisSeverity
  affectedCount: string
  solution: string
  description: string
  resolved: boolean
}

function emptyForm(today: string): EventForm {
  return { title: '', eventDate: today, severity: 'MEDIUM', affectedCount: '', solution: '', description: '', resolved: false }
}

export default function CrisisPage() {
  const qc = useQueryClient()
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')

  const today = format(new Date(), 'yyyy-MM-dd')
  const yearStart = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd')

  const [from, setFrom] = useState(yearStart)
  const [to, setTo] = useState(today)
  const [severityFilter, setSeverityFilter] = useState('')
  const [resolvedFilter, setResolvedFilter] = useState('')
  const [page, setPage] = useState(0)

  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CrisisEvent | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [form, setForm] = useState<EventForm>(emptyForm(today))

  const { data, isLoading } = useQuery({
    queryKey: ['crisis', from, to, severityFilter, resolvedFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({ from, to, page: String(page), size: '20' })
      if (severityFilter) params.set('severity', severityFilter)
      if (resolvedFilter !== '') params.set('resolved', resolvedFilter)
      return api.get<ApiResponse<PageResponse<CrisisEvent>>>(`/crisis?${params}`)
        .then(r => r.data.data)
    },
  })

  const { mutate: createEvent, isPending: creating } = useMutation({
    mutationFn: () => api.post('/crisis', {
      title: form.title.trim(),
      eventDate: form.eventDate,
      severity: form.severity,
      affectedCount: form.affectedCount ? parseInt(form.affectedCount) : null,
      solution: form.solution.trim() || null,
      description: form.description.trim() || null,
      resolved: form.resolved,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crisis'] })
      setShowForm(false)
      setForm(emptyForm(today))
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Failed to record event'),
  })

  const { mutate: updateEvent, isPending: updating } = useMutation({
    mutationFn: () => api.put(`/crisis/${editingEvent!.id}`, {
      title: form.title.trim(),
      eventDate: form.eventDate,
      severity: form.severity,
      affectedCount: form.affectedCount ? parseInt(form.affectedCount) : null,
      solution: form.solution.trim() || null,
      description: form.description.trim() || null,
      resolved: form.resolved,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crisis'] })
      setEditingEvent(null)
      setForm(emptyForm(today))
    },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Failed to update event'),
  })

  const { mutate: deleteEvent, isPending: deleting } = useMutation({
    mutationFn: (id: number) => api.delete(`/crisis/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crisis'] })
      setDeletingId(null)
    },
    onError: (e: any) => {
      alert(e?.response?.data?.message ?? 'Failed to delete event')
      setDeletingId(null)
    },
  })

  const { mutate: toggleResolved } = useMutation({
    mutationFn: (event: CrisisEvent) =>
      api.put(`/crisis/${event.id}`, {
        title: event.title,
        eventDate: event.eventDate,
        severity: event.severity,
        affectedCount: event.affectedCount,
        solution: event.solution,
        description: event.description,
        resolved: !event.resolved,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crisis'] }),
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Failed to update'),
  })

  const openCreate = () => {
    setEditingEvent(null)
    setForm(emptyForm(today))
    setShowForm(true)
  }

  const openEdit = (event: CrisisEvent) => {
    setEditingEvent(event)
    setForm({
      title: event.title,
      eventDate: event.eventDate,
      severity: event.severity,
      affectedCount: event.affectedCount != null ? String(event.affectedCount) : '',
      solution: event.solution ?? '',
      description: event.description ?? '',
      resolved: event.resolved,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingEvent(null)
    setForm(emptyForm(today))
  }

  const unresolvedCount = data?.content.filter(e => !e.resolved).length ?? 0
  const criticalCount = data?.content.filter(e => e.severity === 'CRITICAL').length ?? 0

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ShieldAlert size={22} className="text-orange-500" />
          <h2 className="text-xl font-bold text-gray-900">Crisis Events</h2>
          {unresolvedCount > 0 && (
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
              {unresolvedCount} open
            </span>
          )}
          {criticalCount > 0 && (
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
              {criticalCount} critical
            </span>
          )}
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          <Plus size={15} /> Record Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <label className="text-gray-600">From</label>
        <input type="date" value={from}
          onChange={e => { setFrom(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        <label className="text-gray-600">To</label>
        <input type="date" value={to}
          onChange={e => { setTo(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        <label className="text-gray-600 ml-2">Severity</label>
        <select value={severityFilter}
          onChange={e => { setSeverityFilter(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
          <option value="">All</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="text-gray-600 ml-2">Status</label>
        <select value={resolvedFilter}
          onChange={e => { setResolvedFilter(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
          <option value="">All</option>
          <option value="false">Open</option>
          <option value="true">Resolved</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium text-right">Affected</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Recorded By</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.content.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                      <ShieldAlert size={28} className="mx-auto mb-2 opacity-20" />
                      No crisis events in this period
                    </td>
                  </tr>
                )}
                {data?.content.map(event => (
                  <tr key={event.id} className={`hover:bg-gray-50 transition-colors ${event.resolved ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{event.eventDate}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{event.title}</div>
                      {event.description && (
                        <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{event.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[event.severity]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[event.severity]}`} />
                        {event.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {event.affectedCount != null ? event.affectedCount.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleResolved(event)}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                        title={event.resolved ? 'Mark as open' : 'Mark as resolved'}
                      >
                        {event.resolved ? (
                          <><CheckCircle2 size={15} className="text-green-500" /><span className="text-green-600">Resolved</span></>
                        ) : (
                          <><Circle size={15} className="text-orange-400" /><span className="text-orange-500">Open</span></>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{event.recordedBy ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(event)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit event"
                        >
                          <Pencil size={14} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeletingId(event.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete event"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-500">{data.totalElements} total records</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
                <span className="px-3 py-1.5 text-gray-600">Page {page + 1} of {data.totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages - 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirm modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-xl"><Trash2 size={18} className="text-red-600" /></div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Crisis Event?</h3>
                <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => deleteEvent(deletingId)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-lg">
                {editingEvent ? 'Edit Crisis Event' : 'Record Crisis Event'}
              </h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Mass mortality in Pond 3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Date + Affected count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Affected Fish Count</label>
                  <input
                    type="number"
                    min="0"
                    value={form.affectedCount}
                    onChange={e => setForm(f => ({ ...f, affectedCount: e.target.value }))}
                    placeholder="e.g. 200"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITIES.map(s => (
                    <button
                      key={s}
                      onClick={() => setForm(f => ({ ...f, severity: s }))}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        form.severity === s
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'border-gray-300 text-gray-600 hover:border-brand-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Detailed description of what happened…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {/* Solution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Solution / Action Taken <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={form.solution}
                  onChange={e => setForm(f => ({ ...f, solution: e.target.value }))}
                  rows={2}
                  placeholder="What was done or planned to address the issue…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {/* Resolved toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, resolved: !f.resolved }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.resolved ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.resolved ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm text-gray-700">
                  {form.resolved ? 'Mark as resolved' : 'Still open / unresolved'}
                </span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={closeForm}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => editingEvent ? updateEvent() : createEvent()}
                disabled={(creating || updating) || !form.title.trim() || !form.eventDate}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
              >
                {(creating || updating) ? 'Saving…' : editingEvent ? 'Save Changes' : 'Record Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
