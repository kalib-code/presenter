import {
  Song,
  Setlist,
  Presentation,
  Media,
  Template,
  Settings,
  QueryResult,
  DatabaseError,
  DatabaseOperation,
  BaseEntity
} from '@renderer/types/database'

// Utility function to generate unique IDs
export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2)
}

// Base database service class
abstract class BaseService<T extends BaseEntity> {
  protected abstract entityName: string

  // Abstract methods to be implemented by concrete services
  protected abstract invokeCreate(
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<T[]>
  protected abstract invokeUpdate(id: string, data: Partial<T>): Promise<T[]>
  protected abstract invokeDelete(id: string): Promise<T[]>
  protected abstract invokeList(): Promise<T[]>
  protected abstract invokeGet(id: string): Promise<T | null>

  // Common CRUD operations
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<T> {
    try {
      const result = await this.invokeCreate(data)
      return result[result.length - 1] // Return the newly created item
    } catch (error) {
      throw this.handleError('create', error)
    }
  }

  async get(id: string): Promise<T | null> {
    try {
      return await this.invokeGet(id)
    } catch (error) {
      throw this.handleError('read', error)
    }
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const result = await this.invokeUpdate(id, data)
      const updated = result.find((item) => item.id === id)
      if (!updated) {
        throw new Error(`${this.entityName} not found after update`)
      }
      return updated
    } catch (error) {
      throw this.handleError('update', error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.invokeDelete(id)
    } catch (error) {
      throw this.handleError('delete', error)
    }
  }

  async list(): Promise<QueryResult<T>> {
    try {
      const data = await this.invokeList()
      return {
        data,
        total: data.length,
        hasMore: false // For now, implement pagination later if needed
      }
    } catch (error) {
      throw this.handleError('list', error)
    }
  }

  // Search functionality
  async search(query: string): Promise<QueryResult<T>> {
    try {
      const allItems = await this.invokeList()
      const filtered = allItems.filter((item) => this.matchesSearchQuery(item, query))

      return {
        data: filtered,
        total: filtered.length,
        hasMore: false
      }
    } catch (error) {
      throw this.handleError('list', error)
    }
  }

  // Override this method in concrete classes for entity-specific search
  protected matchesSearchQuery(item: T, query: string): boolean {
    const searchTerm = query.toLowerCase()
    return JSON.stringify(item).toLowerCase().includes(searchTerm)
  }

  // Error handling
  protected handleError(operation: string, error: unknown): DatabaseError {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { error: String(error) }

    return {
      code: 'DATABASE_ERROR',
      message: errorMessage || `Failed to ${operation} ${this.entityName}`,
      operation: operation as DatabaseOperation,
      entity: this.entityName,
      details: errorDetails
    }
  }
}

// Song service
export class SongService extends BaseService<Song> {
  protected entityName = 'song'

  protected async invokeCreate(
    data: Omit<Song, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<Song[]> {
    return await window.electron.invoke('create-song', data.name)
  }

  protected async invokeUpdate(id: string, data: Partial<Song>): Promise<Song[]> {
    // TODO: Implement update-song IPC handler
    return await window.electron.invoke('update-song', id, data)
  }

  protected async invokeDelete(id: string): Promise<Song[]> {
    // TODO: Implement delete-song IPC handler
    return await window.electron.invoke('delete-song', id)
  }

  protected async invokeList(): Promise<Song[]> {
    return await window.electron.invoke('list-songs')
  }

  protected async invokeGet(id: string): Promise<Song | null> {
    // TODO: Implement get-song IPC handler
    return await window.electron.invoke('get-song', id)
  }

  protected matchesSearchQuery(song: Song, query: string): boolean {
    const searchTerm = query.toLowerCase()
    return (
      song.name.toLowerCase().includes(searchTerm) ||
      song.artist?.toLowerCase().includes(searchTerm) ||
      song.album?.toLowerCase().includes(searchTerm) ||
      song.lyrics.toLowerCase().includes(searchTerm) ||
      song.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    )
  }

  // Song-specific methods
  async getByArtist(artist: string): Promise<Song[]> {
    const result = await this.list()
    return result.data.filter((song) => song.artist === artist)
  }

  async getByTag(tag: string): Promise<Song[]> {
    const result = await this.list()
    return result.data.filter((song) => song.tags.includes(tag))
  }
}

// Media service
export class MediaService extends BaseService<Media> {
  protected entityName = 'media'

