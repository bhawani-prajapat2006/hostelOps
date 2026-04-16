const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"

const canUseStorage = () => typeof window !== "undefined"

export const getAccessToken = () => {
  if (!canUseStorage()) return null
  return sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export const getRefreshToken = () => {
  if (!canUseStorage()) return null
  return sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export const setAuthTokens = (accessToken, refreshToken) => {
  if (!canUseStorage()) return
  if (accessToken) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }
  if (refreshToken) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export const clearAuthTokens = () => {
  if (!canUseStorage()) return
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const hasAccessToken = () => Boolean(getAccessToken())
