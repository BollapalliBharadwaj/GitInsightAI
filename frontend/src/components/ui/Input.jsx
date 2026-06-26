/**
 * Input — Premium text input with optional prefix/suffix icons,
 * error state, helper text, and character count.
 *
 * Also exports: Textarea, Select
 *
 * Usage:
 *   <Input label="Repository URL" placeholder="https://github.com/..." />
 *   <Input label="Search" leftIcon={<Search size={16} />} error="Invalid URL" />
 *   <Textarea label="Notes" rows={4} />
 *   <Select label="Language" options={[...]} />
 */

import { forwardRef } from 'react'

/* ── Base input class builder ────────────────────────────────────── */
function buildInputClass({ hasError, hasLeftIcon, hasRightIcon, disabled }) {
  return [
    'w-full bg-surface-900 border rounded-xl',
    'text-sm text-white placeholder:text-surface-500',
    'transition-all duration-200 outline-none',
    'h-10 px-4',
    hasLeftIcon  ? 'pl-10' : '',
    hasRightIcon ? 'pr-10' : '',
    hasError
      ? 'border-error/60 focus:border-error focus:ring-2 focus:ring-error/20'
      : 'border-surface-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-surface-600',
  ].join(' ')
}

/* ── Label ───────────────────────────────────────────────────────── */
function Label({ htmlFor, children, required }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium text-surface-300 mb-1.5"
    >
      {children}
      {required && <span className="text-error ml-1">*</span>}
    </label>
  )
}

/* ── Helper / Error text ─────────────────────────────────────────── */
function HelperText({ error, helper, maxLength, currentLength }) {
  return (
    <div className="flex items-center justify-between mt-1.5">
      <p className={`text-xs ${error ? 'text-error' : 'text-surface-500'}`}>
        {error || helper || ''}
      </p>
      {maxLength !== undefined && (
        <p className={`text-xs tabular-nums ${currentLength > maxLength ? 'text-error' : 'text-surface-500'}`}>
          {currentLength}/{maxLength}
        </p>
      )}
    </div>
  )
}

/* ── Input ───────────────────────────────────────────────────────── */
const Input = forwardRef(function Input(
  {
    label,
    id,
    error,
    helper,
    leftIcon,
    rightIcon,
    required = false,
    disabled = false,
    maxLength,
    value,
    onChange,
    className = '',
    wrapperClassName = '',
    ...props
  },
  ref
) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`
  const currentLength = typeof value === 'string' ? value.length : 0

  return (
    <div className={`flex flex-col ${wrapperClassName}`}>
      {label && <Label htmlFor={inputId} required={required}>{label}</Label>}

      <div className="relative">
        {/* Left icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          maxLength={maxLength}
          className={[
            buildInputClass({
              hasError: !!error,
              hasLeftIcon: !!leftIcon,
              hasRightIcon: !!rightIcon,
              disabled,
            }),
            className,
          ].join(' ')}
          {...props}
        />

        {/* Right icon */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
            {rightIcon}
          </div>
        )}
      </div>

      {(error || helper || maxLength !== undefined) && (
        <HelperText error={error} helper={helper} maxLength={maxLength} currentLength={currentLength} />
      )}
    </div>
  )
})

/* ── Textarea ────────────────────────────────────────────────────── */
export const Textarea = forwardRef(function Textarea(
  { label, id, error, helper, required = false, disabled = false, maxLength, value, rows = 4, className = '', wrapperClassName = '', ...props },
  ref
) {
  const inputId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`
  const currentLength = typeof value === 'string' ? value.length : 0

  return (
    <div className={`flex flex-col ${wrapperClassName}`}>
      {label && <Label htmlFor={inputId} required={required}>{label}</Label>}

      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        className={[
          'w-full bg-surface-900 border rounded-xl px-4 py-3',
          'text-sm text-white placeholder:text-surface-500',
          'transition-all duration-200 outline-none resize-none',
          error
            ? 'border-error/60 focus:border-error focus:ring-2 focus:ring-error/20'
            : 'border-surface-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-surface-600',
          className,
        ].join(' ')}
        {...props}
      />

      {(error || helper || maxLength !== undefined) && (
        <HelperText error={error} helper={helper} maxLength={maxLength} currentLength={currentLength} />
      )}
    </div>
  )
})

/* ── Select ──────────────────────────────────────────────────────── */
export const Select = forwardRef(function Select(
  { label, id, error, helper, required = false, disabled = false, options = [], className = '', wrapperClassName = '', ...props },
  ref
) {
  const inputId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={`flex flex-col ${wrapperClassName}`}>
      {label && <Label htmlFor={inputId} required={required}>{label}</Label>}

      <select
        ref={ref}
        id={inputId}
        disabled={disabled}
        className={[
          'w-full h-10 bg-surface-900 border rounded-xl px-4',
          'text-sm text-white',
          'transition-all duration-200 outline-none cursor-pointer',
          'appearance-none',
          error
            ? 'border-error/60 focus:border-error focus:ring-2 focus:ring-error/20'
            : 'border-surface-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-surface-600',
          className,
        ].join(' ')}
        {...props}
      >
        {options.map((opt) => (
          <option
            key={typeof opt === 'string' ? opt : opt.value}
            value={typeof opt === 'string' ? opt : opt.value}
            className="bg-surface-900"
          >
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>

      {(error || helper) && <HelperText error={error} helper={helper} />}
    </div>
  )
})

export default Input
