import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from '../utils'
import { CustomStorage } from '../storage'
import type { GetState } from '../types'
import type { ChatSlice } from './chat.slice'
import { createChatSlice } from './chat.slice'
import { createSidebarTreeSlice } from './sidebar-tree.slice'
import type { SidebarTreeSlice } from './sidebar-tree.slice'
import type { FileTreeSlice } from './file-tree.slice'
import { createFileTreeSlice } from './file-tree.slice'
import type { GeneralSlice } from './general.slice'
import { createGeneralSlice } from './general.slice'

export type GlobalSlice = GeneralSlice & ChatSlice & SidebarTreeSlice & FileTreeSlice
export type GlobalState = GetState<GlobalSlice>

export const useGlobalStore = createStore('GlobalStore')<GlobalSlice, any>(
  persist(
    (...args) => ({
      ...createGeneralSlice(...args),
      ...createChatSlice(...args),
      ...createSidebarTreeSlice(...args),
      ...createFileTreeSlice(...args),
    }),

    {
      name: 'global-slice', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => new CustomStorage({
        storage: localStorage,
        syncToServer: true,
      })),
    },
  ),
)
