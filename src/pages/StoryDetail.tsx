import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Folktale } from '@/types/folktale'
import { Heart, MapPin, ArrowLeft, Users, Target, BookOpen, Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { NotesSection } from '@/components/notes/NotesSection'

const StoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { toast } = useToast()
  const [folktale, setFolktale] = useState<Folktale | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchFolktale()
      if (user) {
        checkIfFavorited()
      }
    }
  }, [id, user])

  const fetchFolktale = async () => {
    try {
      const { data, error } = await supabase
        .from('folktales')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setFolktale(data)
    } catch (error) {
      console.error('Error fetching folktale:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkIfFavorited = async () => {
    if (!user || !id) return

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('folktale_id', id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setIsFavorited(!!data)
    } catch (error) {
      console.error('Error checking favorite status:', error)
    }
  }

  const handleFavoriteToggle = async () => {
    if (!user || !folktale) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add favorites.",
        variant: "destructive",
      })
      return
    }

    setFavoriteLoading(true)
    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('folktale_id', folktale.id)
        
        if (error) throw error
        setIsFavorited(false)
        
        toast({
          title: "Removed from favorites",
          description: "Story removed from your favorites.",
        })
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, folktale_id: folktale.id })
        
        if (error) throw error
        setIsFavorited(true)
        
        toast({
          title: "Added to favorites",
          description: "Story added to your favorites.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setFavoriteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!folktale) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Story not found</h1>
          <Link to="/">
            <Button>Return to Stories</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Lock className="h-16 w-16 text-muted-foreground" />
              </div>
              <CardTitle>Sign In Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                You need to sign in to read the full story.
              </p>
              <div className="space-y-2">
                <Link to="/auth" className="block">
                  <Button className="w-full">Sign In</Button>
                </Link>
                <Link to="/" className="block">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Stories
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stories
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Story Content */}
          <div className="lg:col-span-2 space-y-8">
            <article className="space-y-6">
              <header className="text-center space-y-4">
                <h1 className="text-4xl font-bold leading-tight">{folktale.title}</h1>
                <div className="flex items-center justify-center space-x-4 text-muted-foreground">
                  {folktale.nation && (
                    <span className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <Badge variant="outline">{folktale.nation}</Badge>
                    </span>
                  )}
                  {folktale.source && (
                    <Badge variant="secondary">{folktale.source}</Badge>
                  )}
                </div>
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleFavoriteToggle}
                    disabled={favoriteLoading}
                    className="flex items-center space-x-2"
                  >
                    <Heart 
                      className={`h-4 w-4 ${
                        isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                      }`} 
                    />
                    <span>{isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                  </Button>
                </div>
              </header>

              <Card>
                <CardHeader>
                  <CardTitle>The Story</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-lg max-w-none dark:prose-invert">
                    <p className="leading-relaxed whitespace-pre-line">{folktale.text}</p>
                  </div>
                </CardContent>
              </Card>
            </article>
          </div>

          {/* Notes and Progress Sidebar */}
          <div className="lg:col-span-1">
            <NotesSection folktaleId={folktale.id} folktaleTitle={folktale.title} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default StoryDetail