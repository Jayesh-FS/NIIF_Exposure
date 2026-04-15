import { useState, useCallback, useMemo } from 'react'
import { VerticalBar, HorizontalBar } from '../components/charts/BarCharts'
import { GroupedBar } from '../components/charts/BarCharts'
import { TopNSelector, ProgressBar } from '../components/ui/helpers'
import { usePaginatedData } from '../hooks/useDashboardData'
import { dashboardApi } from '../api/client'
import { fmt } from '../utils/formatters'
import { TOP_N_OPTIONS } from '../utils/constants'

export default function Rates({ data }) {
  const { rate_dist, tenor_dist, kpis: k, computed: c } = {
    rate_dist: [], // placeholder
    tenor_dist: [], // placeholder
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
  }
  const [topN, setTopN] = useState(15)

  const fetcher = useCallback((p) => dashboardApi.getGroups({ ...p, per_page: 100 }), [])
  const { rows: groups } = usePaginatedData(fetcher, { sort_by: 'upcoming_int', sort_dir: 'desc' })

  const upcomingData = useMemo(() =>
    groups.slice(0, topN).map((g) => ({
      name: g.group_name,
      value: parseFloat((g.upcoming_int / 1e6).toFixed(2)),
    })), [groups, topN])

  const collectionData = [
    { name: 'Interest Received', value: parseFloat((k.interest_received / 1e9).toFixed(2)) },
    { name: 'Interest Due',      value: parseFloat((k.interest_due / 1e9).toFixed(2)) },
  ]

  const rateChartData  = rate_dist.map((r)  => ({ label: r.label,  count: r.count }))
  const tenorChartData = tenor_dist.map((t) => ({ label: t.label,  count: t.count }))

  const maxRateCount  = Math.max(...rate_dist.map((r) => r.count),  1)
  const maxTenorCount = Math.max(...tenor_dist.map((t) => t.count), 1)

  const RATE_COLORS  = ['#7b1fa2','#9c27b0','#1565c0','#1e88e5','#00acc1','#2e7d32','#e53935']
  const TENOR_COLORS = ['#1565c0','#1e88e5','#00acc1','#2e7d32','#fb8c00','#7b1fa2','#e53935']

  return (
    <div>
      <div className="section-label">Interest Rate &amp; Tenor Analysis</div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Interest Rate Distribution</div>
          <div className="chart-subtitle">LOAN COUNT PER RATE BUCKET</div>
          <VerticalBar data={rateChartData} dataKey="count" nameKey="label" color="var(--purple)" height={260} />
        </div>
        <div className="chart-card">
          <div className="chart-title">Tenor Profile</div>
          <div className="chart-subtitle">NO. OF LOANS BY MATURITY BAND</div>
          <VerticalBar data={tenorChartData} dataKey="count" nameKey="label" color="var(--teal)" height={260} />
        </div>
      </div>

      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Interest Received vs Due</div>
          <div className="chart-subtitle">COLLECTION EFFICIENCY (₹ BN)</div>
          <GroupedBar
            data={collectionData}
            nameKey="name"
            series={[
              { key: 'value', label: '₹ Bn', color: 'var(--green)' },
            ]}
            height={200}
          />
        </div>
        <div className="chart-card">
          <div className="chart-title">Upcoming Interest — Top Groups</div>
          <div className="chart-subtitle">NEXT PAYMENT OBLIGATIONS (₹ MN)</div>
          <TopNSelector options={TOP_N_OPTIONS} value={topN} onChange={setTopN} />
          <VerticalBar data={upcomingData} dataKey="value" nameKey="name" color="var(--orange)" height={200} formatter={(v) => `₹${v}Mn`} />
        </div>
      </div>

      <div className="section-label">Rate &amp; Tenor Progress View</div>
      <div className="two-col">
        <div className="card">
          <div className="card-title">Rate Band — Loan Count <span className="card-badge">BY BUCKET</span></div>
          {rate_dist.map((r, i) => (
            <ProgressBar
              key={r.label}
              label={r.label}
              value={r.count}
              max={maxRateCount}
              fillColor={RATE_COLORS[i % RATE_COLORS.length]}
            />
          ))}
        </div>
        <div className="card">
          <div className="card-title">Tenor Band — Portfolio Weight <span className="card-badge">BY TENOR</span></div>
          {tenor_dist.map((t, i) => (
            <ProgressBar
              key={t.label}
              label={t.label}
              value={t.count}
              max={maxTenorCount}
              fillColor={TENOR_COLORS[i % TENOR_COLORS.length]}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
