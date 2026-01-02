import ky, { HTTPError } from 'ky'

export type ApiError = {
  status: number
  title?: string
  detail?: string
  raw?: unknown
}

async function safeReadBody(res: Response): Promise<unknown> {
  try {
    // Many endpoints return JSON; if not JSON, fallback to text
    return await res.clone().json()
  } catch {
    try {
      const text = await res.text()
      return text || null
    } catch {
      return null
    }
  }
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: string
    token?: string
    searchParams?: Record<string, string | number | boolean | undefined>
    json?: unknown
  } = {},
): Promise<T> {
  const { token, method, searchParams, json } = options
  try {
    return await ky(path, {
      method,
      searchParams,
      json,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }).json<T>()
  } catch (e: any) {
    if (e instanceof HTTPError) {
      const body = await safeReadBody(e.response)
      const err: ApiError = { status: e.response.status, raw: body }
      if (body && typeof body === 'object') {
        const b = body as any
        err.title = b.title
        err.detail = b.detail
      }
      throw err
    }
    throw e
  }
}

