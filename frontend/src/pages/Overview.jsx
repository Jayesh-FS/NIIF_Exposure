import { useMemo } from 'react'
import KpiCard from '../components/ui/KpiCard'
import ActivityChart from '../components/charts/ActivityChart'
import DonutChart from '../components/charts/DonutChart'
import { VerticalBar } from '../components/charts/BarCharts'
import { Spinner, ErrorMsg } from '../components/ui/helpers'
import { useInsights } from '../hooks/useDashboardData'
import { fmt } from '../utils/formatters'

export default function Overview({ data }) {
  const { insights, loading: aiLoading, error: aiError, generate } = useInsights()

  const { kpis: k, computed: c, product_types, timeseries, rate_dist, tenor_dist } = {
    kpis: {
      total_sanction: data.render_state.totals.total_sanction,
      total_exposure: data.render_state.totals.total_exposure,
      total_prin_rec: data.render_state.totals.total_prin_rec,
      total_os_amt: data.render_state.totals.total_os_amt,
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
    product_types: [], // placeholder
    timeseries: { yearly: [], quarterly: [] }, // placeholder
    rate_dist: [], // placeholder
    tenor_dist: [], // placeholder
  }

  const rateSparkPct = c.max_rate > c.min_rate
    ? ((c.avg_rate - c.min_rate) / (c.max_rate - c.min_rate)) * 100
    : 50

  // const productDonut = useMemo(() =>
  //   product_types.map((p) => ({ name: p.label.replace(' - Disbursements', ''), value: p.outstanding_bn })),
  // [product_types])

const productDonut = useMemo(() => {
  const products = data?.render_state?.products || []

  console.log("ACTUAL PRODUCTS:", products)

  if (!products.length) return []

  return products.map((p) => {
    const label = (p.zprd_desc || '').toUpperCase()

    let name = 'OTHER'
    if (label.includes('TL')) name = 'TL'
    else if (label.includes('DEB')) name = 'DEB'

    const raw = parseFloat(p.zos_amt)

    return {
      name,
      value: parseFloat((raw / 1e7).toFixed(2)) // CR
    }
  })
}, [data])

  // const collectionDonut = useMemo(() => [
  //   { name: 'Principal Received', value: parseFloat((k.principal_received / 1e9).toFixed(2)) },
  //   { name: 'Interest Received',  value: parseFloat((k.interest_received / 1e9).toFixed(2)) },
  //   { name: 'Remaining O/S',      value: parseFloat(((k.outstanding_amt - k.principal_received) / 1e9).toFixed(2)) },
  // ], [k])

  const collectionDonut = useMemo(() => [
    {
      name: 'Principal Received',
      value: parseFloat((k.principal_received / 1e7).toFixed(2))
    },
    {
      name: 'Interest Received',
      value: parseFloat((k.interest_received / 1e7).toFixed(2))
    },
    {
      name: 'Remaining O/S',
      value: parseFloat(((k.outstanding_amt - k.principal_received) / 1e7).toFixed(2))
    },
  ], [k])

  const tenorChartData = tenor_dist.map((t) => ({ label: t.label, count: t.count }))
  const rateChartData  = rate_dist.map((r) => ({ label: r.label, count: r.count }))

  return (
    <div>
      <div className="section-label">Portfolio KPIs — All Figures in INR</div>

      <div className="four-col">
        <KpiCard
          label="Total Sanction"
          value={fmt.cr(k.total_sanction)}
          sub={`${fmt.int(c.total_records)} records · ${fmt.int(c.unique_proposals)} proposals`}
          footer={`${c.unique_groups} Borrower Groups · ${c.unique_customers} Customers`}
          sparkPct={100}
          accent="c1"
        />

        <KpiCard
          label="Total Exposure"
          value={fmt.cr(k.total_exposure)}
          sub={`Disbursed: ${fmt.cr(k.loan_amt)}`}
          footer={`Principal Received: ${fmt.cr(k.principal_received)}`}
          sparkPct={k.total_sanction > 0 ? (k.total_exposure / k.total_sanction) * 100 : 0}
          accent="c2"
        />

        <KpiCard
          label="Principal Received"
          value={fmt.cr(k.total_prin_rec)}
          sub={`Total Records: ${fmt.int(c.total_records)}`}
          footer={`Unique Customers: ${fmt.int(c.unique_customers)}`}
          sparkPct={k.total_sanction > 0 ? (k.total_prin_rec / k.total_sanction) * 100 : 0}
          accent="c3"
        />

      <KpiCard
        label="Outstanding Amount"
        value={fmt.cr(k.total_os_amt)}
        sub={`Borrower Groups: ${fmt.int(c.unique_groups)}`}
        footer={`Total Exposure: ${fmt.cr(k.total_exposure)}`}
        sparkPct={k.total_sanction > 0 ? (k.total_os_amt / k.total_sanction) * 100 : 0}
        accent="c4"
      />
      </div>

      <div className="section-label">Disbursement Activity Trend</div>
      <ActivityChart timeseries={timeseries} />

      <div className="section-label">Gen AI Insights</div>
      <div className="card">
        <div className="card-title">
          Portfolio Intelligence
          <button className="insights-btn" onClick={generate} disabled={aiLoading}>
            {aiLoading ? '⏳ Analysing…' : '✦ Generate AI Insights'}
          </button>
        </div>
        {aiError && <ErrorMsg message={aiError} />}
        {insights && (
          <div className="insights-grid">
            {[
              { label: '📊 Headline',    text: insights.headline },
              { label: '⚠ Risk Flag',    text: insights.risk_flag },
              { label: '💡 Opportunity', text: insights.opportunity },
              { label: '👁 Watchlist',   text: insights.watchlist },
            ].map((tile) => (
              <div key={tile.label} className="insight-tile">
                <div className="insight-tile-label">{tile.label}</div>
                <div className="insight-tile-text">{tile.text}</div>
              </div>
            ))}
          </div>
        )}
        {!insights && !aiLoading && (
          <div style={{ color: 'var(--text-muted)', fontSize: '.76rem', padding: '8px 0' }}>
            Click the button above to generate AI-powered portfolio insights.
          </div>
        )}
      </div>

      <div className="section-label">Portfolio Distribution</div>
      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Product Type Split</div>
          <div className="chart-subtitle">TL vs DEB — BY OUTSTANDING</div>
          <DonutChart
            data={productDonut}
            colors={['#1565c0', '#00acc1']}
            height={220}
            formatter={(v) => `₹${(v || 0).toFixed(2)} Cr`}
          />
        </div>
        <div className="chart-card">
          <div className="chart-title">Collection Breakdown</div>
          <div className="chart-subtitle">PRINCIPAL & INTEREST RECEIVED</div>
          <DonutChart
            data={collectionDonut}
            colors={['#2e7d32', '#43a047', '#e53935']}
            height={220}
            formatter={(v) => `₹${v} Cr`}
          />
        </div>
      </div>
      <div className="two-col">
        <div className="chart-card">
          <div className="chart-title">Tenor Profile</div>
          <div className="chart-subtitle">LOAN COUNT BY MATURITY BAND</div>
          <VerticalBar data={tenorChartData} dataKey="count" nameKey="label" color="var(--teal)" height={220} />
        </div>
        <div className="chart-card">
          <div className="chart-title">Rate Distribution</div>
          <div className="chart-subtitle">LOAN COUNT BY RATE BUCKET</div>
          <VerticalBar data={rateChartData} dataKey="count" nameKey="label" color="var(--purple)" height={220} />
        </div>
      </div>
    </div>
  )
}
