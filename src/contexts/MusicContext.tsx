import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface MusicTrack {
  id: string
  title: string
  artist?: string
  file_path: string
  user_id: string
  url?: string
}

interface MusicContextType {
  isPlaying: boolean
  currentTrack: MusicTrack | null
  volume: number[]
  userTracks: MusicTrack[]
  loading: boolean
  handlePlay: () => void
  handleTrackSelect: (track: MusicTrack) => void
  setVolume: (volume: number[]) => void
  loadUserMusic: () => Promise<void>
  uploadMusic: (file: File) => Promise<void>
  deleteTrack: (track: MusicTrack) => Promise<void>
}

const MusicContext = createContext<MusicContextType | undefined>(undefined)

export const useMusicContext = () => {
  const context = useContext(MusicContext)
  if (!context) {
    throw new Error('useMusicContext must be used within a MusicProvider')
  }
  return context
}

interface MusicProviderProps {
  children: ReactNode
}

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)
  const [volume, setVolumeState] = useState([0.5])
  const [userTracks, setUserTracks] = useState<MusicTrack[]>([])
  const [loading, setLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.loop = true
      audioRef.current.volume = volume[0]
      
      audioRef.current.onended = () => setIsPlaying(false)
      audioRef.current.onerror = () => {
        console.error('Audio failed to load')
        toast({
          title: "Playback Error",
          description: "Failed to load audio file",
          variant: "destructive"
        })
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [toast])

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0]
    }
  }, [volume])

  // Load user music when user changes
  useEffect(() => {
    if (user) {
      loadUserMusic()
    } else {
      setUserTracks([])
      setCurrentTrack(null)
      setIsPlaying(false)
      // Pause audio when user signs out
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [user])

  const loadUserMusic = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_music')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUserTracks(data || [])
    } catch (error) {
      console.error('Error loading music:', error)
    }
  }

  const handlePlay = async () => {
    if (!currentTrack || !audioRef.current) return
    
    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Audio playback failed:', error)
      toast({
        title: "Playback Error",
        description: "Failed to play audio file",
        variant: "destructive"
      })
    }
  }

  const handleTrackSelect = async (track: MusicTrack) => {
    if (!audioRef.current) return
    
    try {
      // Get the public URL for the audio file
      const { data } = supabase.storage
        .from('music')
        .getPublicUrl(track.file_path)

      const trackWithUrl = {
        ...track,
        url: data.publicUrl
      }

      setCurrentTrack(trackWithUrl)
      setIsPlaying(false)
      
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = data.publicUrl
      
    } catch (error) {
      console.error('Error selecting track:', error)
      toast({
        title: "Error",
        description: "Failed to load music file",
        variant: "destructive"
      })
    }
  }

  const setVolume = (newVolume: number[]) => {
    setVolumeState(newVolume)
  }

  const uploadMusic = async (file: File) => {
    if (!user) return

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid File",
        description: "Please select an audio file",
        variant: "destructive"
      })
      return
    }

    // Validate file size (50MB limit)
    if (file.size > 52428800) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 50MB",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Create file path with user ID folder
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `${user.id}/${fileName}`

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get audio duration (optional)
      const audio = new Audio()
      audio.src = URL.createObjectURL(file)
      
      let duration = 0
      try {
        await new Promise((resolve, reject) => {
          audio.onloadedmetadata = () => {
            duration = Math.floor(audio.duration)
            resolve(null)
          }
          audio.onerror = reject
        })
      } catch (e) {
        console.log('Could not get audio duration')
      }

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('user_music')
        .insert({
          user_id: user.id,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
          file_path: filePath,
          file_size: file.size,
          duration: duration || null
        })

      if (dbError) throw dbError

      toast({
        title: "Upload Successful",
        description: "Your music file has been uploaded"
      })

      await loadUserMusic()

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload music file",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteTrack = async (track: MusicTrack) => {
    if (!user || track.user_id !== user.id) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('music')
        .remove([track.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_music')
        .delete()
        .eq('id', track.id)

      if (dbError) throw dbError

      // Stop playing if this track is currently playing
      if (currentTrack?.id === track.id) {
        setCurrentTrack(null)
        setIsPlaying(false)
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.src = ''
        }
      }

      await loadUserMusic()
      
      toast({
        title: "Deleted",
        description: "Music file deleted successfully"
      })

    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete music file",
        variant: "destructive"
      })
    }
  }

  const value: MusicContextType = {
    isPlaying,
    currentTrack,
    volume,
    userTracks,
    loading,
    handlePlay,
    handleTrackSelect,
    setVolume,
    loadUserMusic,
    uploadMusic,
    deleteTrack
  }

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  )
}