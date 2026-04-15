import { useState, useCallback, useMemo } from 'react'
import { HorizontalBar, GroupedBar, VerticalBar } from '../components/charts/BarCharts'
import DataTable from '../components/ui/DataTable'
import { TopNSelector } from '../components/ui/helpers'
import KpiCard from '../components/ui/KpiCard'
import { usePaginatedData } from '../hooks/useDashboardData'
import { dashboardApi } from '../api/client'
import { fmt } from '../utils/formatters'
import { TOP_N_OPTIONS } from '../utils/constants'

const COLUMNS = [
  { key: 'group_name',          label: 'Group' },
  { key: 'loan_count',          label: 'Loans' },
  { key: 'sanction_amt',        label: 'Sanction (₹ Mn)',     render: (v) => fmt.mn(v) },
  { key: 'loan_amt',            label: 'Loan Amt (₹ Mn)',     render: (v) => fmt.mn(v) },
  { key: 'outstanding_amt',     label: 'Outstanding (₹ Mn)',  render: (v) => <strong>{fmt.mn(v)}</strong> },
  { key: 'exposure_amt',        label: 'Exposure (₹ Mn)',     render: (v) => fmt.mn(v) },
  { key: 'principal_received',  label: 'Princ Recv (₹ Mn)',   render: (v) => fmt.mn(v) },
  { key: 'interest_received',   label: 'Int Recv (₹ Mn)',     render: (v) => fmt.mn(v) },
  { key: 'upcoming_int',        label: 'Upcoming Int (₹ Mn)', render: (v) => fmt.mn(v) },
  { key: 'avg_rate',            label: 'Avg Rate',            render: (v) => <span className="spill purple">{v}%</span> },
]

export default function Exposure({ computed: c }) {
  const [topN, setTopN] = useState({ hbar: 15, triple: 8, intBar: 15, rateBar: 15 })
  const [search, setSearch] = useState('')

  const fetcher = useCallback((p) => dashboardApi.getGroups(p), [])
  const { rows, total, totalPages, loading, params, updateParams } =
    usePaginatedData(fetcher, { sort_by: 'outstanding_amt', sort_dir: 'desc', per_page: 20 })

  const allFetcher = useCallback((p) => dashboardApi.getGroups({ ...p, per_page: 100 }), [])
  const { rows: allGroups } = usePaginatedData(allFetcher, { sort_by: 'outstanding_amt', sort_dir: 'desc' })

  const hBarData = useMemo(() =>
    allGroups.slice(0, topN.hbar).map((g) => ({
      name: g.group_name,
      value: parseFloat((g.outstanding_amt / 1e9).toFixed(2)),
    })), [allGroups, topN.hbar])

  const tripleData = useMemo(() =>
    allGroups.slice(0, topN.triple).map((g) => ({
      name: g.group_name,
      Sanction:     parseFloat((g.sanction_amt / 1e9).toFixed(2)),
      'Loan Amt':   parseFloat((g.loan_amt / 1e9).toFixed(2)),
      Outstanding:  parseFloat((g.outstanding_amt / 1e9).toFixed(2)),
    })), [allGroups, topN.triple])

  const intBarData = useMemo(() =>
    allGroups.slice(0, topN.intBar).map((g) => ({
      name: g.group_name,
      value: parseFloat((g.interest_received / 1e6).toFixed(2)),
    })), [allGroups, topN.intBar])

  const rateBarData = useMemo(() =>
    allGroups.slice(0, topN.rateBar).map((g) => ({
      name: g.group_name,
      value: g.avg_rate,
    })), [allGroups, topN.rateBar])

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
      <div className="section-label">Exposure Analytics — Group Breakdown</div>

      <div className="four-col">
        <KpiCard label="Total Records"       value={fmt.int(c.total_records)}  sub="Disbursement Entries"              accent="c1" />
        <KpiCard label="Borrower Groups"     value={fmt.int(c.unique_groups)}  sub="Active Group Entities"             accent="c2" />
        <KpiCard label="TL Disbursements"    value={fmt.int(c.tl_count)}       sub={`Term Loans · ₹${c.tl_outstanding_bn} Bn O/S`}  accent="c3" />
        <KpiCard label="DEB Disbursements"   value={fmt.int(c.deb_count)}      sub={`Debentures · ₹${c.deb_outstanding_bn} Bn O/S`} accent="c4" />
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Outstanding Amount by Group</div>
          <div className="chart-subtitle">HORIZONTAL BAR · ₹ BN</div>
          <TopNSelector options={TOP_N_OPTIONS} value={topN.hbar} onChange={(n) => setTopN((p) => ({ ...p, hbar: n }))} />
          <HorizontalBar data={hBarData} dataKey="value" nameKey="name" color="var(--blue)" formatter={(v) => `₹${v}Bn`} />
        </div>
        <div className="chart-card">
          <div className="chart-title">Sanction vs Loan vs Outstanding</div>
          <div className="chart-subtitle">TOP {topN.triple} GROUPS · 3-WAY ₹ BN</div>
          <GroupedBar
            data={tripleData}
            nameKey="name"
            series={[
              { key: 'Sanction',    label: 'Sanction',    color: 'rgba(21,101,192,0.88)' },
              { key: 'Loan Amt',    label: 'Loan Amt',    color: 'rgba(0,172,193,0.85)' },
              { key: 'Outstanding', label: 'Outstanding', color: 'rgba(251,140,0,0.88)' },
            ]}
            height={280}
          />
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Interest Received by Group</div>
          <div className="chart-subtitle">₹ MILLIONS</div>
          <TopNSelector options={TOP_N_OPTIONS} value={topN.intBar} onChange={(n) => setTopN((p) => ({ ...p, intBar: n }))} />
          <VerticalBar data={intBarData} dataKey="value" nameKey="name" color="var(--green)" height={260} formatter={(v) => `₹${v}Mn`} />
        </div>
        <div className="chart-card">
          <div className="chart-title">Avg Interest Rate per Group</div>
          <div className="chart-subtitle">RATE COMPARISON %</div>
          <TopNSelector options={TOP_N_OPTIONS} value={topN.rateBar} onChange={(n) => setTopN((p) => ({ ...p, rateBar: n }))} />
          <VerticalBar data={rateBarData} dataKey="value" nameKey="name" color="var(--purple)" height={260} unit="%" />
        </div>
      </div>

      <div className="section-label">Group Summary Table</div>
      <div className="card">
        <div className="card-title">
          Group-Level Exposure Summary
          <span className="card-badge">{c.unique_groups} GROUPS</span>
        </div>
        <div className="cio-note">
          Portfolio covers <strong>{c.unique_groups} borrower groups</strong> with total outstanding of{' '}
          <strong>₹{(c.tl_outstanding_bn + c.deb_outstanding_bn).toFixed(2)} Bn</strong>.
          Top 5 groups account for <strong>~{c.top5_group_pct}%</strong> of total outstanding.
          All exposures are <strong>Standard Assets</strong>.
        </div>
        <div className="toolbar">
          <input
            className="toolbar-input"
            placeholder="Search Group Name…"
            value={search}
            onChange={handleSearch}
          />
          <button className="toolbar-btn" onClick={() => { setSearch(''); updateParams({ search: '', page: 1 }) }}>
            Clear
          </button>
          <span className="toolbar-count">{total.toLocaleString('en-IN')} groups</span>
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
