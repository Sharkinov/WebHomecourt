import { supabase } from "../../lib/supabase"
import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import {
    AVATAR_DRAFT_KEY,
    AVATAR_DRAFT_OWNER_KEY,
    AVATAR_RETURN_KEY,
    cleanUserAvatars,
    moveAvatarFromTemp,
} from "../../lib/avatar"
const DEFAULT_AVATAR = "https://ptbcoxaguvbwprxdundz.supabase.co/storage/v1/object/public/user_images/profile_picture_default.png"
// tipos
export type Gender = {
    gender_id: number
    gender: string
}

type UserData = {
    username: string
    nickname: string
    photo_url: string | null
    gender: number | null
    birthdate: string | null
}

// Funciones fetch 
async function getUserData(userId: string): Promise<UserData | null> {
    const { data, error } = await supabase
        .from("user_laker")
        .select("username, nickname, photo_url, gender, birthdate")
        .eq("user_id", userId)
        .single()

    if (error) {
        console.error("Error fetching user data:", error.message)
        return null
    }
    return data
}

export async function getGenders(): Promise<Gender[]> {
    const { data, error } = await supabase
        .from("gender")
        .select("gender_id, gender")
        .order("gender_id")

    if (error) {
        console.error("Error fetching genders:", error.message)
        return []
    }
    return data || []
}

async function updateUserData(userId: string, userData: Partial<UserData>): Promise<boolean> {
    const { error } = await supabase
        .from("user_laker")
        .update(userData)
        .eq("user_id", userId)

    if (error) {
        console.error("Error updating user:", error.message)
        return false
    }
    return true
}

// componente principal
interface EditProfileProps {
    onBack: () => void
    onSave?: () => void
}

