import axios from "axios"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "")
const BASE_URL = `${API_BASE_URL}/api/v1`

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
})

export const getAllComplaints = async (token) => {
  const response = await axios.get(`${BASE_URL}/complaints`, authHeaders(token))
  return response.data
}

export const assignWorker = async (id, workerId, token) => {
  const response = await axios.put(
    `${BASE_URL}/complaints/${id}/assign`,
    { worker_id: Number(workerId) },
    authHeaders(token)
  )
  return response.data
}

export const updateStatus = async (id, status, token) => {
  const response = await axios.put(
    `${BASE_URL}/complaints/${id}`,
    { status },
    authHeaders(token)
  )
  return response.data
}

export const submitResolutionProof = async (id, imageAfterSolved, token) => {
  const response = await axios.put(
    `${BASE_URL}/complaints/${id}/submit-resolution`,
    { image_after_solved: imageAfterSolved },
    authHeaders(token)
  )
  return response.data
}

export const reviewResolution = async (id, approve, token, options = {}) => {
  const payload = {
    approve,
    ...(options.comment ? { comment: options.comment } : {}),
    ...(options.reassignWorkerId ? { reassign_worker_id: Number(options.reassignWorkerId) } : {}),
  }

  const response = await axios.put(
    `${BASE_URL}/complaints/${id}/review-resolution`,
    payload,
    authHeaders(token)
  )
  return response.data
}
