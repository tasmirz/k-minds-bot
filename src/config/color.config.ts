export const Colors = {
  success: 0x2ecc71,

  error: 0xe74c3c,

  info: 0x3498db,
  warning: 0xf39c12,

  primary: 0x9b59b6,
  secondary: 0x2c3e50,

  dark: 0x2c2f33,
  light: 0x99aab5,

  online: 0x43b581,
  idle: 0xfaa61a,
  dnd: 0xf04747,
  offline: 0x747f8d,
} as const;

export type ColorName = keyof typeof Colors;
