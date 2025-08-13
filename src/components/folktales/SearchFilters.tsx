import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Search, Filter } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface SearchFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  region: string
  onRegionChange: (value: string) => void
  source: string
  onSourceChange: (value: string) => void
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  onSearchChange,
  region,
  onRegionChange,
  source,
  onSourceChange,
}) => {
  const [regions, setRegions] = useState<string[]>([])
  const [sources, setSources] = useState<string[]>([])

  useEffect(() => {
    fetchRegions()
    fetchSources()
  }, [])

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('folktales')
        .select('nation')
        .not('nation', 'is', null)
        .order('nation')

      if (error) throw error
      
      const uniqueRegions = [...new Set(data?.map(item => item.nation).filter(Boolean))]
      setRegions(uniqueRegions)
    } catch (error) {
      console.error('Error fetching regions:', error)
    }
  }

  const fetchSources = async () => {
    try {
      const { data, error } = await supabase
        .from('folktales')
        .select('source')
        .not('source', 'is', null)
        .order('source')

      if (error) throw error
      
      const uniqueSources = [...new Set(data?.map(item => item.source).filter(Boolean))]
      setSources(uniqueSources)
    } catch (error) {
      console.error('Error fetching sources:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Search is triggered automatically by the onSearchChange in parent
    }
  }
  return (
    <div className="space-y-4 p-6 bg-card rounded-lg border border-border/50">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Discover Stories</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by title, content, or theme... (Press Enter to search)"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select value={region} onValueChange={onRegionChange}>
              <SelectTrigger>
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                {regions.map((regionName) => (
                  <SelectItem key={regionName} value={regionName}>
                    {regionName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select value={source} onValueChange={onSourceChange}>
              <SelectTrigger>
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {sources.map((sourceName) => (
                  <SelectItem key={sourceName} value={sourceName}>
                    {sourceName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}