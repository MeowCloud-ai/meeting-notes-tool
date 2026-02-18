import { contextBridge, ipcRenderer } from 'electron'

/** Exposed API for renderer process */
const api = {
  /** Send a message to the main process */
  send: (channel: string, ...args: unknown[]): void => {
    ipcRenderer.send(channel, ...args)
  },
  /** Invoke a handler in the main process and get a result */
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    return ipcRenderer.invoke(channel, ...args)
  },
  /** Listen for messages from the main process */
  on: (channel: string, callback: (...args: unknown[]) => void): void => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-expect-error fallback for non-isolated context
  window.api = api
}
