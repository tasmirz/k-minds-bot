export interface OTPCode {
  email: string;
  code: string;
  expires_at: Date;
  discord_id: bigint;
  created_at: Date;
}
