import Nav from '../components/Nav/Nav.tsx'
import BannerReput from "../components/LakerCourt/BannerReput";
import { getCurrentUserReputation } from '../services/apiUser.ts';
import { useEffect, useState } from 'react';
function HistorialLakers() {
    const [userReputation, setUserReputation] = useState<number | null>(null)
    const [loadingReputation, setLoadingReputation] = useState(true)

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
        </div>
    )
}

export default HistorialLakers