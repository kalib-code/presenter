import React, { useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface DateTimePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  date,
  onDateChange,
  placeholder = "Select date and time",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(
    date ? format(date, 'yyyy-MM-dd') : ''
  )
  const [selectedTime, setSelectedTime] = useState<string>(
    date ? format(date, 'HH:mm') : ''
  )

  const handleDateChange = (dateStr: string) => {
    setSelectedDate(dateStr)
    updateDateTime(dateStr, selectedTime)
  }

  const handleTimeChange = (timeStr: string) => {
    setSelectedTime(timeStr)
    updateDateTime(selectedDate, timeStr)
  }

  const updateDateTime = (dateStr: string, timeStr: string) => {
    if (dateStr && timeStr) {
      const newDate = new Date(`${dateStr}T${timeStr}:00`)
      onDateChange?.(newDate)
    } else if (dateStr) {
      const newDate = new Date(`${dateStr}T12:00:00`)
      onDateChange?.(newDate)
    } else {
      onDateChange?.(undefined)
    }
  }

  const clearDateTime = () => {
    setSelectedDate('')
    setSelectedTime('')
    onDateChange?.(undefined)
  }

  const formatDisplayValue = () => {
    if (!date) return placeholder
    
    try {
      return format(date, 'MMM dd, yyyy \'at\' h:mm a')
    } catch {
      return placeholder
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${className}`}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {formatDisplayValue()}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Select Date & Time</span>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Date
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Time
              </label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex justify-between pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={clearDateTime}
            >
              Clear
            </Button>
            
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={!selectedDate}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}