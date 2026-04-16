import { useState, useCallback, useMemo } from 'react'
import { VerticalBar, HorizontalBar } from '../components/charts/BarCharts'
import DonutChart from '../components/charts/DonutChart'
import DataTable from '../components/ui/DataTable'
import KpiCard from '../components/ui/KpiCard'
import { TopNSelector } from '../components/ui/helpers'
import { usePaginatedData } from '../hooks/useDashboardData'
import { dashboardApi } from '../api/client'
import { fmt } from '../utils/formatters'
import { TOP_N_OPTIONS, PRODUCT_TYPES, CHART_PALETTE } from '../utils/constants'

const TXN_COLUMNS = [
  { key: 'proposal_id',       label: 'Proposal ID' },
  { key: 'customer_name',     label: 'Customer' },
  { key: 'group_name',        label: 'Group',       render: (v) => <span className="spill grey">{v}</span> },
  { key: 'product_type',      label: 'Product',     render: (v) => <span className={`spill ${v.startsWith('TL') ? 'blue' : 'teal'}`}>{v.startsWith('TL') ? 'TL' : 'DEB'}</span> },
  { key: 'currency',          label: 'Curr',        render: (v) => <span className="spill grey">{v}</span> },
  { key: 'start_date',        label: 'Start Date' },
  { key: 'end_date',          label: 'End Date' },
  { key: 'tenor_yrs',         label: 'Tenor',       render: (v) => `${v}y` },
  { key: 'sanction_amt',      label: 'Sanction (₹ Mn)',      render: (v) => fmt.mn(v) },
  { key: 'outstanding_amt',   label: 'Outstanding (₹ Mn)',   render: (v) => <strong>{fmt.mn(v)}</strong> },
  { key: 'exposure_amt',      label: 'Exposure (₹ Mn)',      render: (v) => fmt.mn(v) },
  { key: 'int_rate',          label: 'Rate %',      render: (v) => <span className="spill purple">{v}%</span> },
  { key: 'interest_due',      label: 'Int Due (₹ Mn)',       render: (v) => fmt.mn(v) },
  { key: 'total_int_amt',     label: 'Total Int (₹ Mn)',     render: (v) => fmt.mn(v) },
  { key: 'interest_received', label: 'Int Recv (₹ Mn)',      render: (v) => fmt.mn(v) },
  { key: 'principal_received',label: 'Princ Recv (₹ Mn)',    render: (v) => fmt.mn(v) },
  { key: 'upcoming_int',      label: 'Upcoming Int (₹ Mn)',  render: (v) => fmt.mn(v) },
  { key: 'asset_class',       label: 'Asset Class', render: () => <span className="spill green">Std</span> },
]

