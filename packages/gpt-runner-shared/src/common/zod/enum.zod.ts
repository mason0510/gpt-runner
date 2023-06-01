import { z } from 'zod'
import { ChatMessageStatus, ChatRole, ClientEventName, GptFileTreeItemType } from '../types'

export const ChatRoleSchema = z.nativeEnum(ChatRole)

export const ChatMessageStatusSchema = z.nativeEnum(ChatMessageStatus)

export const ClientEventNameSchema = z.nativeEnum(ClientEventName)

export const GptFileTreeItemTypeSchema = z.nativeEnum(GptFileTreeItemType)