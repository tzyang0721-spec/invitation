const MAX_BODY_BYTES = 32768

class ValidationError extends Error {}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
}

function isSameOrigin(request) {
  const origin = request.headers.get('Origin')
  if (!origin) return true
  try { return new URL(origin).origin === new URL(request.url).origin } catch { return false }
}

async function readJson(request) {
  const body = await request.arrayBuffer()
  if (body.byteLength > MAX_BODY_BYTES) throw new ValidationError('请求内容过大。')
  try { return JSON.parse(new TextDecoder().decode(body) || '{}') } catch { throw new ValidationError('请求格式无效。') }
}

function text(value, maxLength) { return String(value ?? '').trim().slice(0, maxLength) }

function submissionFrom(body) {
  const guestName = text(body.guestName, 30)
  const partySize = Number(body.partySize)
  const needsAccommodation = body.needsAccommodation === true
  const checkInAt = text(body.checkInAt, 16)
  const checkOutAt = text(body.checkOutAt, 16)
  const localDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
  if (!guestName) throw new ValidationError('请填写宾客姓名。')
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 6) throw new ValidationError('出席人数无效。')
  if (body.privacyConsent !== true) throw new ValidationError('请先确认宾客信息使用说明。')
  if (needsAccommodation && (!localDateTime.test(checkInAt) || !localDateTime.test(checkOutAt) || checkOutAt <= checkInAt)) throw new ValidationError('请填写有效的住宿时间。')
  return { guestName, partySize, needsAccommodation, checkInAt: needsAccommodation ? checkInAt : null, checkOutAt: needsAccommodation ? checkOutAt : null, phone: text(body.phone, 20), message: text(body.message, 200) }
}

async function hash(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function token() {
  const bytes = new Uint8Array(32); crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

async function createRsvp(request, env) {
  const entry = submissionFrom(await readJson(request)); const id = crypto.randomUUID(); const editToken = token()
  await env.DB.prepare('INSERT INTO wedding_rsvps (id, edit_token_hash, guest_name, party_size, needs_accommodation, check_in_at, check_out_at, phone, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, await hash(editToken), entry.guestName, entry.partySize, entry.needsAccommodation ? 1 : 0, entry.checkInAt, entry.checkOutAt, entry.phone || null, entry.message || null).run()
  return json({ id, editToken, crewNo: await crewNumberFor(env, id) }, 201)
}

async function crewNumberFor(env, id) {
  const result = await env.DB.prepare('SELECT COUNT(*) AS crew_no FROM wedding_rsvps WHERE rowid <= (SELECT rowid FROM wedding_rsvps WHERE id = ?)').bind(id).first()
  return Number(result?.crew_no || 0)
}

async function updateRsvp(request, env, id) {
  const body = await readJson(request); const entry = submissionFrom(body); const editToken = text(body.editToken, 128)
  if (!editToken) throw new ValidationError('缺少修改凭据，请重新登记。')
  const result = await env.DB.prepare('UPDATE wedding_rsvps SET guest_name = ?, party_size = ?, needs_accommodation = ?, check_in_at = ?, check_out_at = ?, phone = ?, message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND edit_token_hash = ?')
    .bind(entry.guestName, entry.partySize, entry.needsAccommodation ? 1 : 0, entry.checkInAt, entry.checkOutAt, entry.phone || null, entry.message || null, id, await hash(editToken)).run()
  if (!result.meta.changes) return json({ error: '修改凭据无效，请联系新人。' }, 403)
  return json({ id, crewNo: await crewNumberFor(env, id) })
}

function secure(response, request) {
  const headers = new Headers(response.headers)
  headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; media-src 'self' https://audio-ssl.itunes.apple.com")
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin'); headers.set('X-Content-Type-Options', 'nosniff'); headers.set('X-Frame-Options', 'SAMEORIGIN')
  if (new URL(request.url).pathname === '/') headers.set('Cache-Control', 'no-store')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export default { async fetch(request, env) {
  try {
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/api/health') {
      const table = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'wedding_rsvps'").first()
      return json({ status: 'ok', database: 'cloudflare-d1', schemaReady: Boolean(table) })
    }
    if (request.method === 'POST' && url.pathname === '/api/rsvp') return isSameOrigin(request) ? createRsvp(request, env) : json({ error: '请求来源无效。' }, 403)
    const match = request.method === 'PUT' && url.pathname.match(/^\/api\/rsvp\/([0-9a-f-]{36})$/i)
    if (match) return isSameOrigin(request) ? updateRsvp(request, env, match[1]) : json({ error: '请求来源无效。' }, 403)
    if (url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404)
    return secure(await env.ASSETS.fetch(request), request)
  } catch (error) {
    console.error('Request failed:', error instanceof ValidationError ? error.message : error.name)
    return json({ error: error instanceof ValidationError ? error.message : '服务暂时不可用，请稍后重试。' }, error instanceof ValidationError ? 400 : 500)
  }
} }