function EditProfile({ onBack, onSave }: EditProfileProps) {
    const { user } = useAuth()
    const navigate = useNavigate()
    const userId = user?.id
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [genders, setGenders] = useState<Gender[]>([])

    // estados del forms
    const [username, setUsername] = useState("")
    const [nickname, setNickname] = useState("")
    const [gender, setGender] = useState<number | null>(null)
    const [birthdate, setBirthdate] = useState("")
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!userId) return
        async function fetchData() {
            if (!userId) return

            setLoading(true)
            const [userData, genderData] = await Promise.all([
                getUserData(userId),
                getGenders()
            ])

            if (userData) {
                setUsername(userData.username || "")
                setNickname(userData.nickname || "")
                setGender(userData.gender)
                setBirthdate(userData.birthdate || "")

                const draftUrl = sessionStorage.getItem(AVATAR_DRAFT_KEY)
                const draftOwner = sessionStorage.getItem(AVATAR_DRAFT_OWNER_KEY)
                const canUseDraft = Boolean(draftUrl) && draftOwner === userId
                setAvatarUrl(canUseDraft ? draftUrl : (userData.photo_url ?? null))
            }
            setGenders(genderData)
            setLoading(false)
        }
        fetchData()
    }, [userId])

    const handleSave = async () => {
        if (!userId) return

        setSaving(true)

                const isTempAvatar = Boolean(avatarUrl?.includes("/tempImages/"))
                await cleanUserAvatars(userId)

                const finalPhotoUrl = avatarUrl
                    ? await moveAvatarFromTemp(userId, avatarUrl, isTempAvatar)
                    : null

        const success = await updateUserData(userId, {
            username,
            nickname,
            photo_url: finalPhotoUrl,
            gender,
            birthdate: birthdate || null
        })

        if (success) {
            sessionStorage.removeItem(AVATAR_DRAFT_KEY)
            sessionStorage.removeItem(AVATAR_DRAFT_OWNER_KEY)
            onSave?.()
            onBack()
        } else {
            alert("Error al guardar los cambios")
        }

        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morado-lakers"></div>
            </div>
        )
    }

    const displayPhoto = avatarUrl && avatarUrl.trim() !== "" ? avatarUrl : DEFAULT_AVATAR

    return (
        <div className="bg-Background min-h-screen">
            {/* contenedor */}
            <div className="pt-4 sm:pt-5 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-[60px] pb-5">

                {/* link de back */}
                <button
                    onClick={onBack}
                    className="text-morado-lakers text-lg sm:text-xl md:text-2xl font-normal hover:text-morado-bajo transition-colors mb-2"
                >
                    {"< Back"}
                </button>

                {/* main content area */}
                <div className="flex flex-col items-center">

                    {/* seccion de pfp */}
                    <div className="flex justify-center items-center w-full max-w-[364px] mb-3 sm:mb-4 md:mb-5">
                        <div className="relative">
                            {/* img pfp */}
                            <img
                                src={displayPhoto}
                                alt="Profile"
                                className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 xl:w-[272px] xl:h-[272px] rounded-full object-cover border-4 border-black/25"
                            />

                            {/* boton de camara */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (userId && avatarUrl) {
                                        sessionStorage.setItem(AVATAR_DRAFT_KEY, avatarUrl)
                                        sessionStorage.setItem(AVATAR_DRAFT_OWNER_KEY, userId)
                                    }
                                    sessionStorage.setItem(AVATAR_RETURN_KEY, "/editar-perfil")
                                    navigate("/edit-avatar")
                                }}
                                className="absolute bottom-0 right-0 w-14 h-14 sm:w-16 sm:h-16 md:w-[70px] md:h-[70px] lg:w-[82px] lg:h-[82px] rounded-full bg-morado-lakers border border-black/25 flex items-center justify-center cursor-pointer hover:bg-morado-bajo transition-colors"
                                aria-label="Edit avatar"
                            >
                                <span
                                    className="material-symbols-outlined text-[#F3F2F3] text-xl sm:text-2xl md:text-3xl lg:text-[35px]"
                                >
                                    edit
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* campos del forms */}
                    <div className="w-full flex flex-col items-start gap-5 sm:gap-6 md:gap-[30px] px-0 sm:px-8 md:px-16 lg:px-32 xl:px-[250px]">

                        {/* campo username */}
                        <div className="w-full">
                            <label className="block h4 mb-1.5 sm:mb-2 md:mb-2.5 text-lg sm:text-xl md:text-2xl" style={{ fontFamily: 'Graphik', fontStyle: 'normal' }}>
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full flex items-center gap-2.5 py-1.5 sm:py-2 md:py-2.5 px-3 sm:px-4 md:px-5 focus:outline-none self-stretch h3 text-lg sm:text-xl md:text-2xl lg:text-[28px]"
                                style={{ borderRadius: '15px', border: '1px solid rgba(0, 0, 0, 0.24)', background: '#FDFDFD', fontFamily: 'Graphik', fontStyle: 'normal' }}
                            />
                        </div>

                        {/* preferred name campo */}
                        <div className="w-full">
                            <label className="block h4 mb-1.5 sm:mb-2 md:mb-2.5 text-lg sm:text-xl md:text-2xl" style={{ fontFamily: 'Graphik', fontStyle: 'normal' }}>
                                Preferred name
                            </label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full flex items-center gap-2.5 py-1.5 sm:py-2 md:py-2.5 px-3 sm:px-4 md:px-5 focus:outline-none self-stretch h3 text-lg sm:text-xl md:text-2xl lg:text-[28px]"
                                style={{ borderRadius: '15px', border: '1px solid rgba(0, 0, 0, 0.24)', background: '#FDFDFD', fontFamily: 'Graphik', fontStyle: 'normal' }}
                            />
                        </div>

                        {/* gender y date of birth campos */}
                        <div className="w-full flex flex-col sm:flex-row gap-4 sm:gap-5">
                            {/* campo gender */}
                            <div className="flex-1">
                                <label className="block h4 mb-1.5 sm:mb-2 md:mb-2.5 text-lg sm:text-xl md:text-2xl" style={{ fontFamily: 'Graphik', fontStyle: 'normal' }}>
                                    Gender
                                </label>
                                <select
                                    value={gender ?? ""}
                                    onChange={(e) => setGender(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full flex items-center gap-2.5 py-1.5 sm:py-2 md:py-2.5 px-3 sm:px-4 md:px-5 focus:outline-none appearance-none cursor-pointer self-stretch h3 text-lg sm:text-xl md:text-2xl lg:text-[28px]"
                                    style={{ borderRadius: '15px', border: '1px solid rgba(0, 0, 0, 0.24)', background: '#FDFDFD', fontFamily: 'Graphik', fontStyle: 'normal' }}
                                >
                                    <option value="">Select</option>
                                    {genders.map((g) => (
                                        <option key={g.gender_id} value={g.gender_id}>
                                            {g.gender}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* date of birth campo */}
                            <div className="flex-1">
                                <label className="block h4 mb-1.5 sm:mb-2 md:mb-2.5 text-lg sm:text-xl md:text-2xl" style={{ fontFamily: 'Graphik', fontStyle: 'normal' }}>
                                    Date of birth
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={birthdate}
                                        onChange={(e) => setBirthdate(e.target.value)}
                                        className="w-full flex items-center gap-2.5 py-1.5 sm:py-2 md:py-2.5 px-3 sm:px-4 md:px-5 pr-10 sm:pr-12 focus:outline-none self-stretch h3 text-lg sm:text-xl md:text-2xl lg:text-[28px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 sm:[&::-webkit-calendar-picker-indicator]:w-12 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                        style={{ borderRadius: '15px', border: '1px solid rgba(0, 0, 0, 0.24)', background: '#FDFDFD', fontFamily: 'Graphik', fontStyle: 'normal' }}
                                    />
                                    <span
                                        className="material-symbols-outlined absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 pointer-events-none text-Gris-Oscuro text-lg sm:text-xl md:text-2xl"
                                    >
                                        calendar_today
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* botones */}
                        <div className="w-full flex flex-col sm:flex-row items-center self-stretch gap-3 sm:gap-4 md:gap-5 pt-8 sm:pt-12 md:pt-16 lg:pt-[70px]">
                            <button
                                onClick={onBack}
                                disabled={saving}
                                className="w-full sm:flex-1 flex justify-center items-center rounded-[15px] bg-transparent border-3 border-morado-lakers text-morado-lakers hover:text-morado-bajo hover:border-morado-bajo transition-colors py-2 sm:py-2.5 md:py-3 px-4 sm:px-5 text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-medium"
                                style={{ fontFamily: 'Graphik', fontStyle: 'normal', lineHeight: 'normal' }}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full sm:flex-1 flex justify-center items-center rounded-[15px] bg-morado-lakers border-3 border-morado-lakers text-[#F3F2F3] hover:bg-morado-bajo hover:border-morado-bajo transition-colors disabled:opacity-50 py-2 sm:py-2.5 md:py-3 px-4 sm:px-5 text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-medium"
                                style={{ fontFamily: 'Graphik', fontStyle: 'normal', lineHeight: 'normal' }}
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditProfile