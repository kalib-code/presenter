import React from 'react'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { Slider } from '@renderer/components/ui/slider'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'

interface SettingCardProps {
  title: string
  description: string
  children: React.ReactNode
}

export function SettingCard({ title, description, children }: SettingCardProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  )
}

interface SettingToggleProps {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function SettingToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false
}: SettingToggleProps): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}

interface SettingSliderProps {
  id: string
  label: string
  value: number
  onValueChange: (value: number[]) => void
  min: number
  max: number
  step: number
  formatValue?: (value: number) => string
  disabled?: boolean
}

export function SettingSlider({
  id,
  label,
  value,
  onValueChange,
  min,
  max,
  step,
  formatValue = (val) => val.toString(),
  disabled = false
}: SettingSliderProps): JSX.Element {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}: {formatValue(value)}
      </Label>
      <Slider
        id={id}
        value={[value]}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        className="w-64"
        disabled={disabled}
      />
    </div>
  )
}

interface SettingSelectProps {
  id: string
  label: string
  description?: string
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  disabled?: boolean
}

export function SettingSelect({
  id,
  label,
  description,
  value,
  onValueChange,
  options,
  disabled = false
}: SettingSelectProps): JSX.Element {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <div className="text-sm text-muted-foreground">{description}</div>}
    </div>
  )
}

interface SettingInputProps {
  id: string
  label: string
  description?: string
  value: string | number
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  type?: 'text' | 'number' | 'email' | 'password'
  placeholder?: string
  disabled?: boolean
  min?: number
  max?: number
  className?: string
}

export function SettingInput({
  id,
  label,
  description,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  min,
  max,
  className = 'w-48'
}: SettingInputProps): JSX.Element {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        className={className}
      />
      {description && <div className="text-sm text-muted-foreground">{description}</div>}
    </div>
  )
}

interface SettingPathProps {
  id: string
  label: string
  description?: string
  value: string
  onPathSelect: () => void
  placeholder?: string
  disabled?: boolean
}

export function SettingPath({
  id,
  label,
  description,
  value,
  onPathSelect,
  placeholder = 'Default location',
  disabled = false
}: SettingPathProps): JSX.Element {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center space-x-2">
        <Input
          id={id}
          value={value || placeholder}
          readOnly
          className="flex-1"
          disabled={disabled}
        />
        <Button onClick={onPathSelect} variant="outline" disabled={disabled}>
          Browse
        </Button>
      </div>
      {description && <div className="text-sm text-muted-foreground">{description}</div>}
    </div>
  )
}