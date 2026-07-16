'use client'

import { useState, useRef } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { UNITS } from '@/lib/constants'

interface UnitComboboxProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function UnitCombobox({ value, onChange, className }: UnitComboboxProps) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSelect(unit: string) {
    onChange(unit)
    setOpen(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const filtered = UNITS.filter((u) =>
    u.toLowerCase().includes(value.toLowerCase())
  )
  const isCustom = value && !UNITS.includes(value as typeof UNITS[number])

  return (
    <div className={cn('relative flex', className)}>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs rounded-r-none"
        placeholder="Unit"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-7 rounded-l-none border-l-0 shrink-0"
            onClick={() => setOpen(!open)}
          >
            <ChevronsUpDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search..."
              value={value}
              onValueChange={onChange}
            />
            <CommandList>
              <CommandEmpty>
                {isCustom ? (
                  <CommandItem
                    value={value}
                    onSelect={() => handleSelect(value)}
                  >
                    Use &ldquo;{value}&rdquo;
                  </CommandItem>
                ) : (
                  'No units found'
                )}
              </CommandEmpty>
              <CommandGroup>
                {filtered.map((unit) => (
                  <CommandItem
                    key={unit}
                    value={unit}
                    onSelect={() => handleSelect(unit)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3 w-3',
                        value === unit ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {unit}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
