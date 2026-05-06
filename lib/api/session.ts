export function saveTokens(accessToken: string, refreshToken: string): void {
  document.cookie = `accessToken=${accessToken}; path=/; SameSite=Strict`;
  document.cookie = `refreshToken=${refreshToken}; path=/; SameSite=Strict`;
}

export function clearTokens(): void {
  document.cookie = "accessToken=; path=/; max-age=0";
  document.cookie = "refreshToken=; path=/; max-age=0";
}

export function getAccessToken(): string | undefined {
  return getCookie("accessToken");
}

export function getRefreshToken(): string | undefined {
  return getCookie("refreshToken");
}

function getCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}
