/**
 * UI Components barrel export.
 * Import any component from '@/components/ui' in one line.
 *
 * Example:
 *   import { Button, Badge, Card, Input } from '../components/ui'
 */

export { default as Button, IconButton } from './Button'
export { default as Badge } from './Badge'
export { default as Card, StatCard } from './Card'
export { default as Input, Textarea, Select } from './Input'
export { default as Modal } from './Modal'
export { default as Spinner, PageLoader } from './Spinner'
export {
  default as Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonTable,
  SkeletonStatRow,
  SkeletonNavbar,
} from './Skeleton'
export { default as Table, TablePagination } from './Table'
export { default as GlassPanel } from './GlassPanel'
export { ToastProvider, useToast } from './Toast'
