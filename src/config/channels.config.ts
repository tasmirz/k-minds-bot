export const Channels = {
  welcome: 'WELCOME_CHANNEL_ID',
  rules: '1432941116935639040',
  announcements: 'ANNOUNCEMENTS_CHANNEL_ID',
  updates: 'UPDATES_CHANNEL_ID',

  general: 'GENERAL_CHANNEL_ID',
  introductions: 'INTRODUCTIONS_CHANNEL_ID',
  help: 'HELP_CHANNEL_ID',

  resources: '1431332136337801216',

  modLogs: 'MOD_LOGS_CHANNEL_ID',
  messageLogs: 'MESSAGE_LOGS_CHANNEL_ID',
  memberLogs: 'MEMBER_LOGS_CHANNEL_ID',

  verification: '1432936590749073479',
  verificationLogs: '1432942049614761994',
  dm: 'DM',
} as const;

export type ChannelKey = keyof typeof Channels;
