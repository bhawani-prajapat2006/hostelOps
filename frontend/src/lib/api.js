import axios from "axios"
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
} from "@/lib/tokenStore"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "")

const api = axios.create({
  baseURL: API_BASE_URL,
})

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
})

let isRefreshing = false
let refreshQueue = []

const redirectToLogin = () => {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login"
  }
}

const resolveRefreshQueue = (newToken) => {
  refreshQueue.forEach((entry) => entry.resolve(newToken))
  refreshQueue = []
}

const rejectRefreshQueue = (error) => {
  refreshQueue.forEach((entry) => entry.reject(error))
  refreshQueue = []
}

// Add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Try refresh token once on 401 before forcing logout.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status !== 401 || !originalRequest) {
      return Promise.reject(error)
    }

    const url = originalRequest.url || ""
    const isAuthEndpoint =
      url.includes("/api/v1/auth/login") ||
      url.includes("/api/v1/auth/register") ||
      url.includes("/api/v1/auth/google") ||
      url.includes("/api/v1/auth/refresh")

    if (isAuthEndpoint || originalRequest._retry) {
      clearAuthTokens()
      redirectToLogin()
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearAuthTokens()
      redirectToLogin()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      })
        .then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return api(originalRequest)
        })
        .catch((queueError) => Promise.reject(queueError))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshResponse = await refreshClient.post("/api/v1/auth/refresh", {
        refresh_token: refreshToken,
      })

      const newAccessToken = refreshResponse.data?.access_token
      const newRefreshToken = refreshResponse.data?.refresh_token || refreshToken

      if (!newAccessToken) {
        throw new Error("Refresh did not return access token")
      }

      setAuthTokens(newAccessToken, newRefreshToken)
      resolveRefreshQueue(newAccessToken)

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      rejectRefreshQueue(refreshError)
      clearAuthTokens()
      redirectToLogin()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api