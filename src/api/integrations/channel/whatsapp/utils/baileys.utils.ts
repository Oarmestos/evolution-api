import { proto } from 'baileys';
import NodeCache from 'node-cache';

export interface ExtendedIMessageKey extends proto.IMessageKey {
  remoteJidAlt?: string;
}

export const groupMetadataCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60,
});

export async function getVideoDuration(): Promise<number> {
  // Mock implementation or use a library if needed.
  // In the original code it was using a complicated approach.
  // If it's not used, we can leave it empty or remove it.
  return 0;
}
