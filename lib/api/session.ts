export function saveTokens(accessToken: string): void {
  document.cookie = `accessToken=${accessToken}; path=/; SameSite=Strict`;
}

export function clearTokens(): void {
  document.cookie = "accessToken=; path=/; max-age=0";
}

export function getAccessToken(): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];
}
