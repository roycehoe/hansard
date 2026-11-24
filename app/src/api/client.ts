import { HTTP_NO_CONTENT } from '@/constants/constants'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  body: unknown
  headers: Headers

  constructor(status: number, body: unknown, headers: Headers) {
    super(`Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.headers = headers
  }
}

async function sendRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers)
  if (body !== undefined) headers.set('Content-Type', 'application/json')

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    let parsed: unknown = text
    try {
      parsed = JSON.parse(text)
    } catch {
      /* keep the raw text */
    }
    throw new ApiError(res.status, parsed, res.headers)
  }

  if (res.status === HTTP_NO_CONTENT) return undefined as T
  return res.json()
}

export function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return sendRequest<T>('GET', path, undefined, init)
}

export function apiPost<T>(
  path: string,
  body: unknown,
  init?: RequestInit
): Promise<T> {
  return sendRequest<T>('POST', path, body, init)
}

export function apiPut<T>(
  path: string,
  body: unknown,
  init?: RequestInit
): Promise<T> {
  return sendRequest<T>('PUT', path, body, init)
}

export function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  return sendRequest<T>('DELETE', path, undefined, init)
}
