import Nav from '../components/Nav/Nav.tsx'
import BannerReput from "../components/LakerCourt/BannerReput";
import {
    getCurrentUserReputation,
    getCurrentUserMatchHistoryDashboard,
    getCurrentUserWinStreak,
    type UserMatchHistoryDashboard,
    type UserWinStreakSummary,
} from '../services/apiUser.ts';
import { useEffect, useState } from 'react';
import StatsContainer from '../components/HistorialLakers/StatsContainer.tsx';
import PastGamesTable from '../components/HistorialLakers/PastGamesTable.tsx';
function HistorialLakers() {
    const [userReputation, setUserReputation] = useState<number | null>(null)
    const [loadingReputation, setLoadingReputation] = useState(true)
    const [matchHistory, setMatchHistory] = useState<UserMatchHistoryDashboard | null>(null)
    const [winStreak, setWinStreak] = useState<UserWinStreakSummary | null>(null)
    const [loadingMatchData, setLoadingMatchData] = useState(true)

    const loadUserReputation = async () => {
        setLoadingReputation(true)
        try {
            const reputation = await getCurrentUserReputation()
            setUserReputation(reputation)
        } finally {
            setLoadingReputation(false)
        }
    }

    useEffect(() => {
        loadUserReputation()
    }, [])

    const loadMatchData = async () => {
        setLoadingMatchData(true)
        try {
            const [history, streak] = await Promise.all([
                getCurrentUserMatchHistoryDashboard(),
                getCurrentUserWinStreak(),
            ])
            setMatchHistory(history)
            setWinStreak(streak)
        } finally {
            setLoadingMatchData(false)
        }
    }

    useEffect(() => {
        loadMatchData()
    }, [])

    return (
        <div>
            <Nav current="Historial Lakers" />
            <div className="w-full max-w-7xl mx-auto px-4 py-8">
                <BannerReput
                    title="HISTORIAL DE PARTIDOS"
                    subtitle="Revisa tus partidos anteriores y tu desempeño"
                    logoSrc="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YSBBAgbPAWr0ku6NAqV0yojAo5q9RrpLww&s"
                    logoAlt="Lakers logo"
                    reputationValue={userReputation}
                    loadingReputation={loadingReputation}
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
                <StatsContainer summary={matchHistory?.summary ?? null} streak={winStreak} />
                {!loadingMatchData ? (
                    <div className="mt-8">
                        <PastGamesTable rows={matchHistory?.rows ?? []} />
                    </div>
                ) : null}
                {loadingMatchData ? (
                    <p className="mt-4 text-sm text-Gris-Oscuro">Cargando estadisticas...</p>
                ) : null}
            </div>
        </div>
    )
}

export default HistorialLakers