import * as React from 'react'
import {
  Command,
  Presentation,
  Settings,
  ListMusic,
  FolderOpen,
  Music,
  FileImage,
  Video,
  Headphones,
  FileText,
  Monitor
} from 'lucide-react'
import { NavUser } from '@renderer/components/nav-user'
import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@renderer/components/ui/sidebar'

// Collection submenu items
const collectionItems = [
  {
    title: 'Songs',
    icon: Music,
    key: 'songs'
  },
  {
    title: 'Slides',
    icon: FileText,
    key: 'slides'
  },
  {
    title: 'Images',
    icon: FileImage,
    key: 'images'
  },
  {
    title: 'Video',
    icon: Video,
    key: 'video'
  },
  {
    title: 'Audio',
    icon: Headphones,
    key: 'audio'
  }
]

// This is sample data
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg'
  },
  navMain: [
    {
      title: 'Home',
      url: '/',
      icon: Presentation,
      isActive: true
    },
    {
      title: 'Setlist',
      url: '/setlist',
      icon: ListMusic,
      isActive: false
    },
    {
      title: 'Collection',
      url: '/collection',
      icon: FolderOpen,
      isActive: false
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings,
      isActive: false
    }
  ],
  mails: []
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>): JSX.Element {
  const location = useLocation()
  const [selectedCollectionItem, setSelectedCollectionItem] = React.useState(collectionItems[0])
  const { setOpen } = useSidebar()

  // Get current active item based on location
  const activeItem =
    data.navMain.find((item) => {
      if (item.url === '/' && location.pathname === '/') return true
      if (item.url !== '/' && location.pathname.startsWith(item.url)) return true
      return false
    }) || data.navMain[0]

  // Check if Collection is active
  const isCollectionActive = activeItem?.title === 'Collection'

  // Hide second sidebar on Collection page since it has its own tab navigation
  // Also hide on Home page since it has its own presenter layout
  const shouldHideSecondSidebar =
    location.pathname === '/collection' ||
    location.pathname === '/' ||
    location.pathname === '/home'

  // Show all menu items - no need to hide any
  const filteredNavMain = data.navMain

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar collapsible="none" className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <Link to="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Presenter</span>
                    <span className="truncate text-xs">App</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {filteredNavMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false
                      }}
                      asChild
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <Link
                        to={item.url}
                        onClick={() => {
                          if (item.title === 'Collection') {
                            // Reset to first collection item when Collection is selected
                            setSelectedCollectionItem(collectionItems[0])
                          }
                          setOpen(true)
                        }}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      {/* Hide this sidebar when on Collection page since it has its own tabs */}
      {!shouldHideSecondSidebar && (
        <Sidebar collapsible="none" className="hidden flex-1 md:flex">
          <SidebarHeader className="gap-3.5 border-b p-4">
            <div className="flex w-full items-center justify-between">
              <div className="text-base font-medium text-foreground">{activeItem?.title}</div>
            </div>
            {isCollectionActive && <SidebarInput placeholder="Search collection..." />}
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-0">
              <SidebarGroupContent>
                {isCollectionActive ? (
                  // Show collection submenu
                  <div className="flex flex-col gap-1 p-2">
                    {collectionItems.map((item) => (
                      <SidebarMenuButton
                        key={item.key}
                        onClick={() => setSelectedCollectionItem(item)}
                        isActive={selectedCollectionItem.key === item.key}
                        className="justify-start gap-2 px-3 py-2"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    ))}
                  </div>
                ) : (
                  // Show placeholder for other sections
                  <div className="p-4 text-sm text-muted-foreground">
                    {activeItem?.title === 'Home' && 'Welcome to Presenter'}
                    {activeItem?.title === 'Setlist' && 'Setlist items will appear here'}
                    {activeItem?.title === 'Settings' && 'Settings options will appear here'}
                  </div>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )}
    </Sidebar>
  )
}
