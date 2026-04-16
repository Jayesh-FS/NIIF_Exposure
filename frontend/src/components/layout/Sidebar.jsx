import { useMemo } from 'react'
import { NAV_PAGES } from '../../utils/constants'

const NAV_ICONS = {
  overview:     <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>,
  exposure:     <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>,
  rates:        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/>,
  borrowers:    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>,
  transactions: <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>,
}

export default function Sidebar({ activePage, onNavigate }) {
  const sections = useMemo(() => {
    const map = {}
    NAV_PAGES.forEach((p) => {
      if (!map[p.section]) map[p.section] = []
      map[p.section].push(p)
    })
    return map
  }, [])

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ fontSize: '.72rem', fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--blue-dark)' }}>NIIF</div>
        <div style={{ fontSize: '.6rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>Loan Exposure Dashboard</div>
      </div>

      <nav className="sidebar-nav">
        {Object.entries(sections).map(([section, pages]) => (
          <div key={section}>
            <div className="sidebar-section-label">{section}</div>
            {pages.map((p) => (
              <button
                key={p.id}
                className={`nav-btn${activePage === p.id ? ' active' : ''}`}
                onClick={() => onNavigate(p.id)}
              >
                <svg className="nav-btn-icon" viewBox="0 0 24 24">
                  {NAV_ICONS[p.id]}
                </svg>
                {p.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
