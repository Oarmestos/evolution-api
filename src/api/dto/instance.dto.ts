import { IntegrationDto } from '@api/integrations/integration.dto';
import { WAPresence } from 'baileys';

export class InstanceDto extends IntegrationDto {
  instanceName: string;
  instanceId?: string;
  qrcode?: boolean;
  businessId?: string;
  number?: string;
  integration?: string;
  token?: string;
  status?: string;
  ownerJid?: string;
  connectionStatus?: string;
  profileName?: string;
  profilePicUrl?: string;
  // settings
  rejectCall?: boolean;
  msgCall?: string;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
  syncFullHistory?: boolean;
  wavoipToken?: string;
  // proxy
  proxyHost?: string;
  proxyPort?: string;
  proxyProtocol?: string;
  proxyUsername?: string;
  proxyPassword?: string;
  // webhook (flat structure to match schema)
  webhookEnabled?: boolean;
  webhookUrl?: string;
  webhookByEvents?: boolean;
  webhookBase64?: boolean;
  webhookEvents?: string[];
  webhookHeaders?: Record<string, any>;
  // chatwoot
  chatwootAccountId?: string;
  chatwootConversationPending?: boolean;
  chatwootAutoCreate?: boolean;
  chatwootDaysLimitImportMessages?: number;
  chatwootImportContacts?: boolean;
  chatwootImportMessages?: boolean;
  chatwootLogo?: string;
  chatwootMergeBrazilContacts?: boolean;
  chatwootNameInbox?: string;
  chatwootOrganization?: string;
  chatwootReopenConversation?: boolean;
  chatwootSignMsg?: boolean;
  chatwootToken?: string;
  chatwootUrl?: string;
}

export class SetPresenceDto {
  presence: WAPresence;
}
