import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, Save, BookOpen, PenTool } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface StoryNotesProps {
  folktaleId: string
}

export const StoryNotes: React.FC<StoryNotesProps> = ({ folktaleId }) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notes, setNotes] = useState('')
  const [keyTakeaways, setKeyTakeaways] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    if (user && folktaleId) {
      fetchUserData()
    }
  }, [user, folktaleId])

  const fetchUserData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Fetch notes
      const { data: notesData } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('folktale_id', folktaleId)
        .maybeSingle()

      if (notesData) {
        setNotes(notesData.notes || '')
        setKeyTakeaways(notesData.key_takeaways || '')
      }

      // Fetch reading progress
      const { data: progressData } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('folktale_id', folktaleId)
        .maybeSingle()

      if (progressData) {
        setIsCompleted(progressData.completed)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!user) return

    setSaveLoading(true)
    try {
      const { error } = await supabase
        .from('user_notes')
        .upsert({
          user_id: user.id,
          folktale_id: folktaleId,
          notes,
          key_takeaways: keyTakeaways,
        })

      if (error) throw error

      toast({
        title: "Notes saved",
        description: "Your notes and key takeaways have been saved.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaveLoading(false)
    }
  }

  const handleToggleComplete = async () => {
    if (!user) return

    try {
      const newCompleted = !isCompleted
      const { error } = await supabase
        .from('reading_progress')
        .upsert({
          user_id: user.id,
          folktale_id: folktaleId,
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })

      if (error) throw error

      setIsCompleted(newCompleted)
      toast({
        title: newCompleted ? "Story completed!" : "Marked as unread",
        description: newCompleted 
          ? "Great job finishing this story!" 
          : "Story marked as unread.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reading Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Reading Progress</span>
            </CardTitle>
            <Badge variant={isCompleted ? "default" : "secondary"}>
              {isCompleted ? "Completed" : "In Progress"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleToggleComplete}
            className="flex items-center space-x-2"
          >
            {isCompleted ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            <span>
              {isCompleted ? "Mark as Unread" : "Mark as Complete"}
            </span>
          </Button>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PenTool className="h-5 w-5" />
            <span>My Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="notes" className="text-sm font-medium mb-2 block">
              Personal Notes
            </label>
            <Textarea
              id="notes"
              placeholder="Write your thoughts, reflections, or any notes about this story..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
          
          <div>
            <label htmlFor="takeaways" className="text-sm font-medium mb-2 block">
              Key Takeaways
            </label>
            <Textarea
              id="takeaways"
              placeholder="What are the main lessons or insights from this story?"
              value={keyTakeaways}
              onChange={(e) => setKeyTakeaways(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSaveNotes}
            disabled={saveLoading}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveLoading ? "Saving..." : "Save Notes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}