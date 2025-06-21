import { AppSidebar } from '@/components/app-sidebar'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
// import { SidebarRight } from '@/components/sidebar-right'
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator
// } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
// import { useServiceStore } from '@renderer/store/useServiceStore'

function LayoutContent(): JSX.Element {
  const location = useLocation()
  const { setOpenMobile, setOpen } = useSidebar()

  // Check if we're on the Collection page
  const isCollectionPage = location.pathname === '/collection'

  // Collapse sidebar and disable shortcuts when on Collection page
  useEffect(() => {
    if (isCollectionPage) {
      // Collapse the sidebar
      setOpen(false)
      setOpenMobile(false)

      // Disable Ctrl+B shortcut
      const handleKeyDown = (event: KeyboardEvent): void => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
          event.preventDefault()
          event.stopPropagation()
        }
      }

      document.addEventListener('keydown', handleKeyDown, true)

      return (): void => {
        document.removeEventListener('keydown', handleKeyDown, true)
      }
    }

    // Return undefined for non-collection pages (no cleanup needed)
    return undefined
  }, [isCollectionPage, setOpen, setOpenMobile])

  return (
    <SidebarInset>
      <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
        {/* Hide sidebar trigger on Collection page */}
        {!isCollectionPage && (
          <>
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </>
        )}
        {/* <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">{activeItem?.type || ''}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{activeItem?.title || ''}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb> */}
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Outlet />
      </div>
    </SidebarInset>
  )
}

export default function Layout(): JSX.Element {
  // const { activeItem } = useServiceStore()
  const location = useLocation()
  const isCollectionPage = location.pathname === '/collection'

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '350px'
        } as React.CSSProperties
      }
      defaultOpen={!isCollectionPage}
    >
      <AppSidebar />
      <LayoutContent />
      {/* {(location.pathname === '/' || location.pathname === '/home') && <SidebarRight />} */}
    </SidebarProvider>
  )
}
