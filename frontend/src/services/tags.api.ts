import { get, post, put, del } from './api'
import type { Tag } from '@/types'

export const tagsApi = {
  list: () =>
    get<Tag[]>('/tags'),

  create: (data: Pick<Tag, 'name' | 'color'> & { icon?: string }) =>
    post<Tag>('/tags', data),

  update: (id: string, data: Partial<Tag>) =>
    put<Tag>(`/tags/${id}`, data),

  delete: (id: string) =>
    del(`/tags/${id}`),
}
