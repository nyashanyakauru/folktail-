import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, MapPin, BookOpen } from 'lucide-react'
import { Folktale } from '@/types/folktale'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'

interface FolktaleCardProps {
  folktale: Folktale
  isFavorited?: boolean
  onFavoriteChange?: () => void
}

export const FolktaleCard: React.FC<FolktaleCardProps> = ({ 
  folktale, 
  isFavorited = false, 
  onFavoriteChange 
}) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
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
        
        toast({
          title: "Removed from favorites",
          description: "Story removed from your favorites.",
        })
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, folktale_id: folktale.id })
        
        if (error) throw error
        
        toast({
          title: "Added to favorites",
          description: "Story added to your favorites.",
        })
      }
      
      onFavoriteChange?.()
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

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-border/50 hover:border-primary/50">
      <Link to={`/story/${folktale.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {folktale.title}
              </CardTitle>
              <CardDescription className="mt-2 flex items-center space-x-4 text-sm">
                {folktale.nation && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <Badge variant="outline" className="text-xs">
                      {folktale.nation}
                    </Badge>
                  </span>
                )}
                {folktale.source && (
                  <Badge variant="secondary" className="text-xs">
                    {folktale.source}
                  </Badge>
                )}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 p-2 h-8 w-8"
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
            >
              <Heart 
                className={`h-4 w-4 transition-colors ${
                  isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'
                }`} 
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {folktale.text.substring(0, 100) + '...'}
          </p>
        </CardContent>
        <CardFooter className="pt-0">
          <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary/10">
            <BookOpen className="h-4 w-4 mr-2" />
            Read Story
          </Button>
        </CardFooter>
      </Link>
    </Card>
  )
}