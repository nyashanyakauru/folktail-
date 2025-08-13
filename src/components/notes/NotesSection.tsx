import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, PenTool, BookOpen, Save } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface NotesSectionProps {
  folktaleId: string
  folktaleTitle: string
}

interface UserNote {
  id: string
  notes: string | null
  key_takeaways: string | null
  updated_at: string
}

interface ReadingProgress {
  id: string
  completed: boolean
  completed_at: string | null
}

export const NotesSection: React.FC<NotesSectionProps> = ({ folktaleId, folktaleTitle }) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notes, setNotes] = useState('')
  const [keyTakeaways, setKeyTakeaways] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user && folktaleId) {
      fetchUserData()
    }
  }, [user, folktaleId])

  const fetchUserData = async () => {
    try {
      // Fetch user notes
      const { data: notesData } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', user!.id)
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
        .eq('user_id', user!.id)
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

  const saveNotes = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_notes')
        .upsert({
          user_id: user.id,
          folktale_id: folktaleId,
          notes: notes.trim() || null,
          key_takeaways: keyTakeaways.trim() || null,
        })

      if (error) throw error

      toast({
        title: "Notes saved",
        description: "Your notes have been saved successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error saving notes",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleCompletion = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('reading_progress')
        .upsert({
          user_id: user.id,
          folktale_id: folktaleId,
          completed: !isCompleted,
          completed_at: !isCompleted ? new Date().toISOString() : null,
        })

      if (error) throw error

      setIsCompleted(!isCompleted)
      
      toast({
        title: isCompleted ? "Marked as unread" : "Story completed!",
        description: isCompleted 
          ? "Story marked as unread." 
          : "You've completed this story. Great job!",
      })
    } catch (error: any) {
      toast({
        title: "Error updating progress",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reading Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Reading Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isCompleted ? (
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge variant="outline">
                  In Progress
                </Badge>
              )}
            </div>
            <Button
              variant={isCompleted ? "outline" : "default"}
              onClick={toggleCompletion}
              className="flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isCompleted ? "Mark as Unread" : "Mark as Complete"}</span>
            </Button>
          </div>
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
              placeholder="Write your thoughts about this story..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24"
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
              className="min-h-24"
            />
          </div>

          <Button 
            onClick={saveNotes} 
            disabled={saving}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Notes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}