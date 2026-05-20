// HistorialLakers.tsx
import Nav from '../components/Nav/Nav.tsx'
import BannerReput from '../components/LakerCourt/BannerReput'
import {
  getUserReputation,
  getCurrentUserMatchHistoryDashboard,
  type UserMatchHistoryDashboard,
} from '../services/apiUser.ts'
import { useEffect, useState } from 'react'
import StatsContainer from '../components/HistorialLakers/StatsContainer.tsx'
import PastGamesTable from '../components/HistorialLakers/PastGamesTable.tsx'
import FilterBar from '../components/HistorialLakers/FilterBar.tsx'
import { useFilterHistorialLakers } from '../hooks/useFilterHistorialLakers.ts'
import { useAuth } from '../context/AuthContext'

interface PageState {
  reputation: number | null
  matchHistory: UserMatchHistoryDashboard | null
}

type FilterStatus = 'all' | 'wins' | 'losses' | 'pending'

const fetchPageData = async (userId: string | null): Promise<PageState> => {
  const [reputation, matchHistory] = await Promise.all([
    getUserReputation(userId),
    getCurrentUserMatchHistoryDashboard(userId),
  ])
  return { reputation, matchHistory }
}

function HistorialLakers() {
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [pageState, setPageState] = useState<PageState>({
    reputation: null,
    matchHistory: null,
  })
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchText, setSearchText] = useState('')

  const refreshPageData = async () => {
    const nextPageState = await fetchPageData(userId)
    setPageState(nextPageState)
  }

  const { filteredRows, pendingCount } = useFilterHistorialLakers(
    pageState.matchHistory?.rows ?? [],
    filterStatus,
    searchText,
  )

  useEffect(() => {
    if (!userId) {
      return
    }

    const loadPageData = async () => {
      setLoading(true)
      try {
        const nextPageState = await fetchPageData(userId)
        setPageState(nextPageState)
      } finally {
        setLoading(false)
      }
    }

    void loadPageData()
  }, [userId])

  return (
    <div>
      <Nav current="Historial Lakers" />

      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <BannerReput
          title="HISTORIAL DE PARTIDOS"
          subtitle="Revisa tus partidos anteriores y tu desempeño"
          logoSrc="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YSBBAgbPAWr0ku6NAqV0yojAo5q9RrpLww&s"
          logoAlt="Lakers logo"
          reputationValue={pageState.reputation}
          loadingReputation={loading}
          icon={
            <span
              className="material-symbols-outlined leading-none text-amarillo-lakers"
              style={{ fontSize: '100px' }}
            >
              star
            </span>
          }
        />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 pb-10">
        <StatsContainer
          summary={pageState.matchHistory?.summary ?? null}
          streak={pageState.matchHistory?.streak ?? null}
        />

        <div className="mt-8 flex flex-col gap-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-Gris-Oscuro">
              Cargando estadísticas...
            </div>
          ) : (
            <>
              <FilterBar
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
                searchText={searchText}
                onSearchChange={setSearchText}
                pendingCount={pendingCount}
              />
              <PastGamesTable
                rows={filteredRows}
                summary={pageState.matchHistory?.summary ?? null}
                onStatsAdded={() => {
                  void refreshPageData()
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default HistorialLakers