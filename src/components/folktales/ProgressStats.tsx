import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, CheckCircle, Target, TrendingUp } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

interface ProgressStats {
  totalStories: number
  completedStories: number
  completionRate: number
  recentlyCompleted: any[]
}

export const ProgressStats: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<ProgressStats>({
    totalStories: 0,
    completedStories: 0,
    completionRate: 0,
    recentlyCompleted: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchProgressStats()
    }
  }, [user])

  const fetchProgressStats = async () => {
    if (!user) return

    try {
      // Get total number of stories
      const { count: totalStories } = await supabase
        .from('folktales')
        .select('*', { count: 'exact', head: true })

      // Get completed stories count
      const { count: completedStories } = await supabase
        .from('reading_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true)

      // Get recently completed stories
      const { data: recentlyCompleted } = await supabase
        .from('reading_progress')
        .select(`
          completed_at,
          folktales (
            id,
            title,
            nation
          )
        `)
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(5)

      const completionRate = totalStories ? Math.round((completedStories || 0) / totalStories * 100) : 0

      setStats({
        totalStories: totalStories || 0,
        completedStories: completedStories || 0,
        completionRate,
        recentlyCompleted: recentlyCompleted || []
      })
    } catch (error) {
      console.error('Error fetching progress stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reading Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Reading Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stats.totalStories}</div>
            <div className="text-sm text-muted-foreground">Total Stories</div>
          </div>
          
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.completedStories}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.completionRate}%</div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{stats.completedStories} / {stats.totalStories}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        {/* Recently Completed */}
        {stats.recentlyCompleted.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Recently Completed</h4>
            <div className="space-y-2">
              {stats.recentlyCompleted.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.folktales?.title}</div>
                    {item.folktales?.nation && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {item.folktales.nation}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.completed_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}