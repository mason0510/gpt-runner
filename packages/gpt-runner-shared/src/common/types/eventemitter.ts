import type { ClientEventName } from './enum'

export interface ClientEventData {
  [ClientEventName.RefreshTree]: void

  [ClientEventName.InsertCodes]: {
    codes: string
  }

  [ClientEventName.DiffCodes]: {
    codes: string
  }

}

export type EventEmitterMap = {
  [K in ClientEventName]: (data: ClientEventData[K]) => void
}
