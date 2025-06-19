import { cn } from '@renderer/lib/utils'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-primary/10', className)} {...props} />
}

export { Skeleton }
