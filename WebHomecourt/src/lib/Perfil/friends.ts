import { supabase } from '../supabase'

export type Friend = {
    user_id: string
    nickname: string
    username: string
    photo_url: string | null
}

export type FriendRequest = {
    friend_request_id: number
    sender_id: string
    nickname: string
    username: string
    photo_url: string | null
    created_at: string
}

//PARA FUNCION GET FRIENDSHIP STATUS
export type FriendshipStatus = "no_friend" | "pending" | "friend";

//FUNCION GET FRIENDS LIST
export async function getFriendsList(userId: string): Promise<Friend[]> {
    if (!userId) return []
  
    const { data: friendsAsUser1, error: error1 } = await supabase
        .from('friendship')
        .select(`
            user2:user_laker!friendship_user2_fkey (
                user_id,
                nickname,
                username,
                photo_url
            )
        `)
        .eq('user1', userId)

    if (error1) {
        console.error('error fetching friends (user1):', error1.message)
    }

    const { data: friendsAsUser2, error: error2 } = await supabase
        .from('friendship')
        .select(`
            user1:user_laker!friendship_user1_fkey (
                user_id,
                nickname,
                username,
                photo_url
            )
        `)
        .eq('user2', userId)

    if (error2) {
        console.error('error fetching friends (user2):', error2.message)
    }

    const friends: Friend[] = []

    friendsAsUser1?.forEach(item => {
        const friend = item.user2 as unknown as Friend
        if (friend) {
            friends.push({
                user_id: friend.user_id,
                nickname: friend.nickname || friend.username || 'Usuario',
                username: friend.username || '',
                photo_url: friend.photo_url
            })
        }
    })

    friendsAsUser2?.forEach(item => {
        const friend = item.user1 as unknown as Friend
        if (friend) {
            friends.push({
                user_id: friend.user_id,
                nickname: friend.nickname || friend.username || 'Usuario',
                username: friend.username || '',
                photo_url: friend.photo_url
            })
        }
    })

    return friends
}

//FUNCION GET FRIENDS COUNT 
export async function getFriendsCount(userId: string): Promise<number> {
    if (!userId) return 0

    const { data: count1 } = await supabase
        .from('friendship')
        .select('friendship_id')
        .eq('user1', userId)

    const { data: count2 } = await supabase
        .from('friendship')
        .select('friendship_id')
        .eq('user2', userId)

    return (count1?.length || 0) + (count2?.length || 0)
}

// FUNCION GET FRIENDSHIP STATUS
export async function getFriendshipStatus(profileUserId: string): Promise<FriendshipStatus> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "no_friend";

  const myId = user.id;

  // revisa si ya son amigos
  const { data: friendship } = await supabase
    .from("friendship")
    .select("friendship_id")
    .or(`and(user1.eq.${myId},user2.eq.${profileUserId}),and(user1.eq.${profileUserId},user2.eq.${myId})`)
    .maybeSingle();

  if (friendship) return "friend";

  // revisa si hay solicitud pendiente
  const { data: request } = await supabase
    .from("friend_request")
    .select("friend_request_id")
    .eq("sender_id", myId)
    .eq("receiver_id", profileUserId)
    .eq("status", "pending")
    .maybeSingle();

  if (request) return "pending";

  return "no_friend";
}

// FUNCION SEND FRIEND REQUEST
export async function sendFriendRequest(receiverId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase
        .from("friend_request")
        .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            status: "pending"
        })

    if (error) {
        console.error("error sending friend request:", error.message)
        throw new Error("failed to send friend request")
    }
}

// FUNCION ACCEPT FRIEND REQUEST
export async function acceptFriendRequest(requestId: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // trae la solicitud para obtener sender_id
    const { data: request, error: fetchError } = await supabase
        .from("friend_request")
        .select("sender_id, receiver_id")
        .eq("friend_request_id", requestId)
        .single()

    if (fetchError || !request) throw new Error("Friend request not found")

    // inserta en friendship
    const { error: friendshipError } = await supabase
        .from("friendship")
        .insert({
            user1: request.sender_id,
            user2: request.receiver_id
        })

    if (friendshipError) throw new Error("Failed to create friendship")

    // actualizar status a accepted
    const { error: updateError } = await supabase
        .from("friend_request")
        .update({ status: "accepted" })
        .eq("friend_request_id", requestId)

    if (updateError) throw new Error("Failed to update friend request status")
}

//en vez de usar el join por nombre, se hacen dos queries separados
export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
    if (!userId) return []

    const { data, error } = await supabase
        .from("friend_request")
        .select("friend_request_id, sender_id, created_at")
        .eq("receiver_id", userId)
        .eq("status", "pending")

    if (error) {
        console.error("error fetching pending requests:", error.message)
        return []
    }

    if (!data || data.length === 0) return []

    // trae info de cada sender por separado
    const requests = await Promise.all(
        data.map(async (item) => {
            const { data: sender } = await supabase
                .from("user_laker")
                .select("nickname, username, photo_url")
                .eq("user_id", item.sender_id)
                .single()

            return {
                friend_request_id: item.friend_request_id,
                sender_id: item.sender_id,
                created_at: item.created_at,
                nickname: sender?.nickname || sender?.username || 'Usuario',
                username: sender?.username || '',
                photo_url: sender?.photo_url || null
            }
        })
    )

    return requests
}

// FUNCION DENY FRIEND REQUEST
export async function denyFriendRequest(requestId: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase
        .from("friend_request")
        .update({ status: "denied" })
        .eq("friend_request_id", requestId)

    if (error) {
        console.error("error denying friend request:", error.message)
        throw new Error("failed to deny friend request")
    }
}

// FUNCION REMOVE FRIEND
export async function removeFriend(friendId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase
        .from("friendship")
        .delete()
        .or(`and(user1.eq.${user.id},user2.eq.${friendId}),and(user1.eq.${friendId},user2.eq.${user.id})`)

    if (error) {
        console.error("error removing friend:", error.message)
        throw new Error("failed to remove friend")
    }
}
