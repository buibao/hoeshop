"use client";

import { useId, type ComponentProps } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = {
  id?: string;
  label?: string;
  leadingText: string;
  options: { value: string; label: string }[];
  value: string;
  required?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string) => void;
} & Pick<ComponentProps<typeof SelectTrigger>, "aria-invalid" | "aria-describedby" | "aria-label">;

const SelectWithLeadingText = ({ id: providedId, label, leadingText, options, value, required, open, onOpenChange, onValueChange, ...aria }: Props) => {
  const generatedId = useId()
  const id = providedId ?? generatedId

  return (
    <div className='shadcn-space-control w-full max-w-xs space-y-2' data-component="select-08">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Select modal={false} items={options} value={value} required={required} open={open} onOpenChange={onOpenChange} onValueChange={(next) => { if (next !== null) onValueChange(next) }}>
        <SelectTrigger id={id} className='w-full h-11 data-[size=default]:h-11' {...aria}>
          <span className='flex items-center gap-2'>
            {leadingText} <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false} className="data-[state=open]:slide-in-from-bottom-8 data-[state=open]:zoom-in-100 duration-400">
          {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

export default SelectWithLeadingText
