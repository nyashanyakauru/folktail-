import React from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { BookOpen, Heart, LogOut, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { MusicPlayer } from '@/components/music/MusicPlayer'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export const Header: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-magical bg-clip-text text-transparent">
            FolkTales
          </span>
        </Link>

        <nav className="flex items-center space-x-4">
          <ThemeToggle />
          {user ? (
            <>
              <MusicPlayer />
              <Link to="/favorites">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Favorites</span>
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="default" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}