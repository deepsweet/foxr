import EventEmitter from 'events'
import Page from './Page'
import {
  TSend,
  TInstallAddonResult,
  Context,
  TGetPrefResult
} from './types'

class Browser extends EventEmitter {
  private _send: TSend

  constructor (arg: { send: TSend }) {
    super()

    this._send = arg.send
  }

  async close (): Promise<void> {
    await this._send('Marionette:AcceptConnections', { value: false })
    await this._send('Marionette:Quit')

    this.emit('disconnected')
  }

  async disconnect (): Promise<void> {
    await this._send('WebDriver:DeleteSession')

    this.emit('disconnected')
  }

  async getPref (pref: string, defaultBranch: boolean = false): Promise<TGetPrefResult> {
    await this._setContext(Context.CHROME)

    const value = await this._send(
      'WebDriver:ExecuteScript',
      {
        script: `let [pref, defaultBranch] = arguments;
          Cu.import('resource://gre/modules/Preferences.jsm');

          let prefs = new Preferences({defaultBranch});

          return prefs.get(pref);`,
        args: [pref, defaultBranch]
      },
      'value') as TGetPrefResult

    await this._setContext(Context.CONTENT)

    return value
  }

  async install (path: string, isTemporary: boolean): Promise<string | null> {
    const { value } = await this._send('Addon:Install', {
      path,
      temporary: isTemporary
    }) as TInstallAddonResult

    return value
  }

  async newPage (): Promise<Page> {
    await this._send('WebDriver:ExecuteScript', {
      script: 'window.open()'
    })

    const pages = await this._send('WebDriver:GetWindowHandles') as string[]
    const newPageId = pages[pages.length - 1]

    await this._send('WebDriver:SwitchToWindow', {
      name: newPageId,
      focus: true
    })

    return new Page({
      browser: this,
      id: newPageId,
      send: this._send
    })
  }

  async pages (): Promise<Page[]> {
    const ids = await this._send('WebDriver:GetWindowHandles') as string[]

    return ids.map((id) => new Page({
      browser: this,
      id,
      send: this._send
    }))
  }

  private async _setContext (context: Context): Promise<void> {
    await this._send('Marionette:SetContext', { value: context })
  }

  async setPref (pref: string, value: string | number | boolean, defaultBranch: boolean = false): Promise<void> {
    await this._setContext(Context.CHROME)

    const error = await this._send('WebDriver:ExecuteScript', {
      script: `let [pref, value, defaultBranch] = arguments;
          Cu.import('resource://gre/modules/Preferences.jsm');

          let prefs = new Preferences({defaultBranch});

          try {
            prefs.set(pref,value);
            return null;
          } catch(e) {
            return e;
          }`,
      args: [pref, value, defaultBranch]
    }, 'value') as Error|null

    await this._setContext(Context.CONTENT)

    if (error) {
      throw new Error(`SetPref failed: ${error.message}`)
    }
  }

  async uninstall (id: string): Promise<void> {
    await this._send('Addon:Uninstall', { id })
  }
}

export default Browser
