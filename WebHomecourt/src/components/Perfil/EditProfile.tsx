import { supabase } from "../../lib/supabase"
import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/Perfil/useAuth"
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

export async function uploadPhoto(userId: string, file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
        .from("user_images")
        .upload(filePath, file)

    if (uploadError) {
        console.error("Error uploading photo:", uploadError.message)
        return null
    }

    const { data } = supabase.storage
        .from("user_images")
        .getPublicUrl(filePath)

    return data.publicUrl
}

// componente principal
interface EditProfileProps {
    onBack: () => void
    onSave?: () => void
}

function EditProfile({ onBack, onSave }: EditProfileProps) {
    const { userId } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [genders, setGenders] = useState<Gender[]>([])
    
    // estados del forms
    const [username, setUsername] = useState("")
    const [nickname, setNickname] = useState("")
    const [photoUrl, setPhotoUrl] = useState<string | null>(null)
    const [gender, setGender] = useState<number | null>(null)
    const [birthdate, setBirthdate] = useState("")
    
    // photo upload state
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)

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
                setPhotoUrl(userData.photo_url)
                setGender(userData.gender)
                setBirthdate(userData.birthdate || "")
            }
            setGenders(genderData)
            setLoading(false)
        }
        fetchData()
    }, [userId])

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setPhotoFile(file)
            const previewUrl = URL.createObjectURL(file)
            setPhotoPreview(previewUrl)
        }
    }

    const handleSave = async () => {
        if (!userId) return

        setSaving(true)

        let newPhotoUrl = photoUrl

        if (photoFile) {
            const uploadedUrl = await uploadPhoto(userId, photoFile)
            if (uploadedUrl) {
                newPhotoUrl = uploadedUrl
            }
        }

        const success = await updateUserData(userId, {
            username,
            nickname,
            photo_url: newPhotoUrl,
            gender,
            birthdate: birthdate || null
        })

        setSaving(false)

        if (success) {
            onSave?.()
            onBack()
        } else {
            alert("Error al guardar los cambios")
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morado-lakers"></div>
            </div>
        )
    }

    const displayPhoto =
    photoPreview ||
    (photoUrl && photoUrl.trim() !== "" ? photoUrl : DEFAULT_AVATAR)

    return (
        <div className="bg-Background min-h-screen">
            {/* contenedor */}
            <div className="pt-5 px-[60px] pb-5">
                
                {/* link de back */}
                <button
                    onClick={onBack}
                    className="text-morado-lakers text-2xl font-normal hover:text-morado-bajo transition-colors mb-2"
                >
                    {"< Back"}
                </button>

                {/* main content area */}
                <div className="flex flex-col items-center">

                    {/* seccion de pfp */}
                    <div className="flex justify-center items-center w-[364px] mb-3">
                        <div className="relative">
                            {/* img pfp */}
                            <img
                                src={displayPhoto}
                                alt="Profile"
                                className="w-[272px] h-[272px] rounded-full object-cover border-4 border-black/25"
                            />

                            {/* boton de camara */}
                            <label className="absolute bottom-0 right-0 w-[82px] h-[82px] rounded-full bg-morado-lakers border border-black/25 flex items-center justify-center cursor-pointer hover:bg-morado-bajo transition-colors">
                                <span
                                    className="material-symbols-outlined text-[#F3F2F3]"
                                    style={{ fontSize: '35px' }}
                                >
                                    photo_camera
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* campos del forms */}
                    <div className="w-full flex flex-col items-start gap-[30px] px-[250px]">

                        {/* campo username */}
                        <div className="w-full">
                            <label className="block h4 mb-2.5" style={{ fontFamily: 'Graphik', fontSize: '24px', fontStyle: 'normal' }}>
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full flex items-center gap-2.5 py-2.5 px-5 focus:outline-none self-stretch h3"
                                style={{ borderRadius: '15px', border: '1px solid rgba(0, 0, 0, 0.24)', background: '#FDFDFD', fontFamily: 'Graphik', fontSize: '28px', fontStyle: 'normal' }}
                            />
                        </div>

                        {/* preferred name campo */}
                        <div className="w-full">
                            <label className="block h4 mb-2.5" style={{ fontFamily: 'Graphik', fontSize: '24px', fontStyle: 'normal' }}>
                                Preferred name
                            </label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full flex items-center gap-2.5 py-2.5 px-5 focus:outline-none self-stretch h3"
                                style={{ borderRadius: '15px', border: '1px solid rgba(0, 0, 0, 0.24)', background: '#FDFDFD', fontFamily: 'Graphik', fontSize: '28px', fontStyle: 'normal' }}
                            />
                        </div>

                        {/* gender y date of birth campos */}
                        <div className="w-full flex gap-5">
                            {/* campo gender */}
                            <div className="flex-1">
                                <label className="block h4 mb-2.5" style={{ fontFamily: 'Graphik', fontSize: '24px', fontStyle: 'normal' }}>
                                    Gender
                                </label>
                                <select
                                    value={gender ?? ""}
                                    onChange={(e) => setGender(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full flex items-center gap-2.5 py-2.5 px-5 focus:outline-none appearance-none cursor-pointer self-stretch h3"
                                    style={{ borderRadius: '15px', border: '1px solid rgba(0, 0, 0, 0.24)', background: '#FDFDFD', fontFamily: 'Graphik', fontSize: '28px', fontStyle: 'normal' }}
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
                                <label className="block h4 mb-2.5" style={{ fontFamily: 'Graphik', fontSize: '24px', fontStyle: 'normal' }}>
                                    Date of birth
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={birthdate}
                                        onChange={(e) => setBirthdate(e.target.value)}
                                        className="w-full flex items-center gap-2.5 py-2.5 px-5 pr-12 focus:outline-none self-stretch h3 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-12 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                        style={{ borderRadius: '15px', border: '1px solid rgba(0, 0, 0, 0.24)', background: '#FDFDFD', fontFamily: 'Graphik', fontSize: '28px', fontStyle: 'normal' }}
                                    />
                                    <span
                                        className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-Gris-Oscuro"
                                        style={{ width: '21px', height: '24px', fontSize: '24px' }}
                                    >
                                        calendar_today
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* botones */}
                        <div className="w-full flex items-center self-stretch" style={{ paddingTop: '70px', gap: '20px' }}>
                            <button
                                onClick={onBack}
                                disabled={saving}
                                className="flex justify-center items-center rounded-[15px] bg-transparent border-3 border-morado-lakers hover:text-morado-bajo hover:border-morado-bajo transition-colors"
                                style={{ padding: '12px 20px', gap: '10px', flex: '1 0 0', color: '#542581', fontFamily: 'Graphik', fontSize: '32px', fontStyle: 'normal', fontWeight: 500, lineHeight: 'normal' }}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex justify-center items-center rounded-[15px] bg-morado-lakers border-3 border-morado-lakers hover:bg-morado-bajo hover:border-morado-bajo transition-colors disabled:opacity-50"
                                style={{ padding: '12px 20px', gap: '10px', flex: '1 0 0', color: '#F3F2F3', fontFamily: 'Graphik', fontSize: '32px', fontStyle: 'normal', fontWeight: 500, lineHeight: 'normal' }}
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