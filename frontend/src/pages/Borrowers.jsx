import { useState, useCallback, useMemo } from 'react'
import { HorizontalBar } from '../components/charts/BarCharts'
import DataTable from '../components/ui/DataTable'
import { TopNSelector } from '../components/ui/helpers'
import { usePaginatedData } from '../hooks/useDashboardData'
import { dashboardApi } from '../api/client'
import { fmt } from '../utils/formatters'
import { TOP_N_OPTIONS } from '../utils/constants'

const COLUMNS = [
  { key: 'customer_name',      label: 'Customer' },
  { key: 'group_name',         label: 'Group',                render: (v) => <span className="spill grey">{v}</span> },
  { key: 'loan_count',         label: 'Loans' },
  { key: 'sanction_amt',       label: 'Sanction (₹ Mn)',     render: (v) => fmt.mn(v) },
  { key: 'outstanding_amt',    label: 'Outstanding (₹ Mn)',  render: (v) => <strong>{fmt.mn(v)}</strong> },
  { key: 'exposure_amt',       label: 'Exposure (₹ Mn)',     render: (v) => fmt.mn(v) },
  { key: 'principal_received', label: 'Princ Recv (₹ Mn)',   render: (v) => fmt.mn(v) },
  { key: 'interest_received',  label: 'Int Recv (₹ Mn)',     render: (v) => fmt.mn(v) },
  { key: 'avg_rate',           label: 'Avg Rate',            render: (v) => <span className="spill purple">{v}%</span> },
]

export default function Borrowers({ computed: c }) {
  const [topN, setTopN] = useState({ outstanding: 15, sanction: 15 })
  const [search, setSearch] = useState('')

  // Paginated table
  const tableFetcher = useCallback((p) => dashboardApi.getCustomers(p), [])
  const { rows, total, totalPages, loading, params, updateParams } =
    usePaginatedData(tableFetcher, { sort_by: 'outstanding_amt', sort_dir: 'desc' })

  // All customers for charts (top 20 max)
  const chartFetcher = useCallback((p) => dashboardApi.getCustomers({ ...p, per_page: 20 }), [])
  const { rows: allCust } = usePaginatedData(chartFetcher, { sort_by: 'outstanding_amt', sort_dir: 'desc' })
  const { rows: sancCust } = usePaginatedData(
    useCallback((p) => dashboardApi.getCustomers({ ...p, per_page: 20, sort_by: 'sanction_amt', sort_dir: 'desc' }), []),
    {}
  )

  const osData = useMemo(() =>
    allCust.slice(0, topN.outstanding).map((c) => ({
      name: c.customer_name,
      value: parseFloat((c.outstanding_amt / 1e9).toFixed(2)),
    })), [allCust, topN.outstanding])

  const sancData = useMemo(() =>
    sancCust.slice(0, topN.sanction).map((c) => ({
      name: c.customer_name,
      value: parseFloat((c.sanction_amt / 1e9).toFixed(2)),
    })), [sancCust, topN.sanction])

  const handleSearch = (e) => {
    setSearch(e.target.value)
    updateParams({ search: e.target.value, page: 1 })
  }
  const handleSort = (key) => {
    const dir = params.sort_by === key && params.sort_dir === 'desc' ? 'asc' : 'desc'
    updateParams({ sort_by: key, sort_dir: dir })
  }

  return (
    <div>
      <div className="section-label">Borrower / Customer View</div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Top Customers by Outstanding</div>
          <div className="chart-subtitle">₹ BILLIONS</div>
          <TopNSelector options={TOP_N_OPTIONS} value={topN.outstanding} onChange={(n) => setTopN((p) => ({ ...p, outstanding: n }))} />
          <HorizontalBar data={osData} dataKey="value" nameKey="name" color="var(--blue)" formatter={(v) => `₹${v}Bn`} />
        </div>
        <div className="chart-card">
          <div className="chart-title">Top Customers by Sanction</div>
          <div className="chart-subtitle">₹ BILLIONS</div>
          <TopNSelector options={TOP_N_OPTIONS} value={topN.sanction} onChange={(n) => setTopN((p) => ({ ...p, sanction: n }))} />
          <HorizontalBar data={sancData} dataKey="value" nameKey="name" color="var(--teal)" formatter={(v) => `₹${v}Bn`} />
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          Customer Exposure Register
          <span className="card-badge">{c.unique_customers} CUSTOMERS</span>
        </div>
        <div className="cio-note">
          <strong>{c.unique_customers} unique customers</strong> across{' '}
          <strong>{c.unique_groups} borrower groups</strong>. Top customer outstanding:{' '}
          <strong>₹{c.top_customer_os_bn} Bn</strong>. Avg interest rate:{' '}
          <strong>{fmt.pct(c.avg_rate)} p.a.</strong> All exposures: <strong>Standard Assets</strong>.
        </div>
        <div className="toolbar">
          <input
            className="toolbar-input"
            placeholder="Search Customer or Group…"
            value={search}
            onChange={handleSearch}
          />
          <button className="toolbar-btn" onClick={() => { setSearch(''); updateParams({ search: '', page: 1 }) }}>
            Clear
          </button>
          <span className="toolbar-count">{total.toLocaleString('en-IN')} customers</span>
        </div>
        <DataTable
          columns={COLUMNS}
          rows={rows}
          total={total}
          page={params.page}
          totalPages={totalPages}
          onPage={(p) => updateParams({ page: p })}
          sortBy={params.sort_by}
          sortDir={params.sort_dir}
          onSort={handleSort}
          loading={loading}
        />
      </div>
    </div>
  )
}
