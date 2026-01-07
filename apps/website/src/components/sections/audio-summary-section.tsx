'use client'

import { useEffect, useRef, useState } from 'react'
import { MaterialIcon } from '../homepage/icon-mapping'
import { LiveWaveform } from '../ui/live-waveform'

interface AudioSummarySectionProps {
  audioUrl?: string
}

export function AudioSummarySection({ audioUrl }: AudioSummarySectionProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    
    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', () => setIsPlaying(false))

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', () => setIsPlaying(false))
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    audio.currentTime = percent * duration
  }

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
            Understand your week, hands-free
          </h2>
          <p className="hidden sm:block font-sans text-base text-muted-foreground leading-normal max-w-2xl mx-auto">
            A quick audio overview of how your business performed last week, designed for busy moments.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-secondary border border-border p-4 relative">
            <audio ref={audioRef} src={audioUrl} preload="metadata" />
            
            {/* Waveform Canvas */}
            <div className="mb-4 h-[64px] w-full cursor-pointer" onClick={handleSeek}>
              <LiveWaveform
                active={isPlaying}
                audioElement={audioRef.current}
                barWidth={3}
                barGap={1}
                barRadius={0}
                height={64}
                sensitivity={1.2}
                smoothingTimeConstant={0.8}
                fftSize={256}
                updateRate={30}
                mode="static"
                fadeEdges={true}
                fadeWidth={24}
                barColor="hsl(var(--primary))"
              />
            </div>

            {/* Play Controls */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center bg-background border border-border hover:border-muted-foreground transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                <MaterialIcon
                  name={isPlaying ? 'pause' : 'play_arrow'}
                  className="text-foreground"
                  size={20}
                />
              </button>

              <div className="flex-1 flex items-center gap-3">
                <span className="font-sans text-xs text-muted-foreground min-w-[40px]">
                  {formatTime(currentTime)}
                </span>
                
                {/* Progress Bar */}
                <div
                  className="flex-1 h-1 bg-muted cursor-pointer relative group"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%', marginLeft: '-6px' }}
                  />
                </div>

                <span className="font-sans text-xs text-muted-foreground min-w-[40px]">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