  protected async invokeCreate(
    data: Omit<Media, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<Media[]> {
    // TODO: Implement create-media IPC handler
    return await window.electron.invoke('create-media', data)
  }

  protected async invokeUpdate(id: string, data: Partial<Media>): Promise<Media[]> {
    return await window.electron.invoke('update-media', id, data)
  }

  protected async invokeDelete(id: string): Promise<Media[]> {
    return await window.electron.invoke('delete-media', id)
  }

  protected async invokeList(): Promise<Media[]> {
    return await window.electron.invoke('list-media')
  }

  protected async invokeGet(id: string): Promise<Media | null> {
    return await window.electron.invoke('get-media', id)
  }

  protected matchesSearchQuery(media: Media, query: string): boolean {
    const searchTerm = query.toLowerCase()
    return (
      media.name.toLowerCase().includes(searchTerm) ||
      media.filename.toLowerCase().includes(searchTerm) ||
      media.type.toLowerCase().includes(searchTerm) ||
      media.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    )
  }

  // Media-specific methods
  async getByType(type: Media['type']): Promise<Media[]> {
    const result = await this.list()
    return result.data.filter((media) => media.type === type)
  }

  async getImages(): Promise<Media[]> {
    return this.getByType('image')
  }

  async getVideos(): Promise<Media[]> {
    return this.getByType('video')
  }

  async getAudio(): Promise<Media[]> {
    return this.getByType('audio')
  }
}

// Setlist service
export class SetlistService extends BaseService<Setlist> {
  protected entityName = 'setlist'

  protected async invokeCreate(
    data: Omit<Setlist, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<Setlist[]> {
    return await window.electron.invoke('create-setlist', data)
  }

  protected async invokeUpdate(id: string, data: Partial<Setlist>): Promise<Setlist[]> {
    return await window.electron.invoke('update-setlist', id, data)
  }

  protected async invokeDelete(id: string): Promise<Setlist[]> {
    return await window.electron.invoke('delete-setlist', id)
  }

  protected async invokeList(): Promise<Setlist[]> {
    return await window.electron.invoke('list-setlists')
  }

  protected async invokeGet(id: string): Promise<Setlist | null> {
    return await window.electron.invoke('get-setlist', id)
  }

  protected matchesSearchQuery(setlist: Setlist, query: string): boolean {
    const searchTerm = query.toLowerCase()
    return (
      setlist.name.toLowerCase().includes(searchTerm) ||
      setlist.description?.toLowerCase().includes(searchTerm) ||
      setlist.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    )
  }

  // Setlist-specific methods
  async duplicate(id: string, newName: string): Promise<Setlist> {
    const original = await this.get(id)
    if (!original) {
      throw new Error('Setlist not found')
    }

    const duplicated: Partial<Setlist> = {
      ...original,
      name: newName,
      items: original.items.map((item) => ({
        ...item,
        id: generateId()
      }))
    }

    // Remove the properties that will be auto-generated
    delete duplicated.id
    delete duplicated.createdAt
    delete duplicated.updatedAt
    delete duplicated.version

    return this.create(duplicated as Omit<Setlist, 'id' | 'createdAt' | 'updatedAt' | 'version'>)
  }
}

// Presentation service
export class PresentationService extends BaseService<Presentation> {
  protected entityName = 'presentation'

  protected async invokeCreate(
    data: Omit<Presentation, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<Presentation[]> {
    return await window.electron.invoke('create-presentation', data)
  }

  protected async invokeUpdate(id: string, data: Partial<Presentation>): Promise<Presentation[]> {
    return await window.electron.invoke('update-presentation', id, data)
  }

  protected async invokeDelete(id: string): Promise<Presentation[]> {
    return await window.electron.invoke('delete-presentation', id)
  }

  protected async invokeList(): Promise<Presentation[]> {
    return await window.electron.invoke('list-presentations')
  }

  protected async invokeGet(id: string): Promise<Presentation | null> {
    return await window.electron.invoke('get-presentation', id)
  }

  protected matchesSearchQuery(presentation: Presentation, query: string): boolean {
    const searchTerm = query.toLowerCase()
    return (
      presentation.name.toLowerCase().includes(searchTerm) ||
      presentation.type.toLowerCase().includes(searchTerm) ||
      presentation.slides.some(
        (slide) =>
          slide.title.toLowerCase().includes(searchTerm) ||
          slide.content.toLowerCase().includes(searchTerm)
      )
    )
  }

  // Presentation-specific methods
  async getByType(type: Presentation['type']): Promise<Presentation[]> {
    const result = await this.list()
    return result.data.filter((presentation) => presentation.type === type)
  }
}

// Template service
export class TemplateService extends BaseService<Template> {
  protected entityName = 'template'

