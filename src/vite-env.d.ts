/// <reference types="vite/client" />

interface Window {
  __PLANTASIA_BOOT_TIMEOUT__?: ReturnType<typeof setTimeout>;
  plantasiaShowBootHelp?: (title: string, message: string) => void;
}
