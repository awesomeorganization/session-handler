/* eslint-disable node/no-unsupported-features/es-syntax */

// REFERENCES
// https://tools.ietf.org/html/rfc6265

const DEFAULT_COOKIE_NAME = 'session'
const DEFAULT_COOKIE_OPTIONS = {
  httpOnly: true,
}
const DEFAULT_TTL = 2 * 60 * 60 * 1e3
const SPACES_REGEXP = new RegExp('\\s+', 'g')

export const parseCookie = ({ cookie }) => {
  return new Map(
    cookie
      .replace(SPACES_REGEXP, '')
      .split(';')
      .map((iterator) => {
        const [name, value] = iterator.split('=')
        if (value[0] === '"' && value[value.length - 1] === '"') {
          return [name, value.slice(1, -1)]
        }
        return [name, value]
      })
  )
}

export const setCookie = ({ domain, expires, httpOnly, maxAge, name, path, sameSite, secure, value }) => {
  const attributes = [`${name}=${value}`]
  if (domain !== undefined) {
    attributes.push(`Domain=${domain}`)
  }
  if (expires !== undefined) {
    attributes.push(`Expires=${expires}`)
  }
  if (httpOnly === true) {
    attributes.push('HttpOnly')
  }
  if (maxAge !== undefined) {
    attributes.push(`Max-Age=${maxAge}`)
  }
  if (path !== undefined) {
    attributes.push(`Path=${path}`)
  }
  if (sameSite !== undefined) {
    attributes.push(`SameSite=${sameSite}`)
  }
  if (secure === true) {
    attributes.push('Secure')
  }
  return attributes.join('; ')
}

export const sessionHandler = async (
  { cookieName = DEFAULT_COOKIE_NAME, cookieOptions = DEFAULT_COOKIE_OPTIONS, ttl = DEFAULT_TTL } = {
    cookieName: DEFAULT_COOKIE_NAME,
    cookieOptions: DEFAULT_COOKIE_OPTIONS,
    ttl: DEFAULT_TTL,
  }
) => {
  const crypto = await import('crypto')
  const sessions = new Map()
  const generateSessionId = () => {
    return new Promise((resolve) => {
      crypto.randomBytes(16, (error, buffer) => {
        resolve(buffer.toString('hex'))
      })
    })
  }
  const createSession = async ({ response }) => {
    const session = {
      expiresAt: Date.now() + ttl,
      sessionId: await generateSessionId(),
      storage: new Map(),
    }
    sessions.set(session.sessionId, session)
    response.setHeader(
      'Set-Cookie',
      setCookie({
        ...cookieOptions,
        name: cookieName,
        value: session.sessionId,
      })
    )
    return {
      ...session,
    }
  }
  const handle = ({ request, response }) => {
    if (request.aborted === true || response.writableEnded === true) {
      return undefined
    }
    const now = Date.now()
    if ('cookie' in request.headers === false) {
      return createSession({
        response,
      })
    }
    const cookie = parseCookie({
      cookie: request.headers.cookie,
    })
    const sessionId = cookie.get(cookieName)
    if (sessionId === undefined) {
      return createSession({
        response,
      })
    }
    for (const { expiresAt, sessionId } of sessions.values()) {
      if (expiresAt > now) {
        continue
      }
      sessions.delete(sessionId)
    }
    const session = sessions.get(sessionId)
    if (session === undefined) {
      return createSession({
        response,
      })
    }
    session.expiresAt = now + ttl
    return {
      ...session,
    }
  }
  return {
    handle,
    sessions,
  }
}
