import React, { useEffect, useState } from 'react'
import { FolktaleCard } from '@/components/folktales/FolktaleCard'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Favorite } from '@/types/folktale'
import { Heart, BookOpen } from 'lucide-react'
import { Navigate } from 'react-router-dom'

const Favorites: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchFavorites()
    }
  }, [user])

  const fetchFavorites = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          folktales (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFavorites(data || [])
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold">Your Favorite Stories</h1>
          </div>
          <p className="text-muted-foreground">
            Stories you've saved for later reading
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">
              No favorites yet
            </h2>
            <p className="text-muted-foreground">
              Start exploring stories and add them to your favorites!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              favorite.folktales && (
                <FolktaleCard
                  key={favorite.id}
                  folktale={favorite.folktales}
                  isFavorited={true}
                  onFavoriteChange={fetchFavorites}
                />
              )
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Favorites