  protected async invokeCreate(
    data: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<Template[]> {
    return await window.electron.invoke('create-template', data)
  }

  protected async invokeUpdate(id: string, data: Partial<Template>): Promise<Template[]> {
    return await window.electron.invoke('update-template', id, data)
  }

  protected async invokeDelete(id: string): Promise<Template[]> {
    return await window.electron.invoke('delete-template', id)
  }

  protected async invokeList(): Promise<Template[]> {
    return await window.electron.invoke('list-templates')
  }

  protected async invokeGet(id: string): Promise<Template | null> {
    return await window.electron.invoke('get-template', id)
  }

  protected matchesSearchQuery(template: Template, query: string): boolean {
    const searchTerm = query.toLowerCase()
    return (
      template.name.toLowerCase().includes(searchTerm) ||
      template.category.toLowerCase().includes(searchTerm) ||
      (template.description?.toLowerCase().includes(searchTerm) ?? false)
    )
  }

  // Template-specific methods
  async getByCategory(category: Template['category']): Promise<Template[]> {
    const result = await this.list()
    return result.data.filter((template) => template.category === category)
  }

  async getBuiltIn(): Promise<Template[]> {
    const result = await this.list()
    return result.data.filter((template) => template.isBuiltIn)
  }

  async getCustom(): Promise<Template[]> {
    const result = await this.list()
    return result.data.filter((template) => !template.isBuiltIn)
  }
}

// Settings service
export class SettingsService extends BaseService<Settings> {
  protected entityName = 'settings'

  protected async invokeCreate(
    data: Omit<Settings, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<Settings[]> {
    return await window.electron.invoke('create-setting', data)
  }

  protected async invokeUpdate(id: string, data: Partial<Settings>): Promise<Settings[]> {
    return await window.electron.invoke('update-setting', id, data)
  }

  protected async invokeDelete(id: string): Promise<Settings[]> {
    return await window.electron.invoke('delete-setting', id)
  }

  protected async invokeList(): Promise<Settings[]> {
    return await window.electron.invoke('list-settings')
  }

  protected async invokeGet(id: string): Promise<Settings | null> {
    return await window.electron.invoke('get-setting', id)
  }

  // Settings-specific methods
  async getValue<T = unknown>(key: string, defaultValue?: T): Promise<T | undefined> {
    const setting = await this.get(key)
    return setting ? (setting.value as T) : defaultValue
  }

  async setValue(
    key: string,
    value: unknown,
    category: Settings['category'] = 'app'
  ): Promise<void> {
    const existing = await this.get(key)
    if (existing) {
      await this.update(key, { value })
    } else {
      // For Settings, we use the key as the id since settings are identified by their key
      const settingData = {
        value,
        type: typeof value as Settings['type'],
        category,
        createdBy: 'system'
      }
      // We'll need to handle the id assignment in the main process
      await this.invokeCreate(settingData)
    }
  }

  async getByCategory(category: Settings['category']): Promise<Settings[]> {
    const result = await this.list()
    return result.data.filter((setting) => setting.category === category)
  }
}

// Database manager - singleton pattern
export class DatabaseManager {
  private static instance: DatabaseManager

  public readonly songs: SongService
  public readonly media: MediaService
  public readonly setlists: SetlistService
  public readonly presentations: PresentationService
  public readonly templates: TemplateService
  public readonly settings: SettingsService

  private constructor() {
    this.songs = new SongService()
    this.media = new MediaService()
    this.setlists = new SetlistService()
    this.presentations = new PresentationService()
    this.templates = new TemplateService()
    this.settings = new SettingsService()
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  // Global search across all entities
  async globalSearch(query: string): Promise<{
    songs: Song[]
    media: Media[]
    setlists: Setlist[]
    presentations: Presentation[]
    templates: Template[]
  }> {
    const [songs, media, setlists, presentations, templates] = await Promise.all([
      this.songs.search(query),
      this.media.search(query),
      this.setlists.search(query),
      this.presentations.search(query),
      this.templates.search(query)
    ])

    return {
      songs: songs.data,
      media: media.data,
      setlists: setlists.data,
      presentations: presentations.data,
      templates: templates.data
    }
  }

  // Clear all databases
  async clearDatabase(): Promise<string> {
    return await window.electron.invoke('clear-database')
  }
}

// Export singleton instance
export const db = DatabaseManager.getInstance()