export default function Transactions({ data }) {
  const { kpis: k, computed: c, timeseries, size_dist, product_types, rate_dist } = {
    kpis: {
      sanction_amt: data.render_state.totals.total_sanction,
      outstanding_amt: data.render_state.totals.total_os_amt,
      loan_amt: data.render_state.totals.loan_amt,
      principal_received: data.render_state.totals.total_prin_rec,
      interest_received: 0, // placeholder
    },
    computed: {
      total_records: data.row_count,
      unique_proposals: 0, // placeholder
      unique_groups: data.render_state.totals.lv_grp_cnt,
      unique_customers: data.render_state.totals.lv_cust_cnt,
      min_rate: 0, // placeholder
      max_rate: 0, // placeholder
      avg_rate: 0, // placeholder
    },
    timeseries: { yearly: [], quarterly: [] }, // placeholder
    size_dist: [], // placeholder
    product_types: [], // placeholder
    rate_dist: [], // placeholder
  }

  const [topN, setTopN] = useState({ group: 10, coll: 10 })
  const [search, setSearch] = useState('')
  const [product, setProduct] = useState('')

  // Table
  const fetcher = useCallback((p) => dashboardApi.getTransactions(p), [])
  const { rows, total, totalPages, loading, params, updateParams } =
    usePaginatedData(fetcher, { per_page: 20 })

  // Charts — groups sorted by sanction & principal
  const { rows: collGroups } = usePaginatedData(
    useCallback((p) => dashboardApi.getGroups({ ...p, per_page: 20, sort_by: 'principal_received', sort_dir: 'desc' }), []), {}
  )

  const yearlyData = useMemo(() =>
    (timeseries?.yearly ?? []).map((p) => ({ period: p.period, Loans: p.count, 'Loan Amt': p.loan_amt_bn })),
  [timeseries])

  const sizeData  = size_dist.map((s)  => ({ label: s.label, count: s.count }))
  const qtrData   = (timeseries?.quarterly ?? []).map((p) => ({ period: p.period, 'Loan Amt': p.loan_amt_bn }))
  const rateDonut = rate_dist.map((r)  => ({ name: r.label, value: r.count }))
  const prodDonut = product_types.map((p) => ({ name: p.label.replace(' - Disbursements', ''), value: p.count }))

  const grpSancData = useMemo(() =>
    (data.render_state.bpSummary || [])
      .sort((a, b) => b.sanction_amt - a.sanction_amt)
      .slice(0, topN.group)
      .map((g) => ({ name: g.bp_group, value: parseFloat((g.sanction_amt / 1e7).toFixed(2)) })),
  [data.render_state.bpSummary, topN.group])

  const grpCollData = useMemo(() =>
    collGroups.slice(0, topN.coll).map((g) => ({ name: g.group_name, value: parseFloat((g.principal_received / 1e6).toFixed(2)) })),
  [collGroups, topN.coll])

  const avgBn = (c.avg_sanction_mn / 1000).toFixed(2)
  const recentPct = c.total_records > 0 ? Math.round(c.fy_recent_count / c.total_records * 100) : 0

  const handleSearch = (e) => { setSearch(e.target.value); updateParams({ search: e.target.value, page: 1 }) }
  const handleProduct = (e) => { setProduct(e.target.value); updateParams({ product: e.target.value, page: 1 }) }
  const handleClear = () => {
    setSearch(''); setProduct('')
    updateParams({ search: '', product: '', page: 1 })
  }

  return (
    <div>
      <div className="section-label">Transaction Analytics — Disbursement Intelligence</div>

      <div className="four-col">
        <KpiCard
          label="Total Transactions"
          value={fmt.int(c.total_records)}
          sub={`${c.tl_count} Term Loans · ${c.deb_count} Debentures`}
          footer={`${c.unique_proposals} Unique Proposals`}
          sparkPct={100}
          accent="c1"
          badge={{ label: 'Volume', variant: 'neutral' }}
          icon={<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>}
        />
        <KpiCard
          label="Avg Sanction per Loan"
          value={`₹${avgBn} Bn`}
          sub={`Max: ₹${c.max_sanction_bn} Bn · Min: ₹${c.min_sanction_mn} Mn`}
          footer={`Avg tenor: ${c.avg_tenor_yrs} yrs`}
          sparkPct={c.max_sanction_bn > 0 ? (parseFloat(avgBn) / c.max_sanction_bn) * 100 : 0}
          accent="c2"
          badge={{ label: 'Avg Size', variant: 'up' }}
          icon={<svg viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>}
        />
        <KpiCard
          label="Total Principal Received"
          value={fmt.bn(k.principal_received)}
          sub={`${c.collection_pct}% of total sanctioned`}
          footer={`Interest Received: ${fmt.bn(k.interest_received)}`}
          sparkPct={c.collection_pct}
          accent="c3"
          badge={{ label: 'Receipts', variant: 'warn' }}
          icon={<svg viewBox="0 0 24 24"><path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z"/></svg>}
        />
        <KpiCard
          label={c.fy_recent_label}
          value={fmt.int(c.fy_recent_count)}
          sub={`₹${c.fy_recent_sanction_bn} Bn sanctioned`}
          footer={`${recentPct}% of total portfolio`}
          sparkPct={recentPct}
          accent="c4"
          badge={{ label: 'Pipeline', variant: 'purple' }}
          icon={<svg viewBox="0 0 24 24"><path d="M3.5 18.5l6-6 4 4L22 6.92 20.59 5.5l-7.09 8-4-4L2 17l1.5 1.5z"/></svg>}
        />
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Disbursements by Year</div>
          <div className="chart-subtitle">LOAN COUNT (BARS) · LOAN AMT ₹ BN</div>
          <VerticalBar data={yearlyData} dataKey="Loan Amt" nameKey="period" color="var(--blue)" height={260} formatter={(v) => `₹${v}Bn`} />
        </div>
        <div className="chart-card">
          <div className="chart-title">Loan Size Distribution</div>
          <div className="chart-subtitle">SANCTION AMOUNT BUCKETS</div>
          <VerticalBar data={sizeData} dataKey="count" nameKey="label" color="var(--teal)" height={260} />
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Quarterly Loan Volume</div>
          <div className="chart-subtitle">LOAN AMT ₹ BN — ALL QUARTERS</div>
          <VerticalBar data={qtrData} dataKey="Loan Amt" nameKey="period" color="var(--orange)" height={240} formatter={(v) => `₹${v}Bn`} />
        </div>
        <div className="chart-card">
          <div className="chart-title">Rate Band Split</div>
          <div className="chart-subtitle">LOANS BY INTEREST RATE BUCKET</div>
          <DonutChart data={rateDonut} height={200} formatter={(v) => `${v} loans`} />
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Top Groups by Sanction</div>
          <div className="chart-subtitle">₹ CRORES</div>
          <TopNSelector options={TOP_N_OPTIONS} value={topN.group} onChange={(n) => setTopN((p) => ({ ...p, group: n }))} />
          <VerticalBar data={grpSancData} dataKey="value" nameKey="name" color="var(--blue)" formatter={(v) => `₹${v}Cr`} />
        </div>
        <div className="chart-card">
          <div className="chart-title">Top Groups by Principal Collected</div>
          <div className="chart-subtitle">₹ MILLIONS</div>
          <TopNSelector options={TOP_N_OPTIONS} value={topN.coll} onChange={(n) => setTopN((p) => ({ ...p, coll: n }))} />
          <HorizontalBar data={grpCollData} dataKey="value" nameKey="name" color="var(--green)" formatter={(v) => `₹${v}Mn`} />
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Product Type Mix</div>
          <div className="chart-subtitle">TL vs DEB — BY COUNT</div>
          <DonutChart data={prodDonut} colors={['#1565c0','#00acc1']} height={180} formatter={(v) => `${v} loans`} />
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title" style={{ fontSize: '.82rem' }}>
            Portfolio Summary Metrics <span className="card-badge">COMPUTED</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { bg: 'var(--blue-pale)',   col: 'var(--blue-dark)', label: 'Avg Int Rate',   val: fmt.pct(c.avg_rate),      sub: `Range: ${c.min_rate} – ${c.max_rate}%` },
              { bg: 'var(--teal-pale)',   col: 'var(--teal)',      label: 'Avg Tenor',      val: `${c.avg_tenor_yrs} yrs`, sub: `Range: ${c.min_tenor_yrs} – ${c.max_tenor_yrs} yrs` },
              { bg: 'var(--orange-pale)', col: 'var(--orange)',    label: '15–20yr Loans',  val: c.loans_15_20yr,          sub: `${c.pct_15_20yr}% of portfolio` },
              { bg: 'var(--purple-pale)', col: 'var(--purple)',    label: `${c.top_rate_band} Band`, val: c.top_rate_band_count, sub: `${c.top_rate_band_pct}% of loans` },
            ].map((tile) => (
              <div key={tile.label} style={{ background: tile.bg, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: '.6rem', fontWeight: 700, letterSpacing: '.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{tile.label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: tile.col }}>{tile.val}</div>
                <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{tile.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-label" style={{ marginTop: 8 }}>Transaction Register — Full Disbursement Detail</div>
      <div className="card" style={{ marginBottom: 0 }}>
        <div className="card-title">
          All Disbursements <span className="card-badge">{total.toLocaleString('en-IN')} RECORDS</span>
        </div>
        <div className="cio-note">
          Searchable register of all <strong>{c.total_records} disbursement transactions</strong> across{' '}
          <strong>{c.unique_customers} customers</strong> and <strong>{c.unique_groups} groups</strong>.
          Filter by product, rate band, or search by proposal / customer / group.
        </div>
        <div className="toolbar">
          <input className="toolbar-input" placeholder="Search Proposal, Customer, Group…" value={search} onChange={handleSearch} />
          <select className="toolbar-select" value={product} onChange={handleProduct}>
            {PRODUCT_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button className="toolbar-btn" onClick={handleClear}>Clear</button>
          <span className="toolbar-count">{total.toLocaleString('en-IN')} records</span>
        </div>
        <DataTable
          columns={TXN_COLUMNS}
          rows={rows}
          total={total}
          page={params.page}
          totalPages={totalPages}
          onPage={(p) => updateParams({ page: p })}
          loading={loading}
        />
      </div>
    </div>
  )
}
