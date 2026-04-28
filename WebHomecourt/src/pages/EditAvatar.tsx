import Button from "../components/button"
import { supabase } from "../lib/supabase"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

const AVATAR_DRAFT_KEY = "draft_avatar_url"
const AVATAR_DRAFT_OWNER_KEY = "draft_avatar_user_id"

export async function fetchDefaultAvatarUrls(): Promise<string[]> {
  const { data: files, error } = await supabase.storage
    .from("user_images")
    .list("default")

  if (error) throw error

  return (files ?? []).map((file) => {
    const { data } = supabase.storage
      .from("user_images")
      .getPublicUrl(`default/${file.name}`)
    return data.publicUrl
  })
}

function saveAvatarDraft(url: string, userId: string) {
  sessionStorage.setItem(AVATAR_DRAFT_KEY, url)
  sessionStorage.setItem(AVATAR_DRAFT_OWNER_KEY, userId)
}

function saveDraftAndReturn(url: string, userId: string, navigate: ReturnType<typeof useNavigate>) {
  saveAvatarDraft(url, userId)
  navigate("/complete-register")
}

export async function uploadPhotoDefault(userId: string, file: File): Promise<string | null> {
  const fileExt = file.name.split(".").pop() ?? "png"
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `tempImages/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from("user_images")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type || undefined,
    })

  if (uploadError) {
    console.error("Error uploading photo:", uploadError.message)
    return null
  }

  const { data } = supabase.storage
    .from("user_images")
    .getPublicUrl(filePath)

  return data.publicUrl
}

function EditAvatar() {
  const navigate = useNavigate()
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handlePickUpload = () => {
    fileInputRef.current?.click()
  }

  const handleUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    setUploading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) {
        throw new Error("No active session found. Please sign in again.")
      }

      const uploadedUrl = await uploadPhotoDefault(userId, file)
      if (!uploadedUrl) {
        throw new Error("Upload failed. Please try again.")
      }

      saveDraftAndReturn(uploadedUrl, userId, navigate)
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) return console.error(error)
      setUserId(data.user?.id ?? null)
    })

    let mounted = true

    const loadImages = async () => {
      try {
        const urls = await fetchDefaultAvatarUrls()
        if (!mounted) return
        setImages(urls)
      } catch (error) {
        console.error(error)
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    loadImages()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="relative min-h-screen bg-zinc-100 flex items-center justify-center overflow-hidden">
      <div className="mx-auto w-full px-8 pt-8 pb-10 flex flex-col gap-10">
        <div className="w-full flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src="/lakers_homecourt.png"
              alt="Lakers Homecourt"
              className="h-10 object-contain hidden md:block"
            />
            <h1 className="text-morado-lakers mb-1 text-center md:text-left">
              Choose your avatar
            </h1>
          </div>
          <Button
            type="primary"
            text="Return"
            className="px-8 !py-2"
            onClick={() => navigate("/complete-register")}
          />
        </div>

        <button
          type="button"
          onClick={handlePickUpload}
          disabled={uploading}
          className="w-full rounded-3xl bg-gradient-to-r from-morado-lakers via-morado-lakers to-morado-oscuro shadow-2xl px-8 md:px-10 py-10 flex items-center justify-center gap-6 text-left"
        >
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-5xl">
              {uploading ? "hourglass_top" : "photo_camera"}
            </span>
          </div>

          <div className="flex flex-col">
            <h2 className="text-white text-2xl md:text-4xl leading-10">
              {uploading ? "Uploading image..." : "Upload your own image"}
            </h2>
            {/* <p className="text-white/80 text-sm md:text-base">
              Select a file and we will save the public URL for you.
            </p> */}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadChange}
            className="hidden"
          />
        </button>

        <div className="w-full flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-300" />
          <p className="text-gray-500 text-lg font-normal leading-7">Or</p>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morado-lakers" />
          </div>
        ) : (
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => {
                  if (userId) {
                    saveDraftAndReturn(url, userId, navigate)
                  }
                }}
                disabled={!userId}
                className="rounded-3xl overflow-hidden shadow-lg bg-white/0 ring-2 ring-transparent hover:ring-morado-lakers/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img
                  src={url}
                  alt="avatar"
                  className="w-full aspect-square object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EditAvatar