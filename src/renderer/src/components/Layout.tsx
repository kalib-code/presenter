import React from 'react'
import { AppSidebar } from './appSideBar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}

export default Layout
