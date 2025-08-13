import React, { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { SearchFilters } from '@/components/folktales/SearchFilters'
import { FolktaleCard } from '@/components/folktales/FolktaleCard'
import { ProgressStats } from '@/components/folktales/ProgressStats'
import { supabase } from '@/integrations/supabase/client'
import { Folktale } from '@/types/folktale'
import { useAuth } from '@/contexts/AuthContext'
import { BookOpen, Sparkles } from 'lucide-react'

const Index = () => {
  const { user } = useAuth()
  const [folktales, setFolktales] = useState<Folktale[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [region, setRegion] = useState('all')
  const [source, setSource] = useState('all')

  useEffect(() => {
    fetchFolktales()
    if (user) fetchFavorites()
  }, [user, searchTerm, region, source]) // single useEffect is enough

  const fetchFolktales = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('folktales')
        .select('*')

      // Apply filters
      if (searchTerm.trim()) {
        query = query.ilike('title', `%${searchTerm}%`)
      }

      if (region !== 'all') {
        query = query.eq('nation', region)
      }

      if (source !== 'all') {
        query = query.eq('source', source)
      }

      const { data, error } = await query

      if (error) throw error
      setFolktales(data || [])
    } catch (error) {
      console.error('Error fetching folktales:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('folktale_id')
        .eq('user_id', user.id)

      if (error) throw error
      setFavorites(new Set(data?.map(fav => fav.folktale_id) || []))
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }


  const handleFavoriteChange = () => {
    fetchFavorites()
  }

  const filteredTales = folktales

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-magical bg-clip-text text-transparent">
              FolkTales
            </h1>
            <Sparkles className="h-8 w-8 text-magical" />
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover timeless stories from around the world. Each tale carries wisdom, 
            wonder, and the power to inspire across generations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <SearchFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              region={region}
              onRegionChange={setRegion}
              source={source}
              onSourceChange={setSource}
            />
            
            {user && <ProgressStats />}
          </div>

          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTales.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                  No stories found
                </h2>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria to discover more tales.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold">
                    {filteredTales.length} {filteredTales.length === 1 ? 'Story' : 'Stories'} Found
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredTales.map((folktale) => (
                    <FolktaleCard
                      key={folktale.id}
                      folktale={folktale}
                      isFavorited={favorites.has(folktale.id)}
                      onFavoriteChange={handleFavoriteChange}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
};

export default Index;
