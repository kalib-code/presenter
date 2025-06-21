import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { Presentation, ListMusic, FolderOpen, Settings } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between px-2">
          <span className="text-lg font-semibold">Presenter</span>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Presentations">
                <Presentation />
                <span>Presentations</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Setlist">
                <ListMusic />
                <span>Setlist</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Collection">
                <FolderOpen />
                <span>Collection</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
