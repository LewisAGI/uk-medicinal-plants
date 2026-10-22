/// <reference types="vite/client" />

declare module 'virtual:public-pack' {
  const pack: {
    content: unknown
    sources: unknown
    evidenceLabelNote: string
  }
  export default pack
}
