import { useEffect, useState } from 'react'
import { supabase } from "../lib/supabase"
import { getGenders } from '../components/Perfil/EditProfile'
import type { Gender } from '../components/Perfil/EditProfile'
import GenderSelect from '../components/GenderSelect'
import StatusAlert from '../components/Messages/StatusAlert'
import { useNavigate } from 'react-router-dom'
import { fetchDefaultAvatarUrls } from './EditAvatar'

const AVATAR_DRAFT_KEY = "draft_avatar_url"
const REGISTER_DRAFT_KEY = "complete_register_draft"
const AVATAR_FALLBACK_CLASS = "w-full h-full rounded-3xl bg-white/80 border border-black/10 shadow-inner"

type RegisterDraft = {
  username: string
  nickname: string
  birthdate: string
  gender: number | null
  avatarUrl: string | null
}

const EMPTY_REGISTER_DRAFT: RegisterDraft = {
  username: "",
  nickname: "",
  birthdate: "",
  gender: null,
  avatarUrl: null,
}

function loadRegisterDraft(): RegisterDraft | null {
  const rawDraft = sessionStorage.getItem(REGISTER_DRAFT_KEY)

  if (!rawDraft) return null

  try {
    return JSON.parse(rawDraft) as RegisterDraft
  } catch {
    return null
  }
}

function saveRegisterDraft(draft: RegisterDraft) {
  sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(draft))
}

function getDraftWithFallback(draft: RegisterDraft | null): RegisterDraft {
  return draft ?? EMPTY_REGISTER_DRAFT
}

function updateRegisterDraft(patch: Partial<RegisterDraft>) {
  const currentDraft = getDraftWithFallback(loadRegisterDraft())
  saveRegisterDraft({
    ...currentDraft,
    ...patch,
  })
}

function validateRegisterFormFields(fields: Pick<RegisterDraft, 'username' | 'nickname' | 'birthdate' | 'gender'>): boolean {
  const hasUsername = fields.username.trim().length > 0
  const hasNickname = fields.nickname.trim().length > 0
  const hasBirthdate = fields.birthdate.trim().length > 0
  const hasGender = fields.gender !== null

  return hasUsername && hasNickname && hasBirthdate && hasGender
}

type InitialRegisterData = {
  draft: RegisterDraft
  userId: string | null
  genders: Gender[]
  avatarUrl: string | null
}

async function fetchInitialRegisterData(): Promise<InitialRegisterData> {
  const draft = getDraftWithFallback(loadRegisterDraft())
  const { data } = await supabase.auth.getUser()

  const [genderData, defaultAvatarUrls] = await Promise.all([
    getGenders(),
    fetchDefaultAvatarUrls(),
  ])

  const draftAvatarUrl = sessionStorage.getItem(AVATAR_DRAFT_KEY)

  if (draftAvatarUrl) {
    updateRegisterDraft({ avatarUrl: draftAvatarUrl })
    return {
      draft,
      userId: data.user?.id ?? null,
      genders: genderData,
      avatarUrl: draftAvatarUrl,
    }
  }

  if (draft.avatarUrl) {
    return {
      draft,
      userId: data.user?.id ?? null,
      genders: genderData,
      avatarUrl: draft.avatarUrl,
    }
  }

  const randomAvatarUrl = defaultAvatarUrls.length
    ? defaultAvatarUrls[Math.floor(Math.random() * defaultAvatarUrls.length)]
    : null

  if (randomAvatarUrl) {
    sessionStorage.setItem(AVATAR_DRAFT_KEY, randomAvatarUrl)
    updateRegisterDraft({ avatarUrl: randomAvatarUrl })
  }

  return {
    draft,
    userId: data.user?.id ?? null,
    genders: genderData,
    avatarUrl: randomAvatarUrl,
  }
}

type ContinueRegistrationParams = {
  userId: string | null
  saving: boolean
  username: string
  nickname: string
  birthdate: string
  gender: number | null
  avatarUrl: string | null
}

async function continueRegistration(params: ContinueRegistrationParams): Promise<{ ok: boolean; error: string | null }> {
  const {
    userId,
    saving,
    username,
    nickname,
    birthdate,
    gender,
    avatarUrl,
  } = params

  if (!validateRegisterFormFields({ username, nickname, birthdate, gender })) {
    return {
      ok: false,
      error: 'Please complete all fields before continuing.',
    }
  }

  if (!userId || saving) {
    return {
      ok: false,
      error: 'There is no active session. Please sign in again and try once more.',
    }
  }

  const ok = await insertUser(
    userId,
    username,
    nickname,
    birthdate,
    gender,
    avatarUrl,
  )

  if (!ok) {
    return {
      ok: false,
      error: 'We could not complete the registration. Please try again in a moment.',
    }
  }

  return {
    ok: true,
    error: null,
  }
}

async function insertUser(
  userId: string,
  username: string,
  nickname: string,
  birthdate: string,
  gender: number | null,
  photoUrl: string | null,
): Promise<boolean> {
  const { error } = await supabase
    .from('user_laker')
    .insert({
      user_id: userId,
      username,
      nickname,
      birthdate,
      gender, 
      photo_url: photoUrl,
    })

   if (error) {
    console.error('Error insertando usuario:', error)
    return false
  }

  return true
}

