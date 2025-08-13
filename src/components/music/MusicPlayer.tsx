import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Music, Play, Pause, Volume2, Trash2, Plus } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { useAuth } from '@/contexts/AuthContext'
import { useMusicContext } from '@/contexts/MusicContext'

export const MusicPlayer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const {
    isPlaying,
    currentTrack,
    volume,
    userTracks,
    loading,
    handlePlay,
    handleTrackSelect,
    setVolume,
    uploadMusic,
    deleteTrack
  } = useMusicContext()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    await uploadMusic(file)
    setIsUploadOpen(false)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteTrack = async (track: any, event: React.MouseEvent) => {
    event.stopPropagation()
    await deleteTrack(track)
  }

  const handleTrackClick = async (track: any) => {
    await handleTrackSelect(track)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
          <Music className="h-4 w-4" />
          <span className="hidden sm:inline">Music</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Reading Music</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Current track and controls */}
        {currentTrack && (
          <>
            <div className="px-2 py-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{currentTrack.title}</p>
                  {currentTrack.artist && (
                    <p className="text-xs text-muted-foreground">{currentTrack.artist}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlay}
                  className="ml-2 h-8 w-8 p-0"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Volume control */}
              <div className="flex items-center space-x-2">
                <Volume2 className="h-3 w-3 text-muted-foreground" />
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={1}
                  step={0.1}
                  className="flex-1"
                />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Upload button */}
        <div className="px-2 py-1">
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Upload Music
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Music File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="music-file">Select Audio File</Label>
                  <Input
                    id="music-file"
                    type="file"
                    accept="audio/*"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported formats: MP3, WAV, OGG, M4A (Max 50MB)
                  </p>
                </div>
                {loading && (
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <DropdownMenuSeparator />

        {/* Track selection */}
        <DropdownMenuLabel>Your Music</DropdownMenuLabel>
        {userTracks.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No music uploaded yet
          </div>
        ) : (
          userTracks.map((track) => (
            <DropdownMenuItem
              key={track.id}
              onClick={() => handleTrackClick(track)}
              className={`cursor-pointer ${currentTrack?.id === track.id ? 'bg-accent' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{track.title}</span>
                  {track.artist && (
                    <span className="text-xs text-muted-foreground">{track.artist}</span>
                  )}
                </div>
                {user?.id === track.user_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteTrack(track, e)}
                    className="h-6 w-6 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}