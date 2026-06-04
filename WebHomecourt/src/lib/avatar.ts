import { supabase } from "./supabase"

export const AVATAR_DRAFT_KEY = "draft_avatar_url"
export const AVATAR_DRAFT_OWNER_KEY = "draft_avatar_user_id"
export const AVATAR_RETURN_KEY = "avatar_return_path"

export async function cleanUserAvatars(userId: string): Promise<void> {
  const { data: existingAvatars, error } = await supabase.storage
    .from("user_images")
    .list("avatars")

  if (error) {
    console.error("Error listing avatars:", error)
    return
  }

  const oldAvatars = (existingAvatars ?? [])
    .filter((file) => file.name.startsWith(`${userId}-`))
    .map((file) => `avatars/${file.name}`)

  if (oldAvatars.length) {
    const { error: removeError } = await supabase.storage
      .from("user_images")
      .remove(oldAvatars)

    if (removeError) console.error("Error removing old avatars:", removeError)
  }
}

export async function moveAvatarFromTemp(
  userId: string,
  photoUrl: string,
  skipCleanup = false,
): Promise<string> {
  if (!photoUrl.includes("/tempImages/")) return photoUrl

  const fileName = photoUrl.split("/tempImages/")[1]
  if (!fileName) return photoUrl

  const newPath = `avatars/${fileName}`

  if (!skipCleanup) {
    await cleanUserAvatars(userId)
  }

  const { error: copyError } = await supabase.storage
    .from("user_images")
    .copy(`tempImages/${fileName}`, newPath)

  if (copyError) {
    console.error("Error copying avatar:", copyError)
    return photoUrl
  }

  const { data: tempFiles, error: listError } = await supabase.storage
    .from("user_images")
    .list("tempImages")

  if (listError) {
    console.error("Error listing temp images:", listError)
  } else if (tempFiles?.length) {
    const pathsToRemove = tempFiles
      .filter((file) => file.name.startsWith(`${userId}-`))
      .map((file) => `tempImages/${file.name}`)

    if (pathsToRemove.length) {
      const { error: removeError } = await supabase.storage
        .from("user_images")
        .remove(pathsToRemove)

      if (removeError) console.error("Error removing temp images:", removeError)
    }
  }

  const { data } = supabase.storage
    .from("user_images")
    .getPublicUrl(newPath)

  return data.publicUrl
}