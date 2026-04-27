import Button from "../components/button"
import { supabase } from "../lib/supabase"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const AVATAR_DRAFT_KEY = "draft_avatar_url"

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

function saveAvatarDraft(url: string) {
  sessionStorage.setItem(AVATAR_DRAFT_KEY, url)
}

function saveDraftAndReturn(url: string, navigate: ReturnType<typeof useNavigate>) {
  saveAvatarDraft(url)
  navigate("/complete-register")
}

function EditAvatar() {
  const navigate = useNavigate()
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
                onClick={() => saveDraftAndReturn(url, navigate)}
                className="rounded-3xl overflow-hidden shadow-lg bg-white/0 ring-2 ring-transparent hover:ring-morado-lakers/40 transition"
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