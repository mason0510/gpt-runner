import fs from 'fs'
import type { ExtensionContext } from 'vscode'
import * as vscode from 'vscode'
import * as uuid from 'uuid'
import { ClientEventName, toUnixPath, waitForCondition } from '@nicepkg/gpt-runner-shared/common'
import { PathUtils } from '@nicepkg/gpt-runner-shared/node'
import type { ContextLoader } from '../contextLoader'
import { Commands, EXT_DISPLAY_NAME, EXT_NAME } from '../constant'
import { createHash, getLang, getServerBaseUrl, openFileInNewTab } from '../utils'
import { state } from '../state'
import { EventType, VscodeEventName, emitter } from '../emitter'
import { log } from '../log'

class ChatViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = `${EXT_NAME}.chatView`

  #view?: vscode.WebviewView
  #extContext: ExtensionContext
  #projectPath: string

  constructor(
    extContext: ExtensionContext,
    projectPath: string,
  ) {
    this.#extContext = extContext
    this.#projectPath = projectPath
  }

  static handleWebviewCreated(webview: vscode.Webview) {
    webview.onDidReceiveMessage(({ eventName }: { eventName: ClientEventName }) => {
      if (eventName === ClientEventName.InitSuccess)
        ChatViewProvider.handleWebviewWindowInit()
    })
  }

  static handleWebviewWindowInit() {
    // ensure first time to update opening file paths
    emitter.emit(VscodeEventName.VscodeUpdateOpeningFilePaths)

    // ensure first time to update selected text
    emitter.emit(ClientEventName.UpdateUserSelectedText, {
      text: state.selectedText,
    })

    // listen if webview want to open a file
    emitter.on(ClientEventName.OpenFileInIde, ({ filePath }) => {
      openFileInNewTab(filePath)
    })
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this.#view = webviewView
    state.sidebarWebviewView = webviewView
    ChatViewProvider.updateWebview(webviewView.webview, this.#extContext, this.#projectPath)
    ChatViewProvider.handleWebviewCreated(webviewView.webview)
  }

  static createWebviewPanel(extContext: ExtensionContext, projectPath: string): vscode.WebviewPanel {
    const panel = vscode.window.createWebviewPanel(
      uuid.v4(),
      EXT_DISPLAY_NAME,
      {
        viewColumn: vscode.ViewColumn.Two,
        preserveFocus: true,
      },
      { retainContextWhenHidden: true },
    )
    panel.iconPath = vscode.Uri.joinPath(extContext.extensionUri, './res/logo.svg')
    panel.onDidDispose(() => {
      state.webviewPanels.delete(panel)
    })
    state.webviewPanels.add(panel)
    ChatViewProvider.updateWebview(panel.webview, extContext, projectPath)
    ChatViewProvider.handleWebviewCreated(panel.webview)

    return panel
  }

  static updateWebview(webview: vscode.Webview, extContext: ExtensionContext, projectPath: string) {
    webview.onDidReceiveMessage(({ eventName, eventData }) => {
      emitter.emit(eventName, eventData, EventType.ReceiveMessage)
    })

    webview.html = ChatViewProvider.getHtmlForWebview(webview, extContext, projectPath)
  }

  static getHtmlForWebview(webview: vscode.Webview, extContext: ExtensionContext, projectPath: string): string {
    const { extensionUri } = extContext

    const baseUri = vscode.Uri.joinPath(extensionUri, './dist/web/browser')

    webview.options = {
      enableScripts: true,
      localResourceRoots: [baseUri],
    }

    const indexHtml = fs.readFileSync(PathUtils.join(baseUri.fsPath, 'index.html'), 'utf8')
    const nonce = createHash()

    const webviewBaseUrl = webview.asWebviewUri(baseUri).toString().replace(/\/$/, '')

    const indexHtmlWithBaseUri = indexHtml.replace(
      /\s+(href|src)="(.+?)"/g,
      (_, attr, url) => ` ${attr}="${webview.asWebviewUri(vscode.Uri.joinPath(baseUri, url))}"`,
    ).replace(/\/\/\s*before-script/g, `
      window.vscode = acquireVsCodeApi()

      window.__GLOBAL_CONFIG__ = {
        rootPath: '${toUnixPath(projectPath)}',
        serverBaseUrl: '${getServerBaseUrl()}',
        baseUrl: '${webviewBaseUrl}',
        webWorkerBaseUrl: '${getServerBaseUrl()}',
        initialRoutePath: '/chat',
        showDiffCodesBtn: true,
        showInsertCodesBtn: true,
        defaultLangId: '${getLang()}',
        defaultTheme: 'vscodeDynamic',
        showIdeFileContextOptions: true,
        showUserSelectedTextContextOptions: true,
        editFileInIde: true,
      }

      window.addEventListener('message', event => {
        const message = event.data || {}; // The JSON data our extension sent
        const {eventName, eventData} = message
        window.__emitter__.emit(eventName, eventData, "${EventType.ReceiveMessage}")
      })

      oldEmit = window.__emitter__.emit
      window.__emitter__.emit = function (...args) {
        const [eventName, eventData, type] = args
        if (type !== "${EventType.ReceiveMessage}") {
          vscode.postMessage({eventName, eventData})
        }
        return oldEmit.apply(this, args)
      }

      // fix vscode open link in browser
      const vscodeGoTo = (url) => {
        window.__emitter__.emit('${VscodeEventName.VscodeGoTo}', {url})
      }

      const originalWindowOpen = window.open
      window.open = (url) => {
        if (url.includes('vscode-resource.')) return
        vscodeGoTo(url);
      }

      document.addEventListener('DOMContentLoaded', () => {
        document.body.addEventListener('click', (event) => {
          const target = event.target.closest('a') || event.target.closest('vscode-link')
          if (target && target.href && !target.href.includes('vscode-resource.')) {
            event.preventDefault();
            vscodeGoTo(target.href);
          }
        }, true);
      });
    `).replace(/<script\s*([\w\W]+)?>/g,
      (_, attr) => `<script ${attr} nonce="${nonce}">`,
    )

    log.appendLine(`indexHtmlWithBaseUri:\n${indexHtmlWithBaseUri}`)

    return indexHtmlWithBaseUri
  }
}

export async function registerWebview(
  cwd: string,
  contextLoader: ContextLoader,
  ext: ExtensionContext,
) {
  const provider = new ChatViewProvider(ext, cwd)
  let sidebarWebviewDisposer: vscode.Disposable | undefined
  let webviewPanelDisposer: vscode.Disposable | undefined

  const dispose = () => {
    sidebarWebviewDisposer?.dispose?.()
    webviewPanelDisposer?.dispose?.()
  }

  // ensure server port is ready
  await waitForCondition(() => !!state.serverPort)

  const registerProvider = () => {
    dispose()

    sidebarWebviewDisposer = vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, provider)
    webviewPanelDisposer = vscode.commands.registerCommand(Commands.OpenChat, () => {
      if (vscode.window.activeTextEditor)
        state.activeEditor = vscode.window.activeTextEditor

      ChatViewProvider.createWebviewPanel(ext, cwd)
    })

    return vscode.Disposable.from({
      dispose,
    })
  }

  emitter.on(VscodeEventName.VscodeGoTo, ({ url }) => {
    vscode.env.openExternal(vscode.Uri.parse(url))
  })

  ext.subscriptions.push(registerProvider())

  contextLoader.emitter.on('contextReload', () => {
    registerProvider()
  })
  contextLoader.emitter.on('contextUnload', () => {
    dispose()
  })
}