function CompleteRegister() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState("")
  const [nickname, setNickname] = useState("")
  const [birthdate, setBirthdate] = useState("")
  const [gender, setGender] = useState<number | null>(null)
  const [genders, setGenders] = useState<Gender[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchInitialRegisterData()
        setUsername(data.draft.username)
        setNickname(data.draft.nickname)
        setBirthdate(data.draft.birthdate)
        setGender(data.draft.gender)
        setAvatarUrl(data.avatarUrl)
        setUserId(data.userId)
        setGenders(data.genders)
      } finally {
        setAvatarLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleContinue = async () => {
    setFormError(null)
    setSaving(true)

    const result = await continueRegistration({
      userId,
      saving,
      username,
      nickname,
      birthdate,
      gender,
      avatarUrl,
    })

    if (!result.ok) {
      setSaving(false)
      setFormError(result.error)
      return
    }

    sessionStorage.removeItem(AVATAR_DRAFT_KEY)
    sessionStorage.removeItem(REGISTER_DRAFT_KEY)
    setSaving(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div className="w-full max-w-md mx-auto md:mx-0">
            <div className="flex flex-col items-center md:items-start">
              <img
                src="/lakers_homecourt.png"
                className="h-10 object-contain mb-6"
              />
              <h1 className="text-morado-lakers mb-1 text-center md:text-left">More about you</h1>
              <p className="text-gray-600 mb-6 text-center md:text-left">How would you be known?</p>
              <div className="md:hidden w-full flex justify-center mb-6">
                <div className="relative w-60 h-60">
                  {avatarLoading ? (
                    <div className={AVATAR_FALLBACK_CLASS} />
                  ) : avatarUrl ? (
                    <img
                      src={avatarUrl}
                      className="w-full h-full object-cover rounded-3xl"
                      alt="Avatar preview"
                    />
                  ) : (
                    <div className={AVATAR_FALLBACK_CLASS} />
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/edit-avatar')}
                    className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-[#2B0B45] flex items-center justify-center shadow-lg"
                    aria-label="Edit avatar"
                  >
                    <span className="material-symbols-outlined text-white text-2xl">
                      edit
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-5 w-full">
                {formError && (
                  <StatusAlert
                    tone="error"
                    title={formError}
                  />
                )}
                <div className="flex flex-col gap-2">
                  <label>Username</label>
                  <input
                    value={username}
                    onChange={(e) => {
                      const nextValue = e.target.value
                      setUsername(nextValue)
                      setFormError(null)
                      updateRegisterDraft({ username: nextValue })
                    }}
                    placeholder="@username"
                    className="h-12 w-full px-4 rounded-2xl bg-white text-zinc-700 outline outline-1 outline-black/10 focus:outline-2 focus:outline-morado-lakers"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label>Preferred name</label>
                  <input
                    value={nickname}
                    onChange={(e) => {
                      const nextValue = e.target.value
                      setNickname(nextValue)
                      setFormError(null)
                      updateRegisterDraft({ nickname: nextValue })
                    }}
                    placeholder="Preferred name"
                    className="h-12 w-full px-4 rounded-2xl bg-white text-zinc-700 outline outline-1 outline-black/10 focus:outline-2 focus:outline-morado-lakers"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label>Date of birth</label>
                  <input
                    type="date"
                    value={birthdate}
                    onChange={(e) => {
                      const nextValue = e.target.value
                      setBirthdate(nextValue)
                      setFormError(null)
                      updateRegisterDraft({ birthdate: nextValue })
                    }}
                    className="h-12 w-full px-4 rounded-2xl bg-white text-zinc-700 outline outline-1 outline-black/10 focus:outline-2 focus:outline-morado-lakers"
                  />
                </div>
                <GenderSelect
                  genders={genders}
                  value={gender}
                  onChange={(nextGender) => {
                    setGender(nextGender)
                    setFormError(null)
                    updateRegisterDraft({ gender: nextGender })
                  }}
                />
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={saving}
                  className="h-12 w-full rounded-2xl bg-morado-lakers text-white text-xl font-semibold"
                >
                  {saving ? "Saving..." : "Continue"}
                </button>
              </div>
            </div>
          </div>
          <div className="w-full hidden md:flex justify-end">
            <div className="relative w-full max-w-sm">
              {avatarLoading ? (
                <div className={`aspect-square ${AVATAR_FALLBACK_CLASS}`} />
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  className="w-full aspect-square rounded-3xl object-cover"
                  alt="Avatar preview"
                />
              ) : (
                <div className={`aspect-square ${AVATAR_FALLBACK_CLASS}`} />
              )}

              <button
                type="button"
                onClick={() => navigate('/edit-avatar')}
                className="absolute -right-3 -bottom-3 w-20 h-20 rounded-full bg-[#2B0B45] flex items-center justify-center shadow-lg"
                aria-label="Edit avatar"
              >
                <span className="material-symbols-outlined text-white text-4xl">
                  edit
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default CompleteRegister