/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROPERTY_REGISTRY_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
