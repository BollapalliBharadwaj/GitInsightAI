/**
 * Table — Data table with sortable columns, row hover, and empty state.
 *
 * Usage:
 *   const columns = [
 *     { key: 'name',  label: 'Repository', sortable: true },
 *     { key: 'stars', label: 'Stars',      sortable: true, align: 'right' },
 *     { key: 'lang',  label: 'Language',   render: (val) => <Badge>{val}</Badge> },
 *   ]
 *   const data = [{ name: 'react', stars: 200000, lang: 'JavaScript' }, ...]
 *
 *   <Table columns={columns} data={data} onSort={(key, dir) => ...} />
 */

import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/* ── Sort icon ───────────────────────────────────────────────────── */
function SortIcon({ columnKey, sortKey, sortDir }) {
  if (columnKey !== sortKey) return <ChevronsUpDown size={13} className="text-surface-600" />
  return sortDir === 'asc'
    ? <ChevronUp  size={13} className="text-primary-400" />
    : <ChevronDown size={13} className="text-primary-400" />
}

/* ── Table ───────────────────────────────────────────────────────── */
export default function Table({
  columns = [],
  data = [],
  onSort,
  loading = false,
  emptyMessage = 'No data found.',
  emptyIcon = null,
  striped = false,
  compact = false,
  className = '',
}) {
  const [sortKey, setSortKey]   = useState(null)
  const [sortDir, setSortDir]   = useState('asc')

  function handleSort(key) {
    if (!onSort) return
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDir(newDir)
    onSort(key, newDir)
  }

  const rowPad = compact ? 'px-5 py-2.5' : 'px-5 py-3.5'

  return (
    <div className={`surface-card overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          {/* ── Head ── */}
          <thead>
            <tr className="border-b border-surface-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    rowPad,
                    'text-xs font-semibold text-surface-400 uppercase tracking-wider',
                    col.align === 'right'  ? 'text-right'  : '',
                    col.align === 'center' ? 'text-center' : 'text-left',
                    col.sortable ? 'cursor-pointer select-none hover:text-white transition-colors' : '',
                    col.width ? `w-[${col.width}]` : '',
                  ].join(' ')}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <SortIcon columnKey={col.key} sortKey={sortKey} sortDir={sortDir} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            <AnimatePresence>
              {data.length === 0 && !loading ? (
                /* Empty state */
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      {emptyIcon && (
                        <div className="text-surface-600">{emptyIcon}</div>
                      )}
                      <p className="text-surface-500 text-sm">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, ri) => (
                  <motion.tr
                    key={row.id ?? ri}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: ri * 0.04 }}
                    className={[
                      'border-b border-surface-800/50 last:border-none',
                      'transition-colors duration-150',
                      'hover:bg-white/[0.025]',
                      striped && ri % 2 === 0 ? 'bg-white/[0.01]' : '',
                    ].join(' ')}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={[
                          rowPad,
                          'text-surface-200',
                          col.align === 'right'  ? 'text-right'  : '',
                          col.align === 'center' ? 'text-center' : '',
                        ].join(' ')}
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* ── Pagination slot ── */}
      {/* Pass pagination component as a child if needed */}
    </div>
  )
}

/* ── TablePagination ─────────────────────────────────────────────── */
export function TablePagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-surface-800 text-xs text-surface-400">
      <span>Page {page} of {totalPages}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}
