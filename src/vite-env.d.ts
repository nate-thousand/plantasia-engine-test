/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RENDERER?: 'dom' | 'pixi';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __PLANTASIA_BOOT_TIMEOUT__?: ReturnType<typeof setTimeout>;
  plantasiaShowBootHelp?: (title: string, message: string) => void;
}
