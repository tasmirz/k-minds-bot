export interface PermArrays {
  allowed?: string[];
  forbidden?: string[];
}
export interface Permission {
  users?: PermArrays;
  roles?: PermArrays;
  channels?: PermArrays;
}
