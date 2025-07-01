import type { SetlistItem } from '@renderer/types/database'

export interface SetlistTemplate {
  id: string
  name: string
  description: string
  category: 'service' | 'event' | 'custom'
  items: Omit<SetlistItem, 'id' | 'order' | 'referenceId'>[]
  tags: string[]
  estimatedDuration: number
  variables?: Array<{
    key: string
    label: string
    defaultValue: string
    type: 'text' | 'number' | 'date'
  }>
}

export const defaultTemplates: SetlistTemplate[] = [
  {
    id: 'sunday-morning',
    name: 'Sunday Morning Service',
    description: 'Traditional Sunday morning worship service template',
    category: 'service',
    tags: ['worship', 'sunday', 'traditional'],
    estimatedDuration: 4500, // 75 minutes
    variables: [
      { key: 'service_date', label: 'Service Date', defaultValue: 'Sunday', type: 'text' },
      { key: 'pastor_name', label: 'Pastor Name', defaultValue: 'Pastor', type: 'text' }
    ],
    items: [
      {
        type: 'announcement',
        title: 'Welcome & Announcements',
        duration: 300, // 5 minutes
        notes: 'Welcome guests, share important announcements',
        isActive: true
      },
      {
        type: 'song',
        title: 'Opening Worship Song 1',
        duration: 300,
        notes: 'Upbeat worship song to start the service',
        isActive: true
      },
      {
        type: 'song',
        title: 'Opening Worship Song 2',
        duration: 300,
        notes: 'Continue worship atmosphere',
        isActive: true
      },
      {
        type: 'song',
        title: 'Opening Worship Song 3',
        duration: 300,
        notes: 'Slow down tempo, prepare hearts for prayer',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Prayer Time',
        duration: 600, // 10 minutes
        notes: 'Corporate prayer, prayer requests',
        isActive: true
      },
      {
        type: 'song',
        title: 'Offering Song',
        duration: 240,
        notes: 'Song during offering collection',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Offering',
        duration: 300,
        notes: 'Offering collection and prayer',
        isActive: true
      },
      {
        type: 'presentation',
        title: 'Sermon: {sermon_title}',
        duration: 1800, // 30 minutes
        notes: 'Main sermon by {pastor_name}',
        isActive: true
      },
      {
        type: 'song',
        title: 'Response Song',
        duration: 300,
        notes: 'Invitation/response song after sermon',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Closing Prayer & Benediction',
        duration: 300,
        notes: 'Final prayer and blessing',
        isActive: true
      }
    ]
  },
  {
    id: 'evening-service',
    name: 'Evening Service',
    description: 'Intimate evening worship service template',
    category: 'service',
    tags: ['worship', 'evening', 'intimate'],
    estimatedDuration: 3600, // 60 minutes
    variables: [
      { key: 'service_date', label: 'Service Date', defaultValue: 'Sunday Evening', type: 'text' }
    ],
    items: [
      {
        type: 'announcement',
        title: 'Welcome',
        duration: 180,
        notes: 'Brief welcome and announcements',
        isActive: true
      },
      {
        type: 'song',
        title: 'Worship Song 1',
        duration: 300,
        notes: 'Opening worship',
        isActive: true
      },
      {
        type: 'song',
        title: 'Worship Song 2',
        duration: 300,
        notes: 'Deeper worship',
        isActive: true
      },
      {
        type: 'song',
        title: 'Worship Song 3',
        duration: 300,
        notes: 'Intimate worship time',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Prayer & Testimony Time',
        duration: 900, // 15 minutes
        notes: 'Open sharing and prayer requests',
        isActive: true
      },
      {
        type: 'presentation',
        title: 'Evening Message',
        duration: 1200, // 20 minutes
        notes: 'Shorter, more intimate teaching',
        isActive: true
      },
      {
        type: 'song',
        title: 'Closing Song',
        duration: 240,
        notes: 'Gentle closing song',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Closing Prayer',
        duration: 180,
        notes: 'Final prayer and fellowship invitation',
        isActive: true
      }
    ]
  },
  {
    id: 'youth-service',
    name: 'Youth Service',
    description: 'Energetic youth-focused service template',
    category: 'service',
    tags: ['youth', 'energetic', 'modern'],
    estimatedDuration: 3900, // 65 minutes
    variables: [
      { key: 'youth_pastor', label: 'Youth Pastor', defaultValue: 'Youth Pastor', type: 'text' }
    ],
    items: [
      {
        type: 'song',
        title: 'High Energy Opening Song',
        duration: 240,
        notes: 'Get everyone excited and engaged',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Welcome & Game',
        duration: 600, // 10 minutes
        notes: 'Interactive welcome and fun game',
        isActive: true
      },
      {
        type: 'song',
        title: 'Worship Set Song 1',
        duration: 300,
        notes: 'Modern worship song',
        isActive: true
      },
      {
        type: 'song',
        title: 'Worship Set Song 2',
        duration: 300,
        notes: 'Continue worship momentum',
        isActive: true
      },
      {
        type: 'song',
        title: 'Worship Set Song 3',
        duration: 300,
        notes: 'Slow down for reflection',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Announcements & Offering',
        duration: 300,
        notes: 'Youth-specific announcements',
        isActive: true
      },
      {
        type: 'presentation',
        title: 'Youth Message',
        duration: 1200, // 20 minutes
        notes: 'Relevant message for youth by {youth_pastor}',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Small Group Time',
        duration: 480, // 8 minutes
        notes: 'Break into discussion groups',
        isActive: true
      },
      {
        type: 'song',
        title: 'Closing Song',
        duration: 180,
        notes: 'Send-off song with energy',
        isActive: true
      }
    ]
  },
  {
    id: 'christmas-service',
    name: 'Christmas Service',
    description: 'Special Christmas celebration service',
    category: 'event',
    tags: ['christmas', 'holiday', 'celebration'],
    estimatedDuration: 5400, // 90 minutes
    variables: [{ key: 'christmas_year', label: 'Year', defaultValue: '2024', type: 'text' }],
    items: [
      {
        type: 'song',
        title: 'Christmas Carol Medley',
        duration: 480, // 8 minutes
        notes: 'Traditional Christmas carols',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Christmas Welcome',
        duration: 300,
        notes: 'Special Christmas greeting and announcements',
        isActive: true
      },
      {
        type: 'song',
        title: 'O Come, All Ye Faithful',
        duration: 300,
        notes: 'Congregation singing',
        isActive: true
      },
      {
        type: 'presentation',
        title: 'Christmas Story Reading',
        duration: 600, // 10 minutes
        notes: 'Scripture reading from Luke 2',
        isActive: true
      },
      {
        type: 'song',
        title: 'Mary, Did You Know?',
        duration: 300,
        notes: 'Special music or solo',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Christmas Drama/Skit',
        duration: 900, // 15 minutes
        notes: 'Nativity play or Christmas drama',
        isActive: true
      },
      {
        type: 'song',
        title: 'Silent Night',
        duration: 240,
        notes: 'Candlelight service song',
        isActive: true
      },
      {
        type: 'presentation',
        title: 'Christmas Message',
        duration: 1800, // 30 minutes
        notes: 'Special Christmas sermon',
        isActive: true
      },
      {
        type: 'song',
        title: 'Joy to the World',
        duration: 300,
        notes: 'Celebration finale',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Christmas Fellowship',
        duration: 480,
        notes: 'Invitation to Christmas fellowship/meal',
        isActive: true
      }
    ]
  },
  {
    id: 'easter-service',
    name: 'Easter Celebration',
    description: 'Resurrection Sunday celebration service',
    category: 'event',
    tags: ['easter', 'resurrection', 'celebration'],
    estimatedDuration: 5100, // 85 minutes
    items: [
      {
        type: 'song',
        title: 'Christ the Lord is Risen Today',
        duration: 300,
        notes: 'Triumphant Easter opening',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Easter Greeting',
        duration: 240,
        notes: 'He is Risen! He is Risen Indeed!',
        isActive: true
      },
      {
        type: 'song',
        title: 'In Christ Alone',
        duration: 300,
        notes: 'Worship about the cross and resurrection',
        isActive: true
      },
      {
        type: 'song',
        title: 'Amazing Grace',
        duration: 300,
        notes: 'Grace through the resurrection',
        isActive: true
      },
      {
        type: 'presentation',
        title: 'Easter Story',
        duration: 600, // 10 minutes
        notes: 'Reading from the Gospels',
        isActive: true
      },
      {
        type: 'song',
        title: 'Because He Lives',
        duration: 300,
        notes: 'Hope in the resurrection',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Baptism Service',
        duration: 1200, // 20 minutes
        notes: 'Easter baptisms',
        isActive: true
      },
      {
        type: 'presentation',
        title: 'Easter Message: The Power of Resurrection',
        duration: 1800, // 30 minutes
        notes: 'Resurrection-focused sermon',
        isActive: true
      },
      {
        type: 'song',
        title: 'How Great Thou Art',
        duration: 300,
        notes: 'Response to the resurrection message',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Easter Communion',
        duration: 480, // 8 minutes
        notes: 'Special Easter communion service',
        isActive: true
      }
    ]
  },
  {
    id: 'simple-service',
    name: 'Simple Service',
    description: 'Basic worship service template',
    category: 'service',
    tags: ['simple', 'basic', 'minimal'],
    estimatedDuration: 3600, // 60 minutes
    items: [
      {
        type: 'announcement',
        title: 'Welcome',
        duration: 300,
        notes: 'Brief welcome',
        isActive: true
      },
      {
        type: 'song',
        title: 'Opening Song',
        duration: 300,
        notes: 'Start with worship',
        isActive: true
      },
      {
        type: 'song',
        title: 'Worship Song',
        duration: 300,
        notes: 'Continue worship',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Prayer',
        duration: 300,
        notes: 'Corporate prayer time',
        isActive: true
      },
      {
        type: 'presentation',
        title: 'Message',
        duration: 1800, // 30 minutes
        notes: 'Main teaching',
        isActive: true
      },
      {
        type: 'song',
        title: 'Closing Song',
        duration: 300,
        notes: 'End with worship',
        isActive: true
      },
      {
        type: 'announcement',
        title: 'Benediction',
        duration: 300,
        notes: 'Closing prayer',
        isActive: true
      }
    ]
  }
]

/**
 * Apply template variables to a template
 */
export function applyTemplateVariables(
  template: SetlistTemplate,
  variables: Record<string, string>
): SetlistTemplate {
  const processString = (str: string): string => {
    let result = str
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      result = result.replace(regex, value)
    })
    return result
  }

  return {
    ...template,
    name: processString(template.name),
    description: processString(template.description),
    items: template.items.map((item) => ({
      ...item,
      title: processString(item.title),
      notes: item.notes ? processString(item.notes) : item.notes
    }))
  }
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: SetlistTemplate['category']): SetlistTemplate[] {
  return defaultTemplates.filter((template) => template.category === category)
}

/**
 * Search templates by name or tags
 */
export function searchTemplates(query: string): SetlistTemplate[] {
  const lowerQuery = query.toLowerCase()
  return defaultTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}
