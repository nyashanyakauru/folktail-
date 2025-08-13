export interface Profile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  created_at: string
}

export interface Folktale {
  id: string
  title: string
  text: string
  nation?: string
  source?: string
}

export interface Favorite {
  id: string
  user_id: string
  folktale_id: string
  created_at: string
  folktales?: Folktale
}