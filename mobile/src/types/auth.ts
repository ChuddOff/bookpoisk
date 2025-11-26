export interface AuthResponse {
  access?: string;
  refresh?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
}
