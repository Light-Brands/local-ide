// IDE hooks exports

export { useMobileDetect, useViewportHeight } from './useMobileDetect';

// Connection management
export {
  useConnection,
  useTerminalConnection,
  useStreaming,
  type UseConnectionOptions,
  type UseConnectionReturn,
  type UseStreamingOptions,
  type UseStreamingReturn,
} from './useConnection';

// Chat
export {
  useChat,
  type UseChatOptions,
  type UseChatReturn,
  type Message,
  type ContentBlock,
} from './useChat';

// File Sync
export {
  useFileSync,
  type UseFileSyncOptions,
  type UseFileSyncReturn,
} from './useFileSync';
