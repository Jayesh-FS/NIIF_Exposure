import { useState, useEffect, useCallback } from 'react'
import { dashboardApi } from '../api/client'

/**
 * useDashboardData — master hook.
 * Fetches the /data/query dashboard payload once on mount.
 * Returns { data, loading, error, refetch }.
 */
export function useDashboardData() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await dashboardApi.getDashboard()
      setData(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

/**
 * usePaginatedData — generic hook for paginated API endpoints.
 * @param {Function} fetcher   — e.g. (params) => dashboardApi.getGroups(params)
 * @param {Object}   defaults  — default query params
 */
export function usePaginatedData(fetcher, defaults = {}) {
  const [rows, setRows]         = useState([])
  const [total, setTotal]       = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [params, setParams]     = useState({ page: 1, per_page: 20, ...defaults })

  const load = useCallback(async (p) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher(p)
      setRows(res.data)
      setTotal(res.total)
      setTotalPages(res.total_pages)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => { load(params) }, [params, load])

  const updateParams = useCallback((updates) => {
    setParams((prev) => ({ ...prev, ...updates, page: updates.page ?? 1 }))
  }, [])

  return { rows, total, totalPages, loading, error, params, updateParams }
}

/**
 * useInsights — fetch AI insights on demand.
 */
export function useInsights() {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const ctx = await dashboardApi.getInsightsContext()
      const res = await dashboardApi.generateInsights(ctx)
      setInsights(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { insights, loading, error, generate }
}
