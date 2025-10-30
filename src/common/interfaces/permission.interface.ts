export interface PermArrays {
  allowed?: Set<string>
  forbidden?: Set<string>
}
export interface Permission {
  users?: PermArrays
  roles?: PermArrays
  channels?: PermArrays
}
