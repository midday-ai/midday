'use client'

import { Input } from '@midday/ui/input'
import { cn } from '@midday/ui/cn'
import type { RefObject } from 'react'
import { MdIosShare } from 'react-icons/md'

interface InputBarProps {
  isLightMode: boolean
  inputRef: RefObject<HTMLInputElement>
  searchQuery: string
  setSearchQuery: (query: string) => void
  placeholder?: string
}

export function InputBar({
  isLightMode,
  inputRef,
  searchQuery,
  setSearchQuery,
  placeholder = 'Ask anything',
}: InputBarProps) {
  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full bg-background border-border text-foreground placeholder:text-muted-foreground',
          'text-sm px-3 py-2 pr-8',
        )}
      />
      <MdIosShare className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-base" size={16} />
    </div>
  )
}

