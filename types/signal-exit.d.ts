declare module 'signal-exit' {
  function onExit(callback: (code: number, signal: string) => void): void

  export = onExit
}
