import { clsx } from 'clsx'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  style?: React.CSSProperties
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300',
  primary:  'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
  success:  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  warning:  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  danger:   'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
}

export function Badge({ children, variant = 'default', className, style }: BadgeProps) {
  return (
    <span
      className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}
      style={style}
    >
      {children}
    </span>
  )
}
