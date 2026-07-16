'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [inputValue, setInputValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  function handleSelect(unit: string) {
    onChange(unit)
    setInputValue(unit)
    setOpen(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setInputValue(val)
    onChange(val)
  }

  const filtered = UNITS.filter((u) =>
    u.toLowerCase().includes(inputValue.toLowerCase())
  )
  const isCustom = inputValue && !UNITS.includes(inputValue as typeof UNITS[number])

  return (
    <div className={cn('relative flex', className)}>
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
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
              value={inputValue}
              onValueChange={(val) => {
                setInputValue(val)
                onChange(val)
              }}
            />
            <CommandList>
              <CommandEmpty>
                {isCustom ? (
                  <CommandItem
                    value={inputValue}
                    onSelect={() => handleSelect(inputValue)}
                  >
                    Use &ldquo;{inputValue}&rdquo;
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
