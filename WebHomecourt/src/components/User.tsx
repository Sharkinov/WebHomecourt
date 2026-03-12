import { supabase } from "../lib/supabase"
import { useEffect, useState } from "react"

type User = { 
    user_type: number 
    birthdate: string 
    nickname: string 
    username: string 
    photo_url: string 
    gender: number 
    credits: number 
    crowns: number 
    allow_lakers_court: boolean 
    notifications: boolean 
    online: boolean }

export async function getUserById(userId: string): Promise<User | null> {
  if (!userId) {
    throw new Error("Invalid user id")
  }
  const { data, error } = await supabase
    .from("user_laker")
    .select(`
      user_id,
      user_type,
      birthdate,
      nickname,
      username,
      photo_url,
      gender,
      credits,
      crowns,
      allow_lakers_court,
      notifications,
      online
    `)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("Supabase error:", error.message)
    throw new Error("Failed to fetch user")
  }
  return data
}

function UserData({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const data = await getUserById(userId)
      setUser(data)
    }

    loadUser()
  }, [userId])

  if (!user) return <p>Loading...</p>

  return (
    <div className="p-10">
      <h1></h1>
      <h2>{user.nickname}</h2>
      <p>@{user.username}</p>
      <p>Credits: {user.credits}</p>
      <p>Crowns: {user.crowns}</p>
      <p>birthdate: {user.birthdate}</p>
      <img src= {user.photo_url} className="w-20 h-20 rounded-full"/>
    </div>
  )
}

export default UserData
