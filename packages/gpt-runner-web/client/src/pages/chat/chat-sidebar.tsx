import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { travelTree } from '@nicepkg/gpt-runner-shared/common'
import type { SidebarProps } from '../../components/sidebar'
import { Sidebar } from '../../components/sidebar'
import { fetchGptFilesTree } from '../../networks/gpt-files'
import type { TreeItemProps } from '../../components/tree-item'

export interface ChatSidebarProps {
  rootPath: string
}

export const ChatSidebar: FC<ChatSidebarProps> = (props) => {
  const { rootPath } = props

  const { data: fetchGptFilesTreeRes } = useQuery({
    queryKey: ['chat-sidebar'],
    enabled: Boolean(rootPath),
    queryFn: () => fetchGptFilesTree({
      rootPath,
    }),
  })

  const [treeItems, setTreeItems] = useState<TreeItemProps[]>([])

  useEffect(() => {
    if (!fetchGptFilesTreeRes?.data?.filesInfoTree)
      return

    const _treeItems = travelTree(fetchGptFilesTreeRes.data.filesInfoTree, (item) => {
      return {
        id: item.id,
        name: item.name,
        path: item.path,
        isLeaf: false,
      }
    }) as TreeItemProps[]

    setTreeItems(_treeItems)
  }, [fetchGptFilesTreeRes])

  const sidebar: SidebarProps = {
    topToolbar: {
      title: 'GPT Runner',
      actions: [],
    },
    onCreateChat: () => { },
    onDeleteChat: () => { },
    onRenameChat: () => { },
    tree: {
      items: treeItems,
      // items: [
      //   {
      //     id: '1',
      //     name: 'aaa',
      //     path: 'aaa',
      //     isLeaf: false,
      //     children: [
      //       {
      //         id: '1-1',
      //         name: 'bbb',
      //         path: 'aaa/bbb',
      //         isLeaf: false,
      //         children: [
      //           {
      //             id: '1-1-1',
      //             name: 'ccc',
      //             path: 'aaa/bbb/ccc',
      //             isLeaf: true,
      //           },
      //         ],
      //       },
      //     ],
      //   },
      // ],
    },
  }

  return <Sidebar {...sidebar}></Sidebar>
}
