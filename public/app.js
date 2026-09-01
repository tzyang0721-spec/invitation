const weddingDate = new Date('2026-10-01T16:58:00+08:00')
// 需要真实收集宾客名单时，只需粘贴第三方表单的公开填写链接；留空则保持本地演示模式。
const RSVP_FORM_URL = ''
document.querySelector('#days-count').textContent = String(Math.max(0, Math.ceil((weddingDate.getTime() - Date.now()) / 86400000)))

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const revealElements = document.querySelectorAll('.reveal')
if ('IntersectionObserver' in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return
    entry.target.classList.add('is-visible')
    revealObserver.unobserve(entry.target)
  }), { threshold: 0.12, rootMargin: '0px 0px -4% 0px' })
  revealElements.forEach((element) => revealObserver.observe(element))
} else revealElements.forEach((element) => element.classList.add('is-visible'))

const bubbleField = document.querySelector('.bubble-field')
for (let index = 0; index < 28; index += 1) {
  const bubble = document.createElement('i')
  bubble.style.left = `${(index * 37 + 9) % 97}%`
  bubble.style.setProperty('--duration', `${6 + (index % 6) * 1.1}s`)
  bubble.style.setProperty('--delay', `${-(index % 9) * 1.15}s`)
  bubbleField.append(bubble)
}

const hud = document.querySelector('.game-hud')
const depthValue = document.querySelector('#depth-value')
const oxygenFill = document.querySelector('#oxygen-fill')
const musicHint = document.querySelector('#music-hint')
let ticking = false
function updateHud() {
  const progress = Math.min(1, window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight))
  hud.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.55)
  depthValue.textContent = String(Math.round(progress * 520))
  oxygenFill.style.transform = `scaleX(${1 - progress * 0.22})`
  if (window.scrollY > 20) musicHint.classList.add('is-hidden')
  ticking = false
}
window.addEventListener('scroll', () => { if (!ticking) requestAnimationFrame(updateHud); ticking = true }, { passive: true })

const missionCard = document.querySelector('.mission-card')
const acceptButton = document.querySelector('#accept-quest')
const questStatus = document.querySelector('#quest-status')
const missionComplete = document.querySelector('#mission-complete')
let holdTimer
function startHold() {
  if (missionCard.classList.contains('is-accepted') || missionCard.classList.contains('is-holding')) return
  missionCard.classList.add('is-holding')
  holdTimer = window.setTimeout(() => {
    missionCard.classList.remove('is-holding')
    missionCard.classList.add('is-accepted')
    questStatus.textContent = 'ACCEPTED'
    acceptButton.textContent = '委托已接受 ✓'
    missionComplete.classList.remove('show')
    requestAnimationFrame(() => missionComplete.classList.add('show'))
    navigator.vibrate?.([45, 30, 80])
  }, 1000)
}
function cancelHold() { window.clearTimeout(holdTimer); missionCard.classList.remove('is-holding') }
acceptButton.addEventListener('pointerdown', startHold)
acceptButton.addEventListener('pointerup', cancelHold)
acceptButton.addEventListener('pointerleave', cancelHold)
acceptButton.addEventListener('pointercancel', cancelHold)
acceptButton.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  startHold()
})
acceptButton.addEventListener('keyup', cancelHold)

const sonarField = document.querySelector('.sonar-field')
document.querySelector('#sonar-button').addEventListener('click', () => {
  const ring = document.createElement('i')
  sonarField.append(ring)
  window.setTimeout(() => ring.remove(), 1100)
  document.querySelectorAll('.pixel-fish:not(.caught)').forEach((fish) => fish.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(2.4) drop-shadow(0 0 8px #fff)' }, { filter: 'brightness(1)' }], { duration: 700 }))
  navigator.vibrate?.(35)
})

const fishField = document.querySelector('#fish-field')
const fishCount = document.querySelector('#fish-count')
const fishColors = ['#ffbd45', '#ff6474', '#82e7de', '#b0ef4d', '#f88ed8']
const fishBlessings = ['谢谢你来，今天更完整。', '愿你也被温柔以待。', '有你在场，格外开心。', '愿你的日子常有欢喜。', '谢谢你，见证这一刻。', '愿你所盼，如期而至。', '愿你身边，常有真心。', '谢谢你，把时间留给我们。', '愿你一路有光，也有爱。', '见到你，真好。', '愿你被爱，也被理解。', '谢谢你，让今天更温暖。', '愿平凡日子，也闪闪发光。', '愿你自在，也愿你幸福。', '这份喜悦，想和你分享。', '愿所有奔赴，都值得。']
let caught = 0
function showFishBlessing(fish) {
  if (Math.random() > 0.72) return
  const blessing = document.createElement('p')
  const fishRect = fish.getBoundingClientRect()
  const fieldRect = fishField.getBoundingClientRect()
  blessing.className = 'fish-blessing'
  blessing.textContent = fishBlessings[Math.floor(Math.random() * fishBlessings.length)]
  blessing.style.left = `${Math.max(4, Math.min(fieldRect.width - 164, fishRect.left - fieldRect.left - 48))}px`
  blessing.style.top = `${Math.max(4, fishRect.top - fieldRect.top - 42)}px`
  fishField.appendChild(blessing)
  window.setTimeout(() => blessing.remove(), 2400)
}
for (let index = 0; index < 9; index += 1) {
  const fish = document.createElement('button')
  fish.type = 'button'; fish.className = 'pixel-fish'; fish.setAttribute('aria-label', `捕捉第 ${index + 1} 条鱼`)
  fish.style.top = `${12 + (index * 37) % 135}px`
  fish.style.setProperty('--swim', `${6.5 + (index % 4) * 1.2}s`)
  fish.style.setProperty('--fish', fishColors[index % fishColors.length])
  fish.style.animationDelay = `${-(index * 1.3)}s`
  fish.addEventListener('click', () => {
    if (fish.classList.contains('caught')) return
    fish.classList.add('caught'); caught = Math.min(5, caught + 1); fishCount.textContent = String(caught); navigator.vibrate?.(25); showFishBlessing(fish)
    if (caught === 5) {
      const message = document.createElement('p'); message.className = 'fish-unlock'; message.textContent = '祝福图鉴已完成：幸福值 +1000'; fishField.append(message)
    }
  })
  fishField.append(fish)
}

const crewSlides = [...document.querySelectorAll('.crew-slide')]
const crewName = document.querySelector('#crew-name')
let crewIndex = 0
function showCrew(nextIndex) {
  crewIndex = (nextIndex + crewSlides.length) % crewSlides.length
  crewSlides.forEach((slide, index) => slide.classList.toggle('is-active', index === crewIndex))
  crewName.textContent = `${crewSlides[crewIndex].dataset.name} · ${crewIndex + 1}/${crewSlides.length}`
}
document.querySelector('[data-crew="prev"]').addEventListener('click', () => showCrew(crewIndex - 1))
document.querySelector('[data-crew="next"]').addEventListener('click', () => showCrew(crewIndex + 1))

const musicToggle = document.querySelector('#music-toggle')
const officialBgm = document.querySelector('#official-bgm')
let musicPlaying = false
function setMusicState(playing) {
  musicPlaying = playing; musicToggle.classList.toggle('playing', playing); musicToggle.setAttribute('aria-pressed', String(playing)); musicToggle.setAttribute('aria-label', playing ? '暂停官方背景音乐' : '播放官方背景音乐')
}
async function playMusic() {
  musicHint.classList.add('is-hidden')
  try {
    officialBgm.volume = 0.58
    await officialBgm.play()
    setMusicState(true)
  } catch {
    setMusicState(false)
    musicHint.textContent = '音乐加载失败，请检查网络后重试'
    musicHint.classList.remove('is-hidden')
  }
}
function pauseMusic() { officialBgm.pause(); setMusicState(false) }
musicToggle.addEventListener('click', () => musicPlaying ? pauseMusic() : playMusic())
document.querySelector('#start-mission').addEventListener('click', () => { playMusic(); document.querySelector('#briefing').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }) })

const mapOpen = document.querySelector('#map-open')
const mapSheet = document.querySelector('#map-sheet')
if (mapOpen && mapSheet) {
  const venue = '天津市和平区大理道72号睦南宴会花园·宴会厅'; const encodedVenue = encodeURIComponent(venue)
  const mapStatus = document.querySelector('#map-sheet-status')
  const copyVenue = async () => {
    try { await navigator.clipboard.writeText(venue) } catch { const field = document.createElement('textarea'); field.value = venue; field.style.position = 'fixed'; field.style.opacity = '0'; document.body.append(field); field.select(); document.execCommand('copy'); field.remove() }
    mapStatus.textContent = '地点地址已复制，请打开常用地图 App 粘贴搜索。'; mapStatus.hidden = false
  }
  document.querySelector('#map-baidu').href = `https://api.map.baidu.com/geocoder?address=${encodedVenue}&output=html&src=webapp.blueholewedding`
  document.querySelector('#map-apple').href = `https://maps.apple.com/?q=${encodedVenue}`
  const closeMapSheet = () => { mapSheet.hidden = true; mapStatus.hidden = true; mapOpen.focus() }
  mapOpen.addEventListener('click', () => { mapSheet.hidden = false; document.querySelector('#map-copy').focus() })
  document.querySelector('#map-copy').addEventListener('click', copyVenue)
  document.querySelector('#map-close').addEventListener('click', closeMapSheet)
  mapSheet.querySelector('[data-map-close]').addEventListener('click', closeMapSheet)
}

const rsvpForm = document.querySelector('#rsvp-form')
const rsvpSuccess = document.querySelector('#rsvp-success')
if (rsvpForm) {
  const accommodationDates = document.querySelector('#accommodation-dates')
  const accommodationField = document.querySelector('#accommodation-field')
  const messageField = rsvpForm.elements.message
  const messageCount = document.querySelector('#message-count')
  const rsvpError = document.querySelector('#rsvp-error')
  const rsvpSuccessTitle = document.querySelector('#rsvp-success-title')
  const rsvpSuccessSummary = document.querySelector('#rsvp-success-summary')
  const rsvpTicket = document.querySelector('#rsvp-ticket')
  const rsvpTicketPreview = document.querySelector('#rsvp-ticket-preview')
  const rsvpTicketSave = document.querySelector('#rsvp-ticket-save')
  const rsvpSubmit = rsvpForm.querySelector('[type="submit"]')
  const storageKey = 'deep-sea-wedding-rsvp-credentials'
  // 以后补充婚礼照片时，把文件放进 public/assets/invitation-backgrounds/，并把路径加入这里。
  const invitationBackgrounds = ['./assets/dave-key-art-clean.png', './assets/sea-exploration.webp', './assets/sushi-service.webp', './assets/dave-dive.webp']
  let savedRsvp
  try { savedRsvp = JSON.parse(localStorage.getItem(storageKey)) } catch { savedRsvp = undefined }
  function updateAccommodation() {
    const needed = rsvpForm.elements.needsAccommodation.value === 'yes'
    accommodationDates.hidden = !needed; rsvpForm.elements.checkInAt.required = needed; rsvpForm.elements.checkOutAt.required = needed
    if (needed) { rsvpForm.elements.checkInAt.value ||= '2026-09-30T14:00'; rsvpForm.elements.checkOutAt.value ||= '2026-10-02T12:00' }
  }
  function fillRsvp(data) {
    if (!data) return
    rsvpForm.elements.guestName.value = data.guestName || ''; rsvpForm.elements.partySize.value = String(data.partySize || 1); rsvpForm.elements.phone.value = data.phone || ''; rsvpForm.elements.message.value = data.message || ''; rsvpForm.elements.privacyConsent.checked = Boolean(data.privacyConsent)
    const choice = rsvpForm.querySelector(`[name="needsAccommodation"][value="${data.needsAccommodation ? 'yes' : 'no'}"]`); if (choice) choice.checked = true
    rsvpForm.elements.checkInAt.value = data.checkInAt || '2026-09-30T14:00'; rsvpForm.elements.checkOutAt.value = data.checkOutAt || '2026-10-02T12:00'; messageCount.value = String(rsvpForm.elements.message.value.length); updateAccommodation()
  }
  function showRsvpError(message) { rsvpError.textContent = message; rsvpError.hidden = false }
  function loadTicketImage(source) {
    return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = source })
  }
  async function generateRsvpTicket(data) {
    if (!rsvpTicket || !rsvpTicketPreview || !rsvpTicketSave) return
    rsvpTicket.hidden = true
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920
    const context = canvas.getContext('2d'); const source = invitationBackgrounds[Math.floor(Math.random() * invitationBackgrounds.length)]
    try {
      const background = await loadTicketImage(source); const scale = Math.max(canvas.width / background.width, canvas.height / background.height)
      const width = background.width * scale; const height = background.height * scale
      context.drawImage(background, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
    } catch { context.fillStyle = '#063d66'; context.fillRect(0, 0, canvas.width, canvas.height) }
    const seaShade = context.createLinearGradient(0, 0, 0, 1920)
    seaShade.addColorStop(0, 'rgba(1, 19, 39, .54)'); seaShade.addColorStop(.6, 'rgba(1, 19, 39, .82)'); seaShade.addColorStop(1, 'rgba(1, 12, 29, .96)')
    context.fillStyle = seaShade; context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = 'rgba(132, 244, 236, .16)'; context.fillRect(0, 140, 8, 1640); context.fillRect(1072, 140, 8, 1640)
    const cutCard = (x, y, width, height, cut) => {
      context.beginPath(); context.moveTo(x + cut, y); context.lineTo(x + width - cut, y); context.lineTo(x + width, y + cut); context.lineTo(x + width, y + height - cut); context.lineTo(x + width - cut, y + height); context.lineTo(x + cut, y + height); context.lineTo(x, y + height - cut); context.lineTo(x, y + cut); context.closePath()
    }
    cutCard(79, 352, 922, 1218, 28); context.fillStyle = '#07192a'; context.fill(); context.translate(0, -9)
    cutCard(79, 352, 922, 1218, 28); context.fillStyle = '#eeeae0'; context.fill(); context.translate(0, 9)
    cutCard(92, 365, 896, 1192, 22); context.strokeStyle = '#4a9da4'; context.lineWidth = 4; context.stroke()
    context.fillStyle = '#123a54'; context.fillRect(110, 392, 860, 116)
    context.textAlign = 'center'; context.fillStyle = '#8eece4'; context.font = '700 26px monospace'; context.fillText('BLUE HOLE WEDDING MISSION', 540, 436)
    context.fillStyle = '#fff0b8'; context.font = '900 39px "Microsoft YaHei", sans-serif'; context.fillText('赴 约 通 行 证', 540, 481)
    context.fillStyle = '#b7b0a4'; context.fillRect(128, 552, 824, 2)
    context.fillStyle = '#5d5b52'; context.font = '700 24px monospace'; context.fillText('DIVER NAME', 540, 630)
    context.fillStyle = '#1d4353'; context.font = '900 76px "Microsoft YaHei", sans-serif'; context.fillText(data.guestName.slice(0, 12), 540, 730)
    context.fillStyle = '#998a69'; context.font = '700 26px "Microsoft YaHei", sans-serif'; context.fillText('完成任务，获得本次特别相聚的登船许可', 540, 785)
    const crewNo = Number(data.crewNo) > 0 ? `#${String(data.crewNo).padStart(3, '0')}` : '#---'
    const drawField = (x, y, label, value, color = '#1d4353', font = '900 39px "Microsoft YaHei", sans-serif') => {
      context.textAlign = 'left'; context.fillStyle = '#75857d'; context.font = '700 22px monospace'; context.fillText(label, x, y)
      context.fillStyle = color; context.font = font; context.fillText(value, x, y + 52)
    }
    drawField(176, 904, 'MISSION DATE', '2026.10.01')
    drawField(610, 904, 'CREW NO.', crewNo, '#bf7d35', '900 44px monospace')
    context.fillStyle = '#c7c0b2'; context.fillRect(540, 865, 2, 136)
    drawField(176, 1082, 'MEETING POINT', '睦南宴会花园')
    drawField(610, 1082, 'PARTY', `${data.partySize} DIVER${data.partySize > 1 ? 'S' : ''}`, '#1d4353', '900 34px monospace')
    context.setLineDash([12, 10]); context.strokeStyle = '#b7b0a4'; context.lineWidth = 2; context.beginPath(); context.moveTo(128, 1210); context.lineTo(952, 1210); context.stroke(); context.setLineDash([])
    context.textAlign = 'center'
    context.fillStyle = '#7b7467'; context.font = '700 27px "Microsoft YaHei", sans-serif'; context.fillText('请凭此证赴约 · 2026.10.01', 540, 1302)
    context.save(); context.translate(540, 1400); context.rotate(-.055); context.strokeStyle = '#bd7b38'; context.lineWidth = 6; context.strokeRect(-218, -57, 436, 114); context.fillStyle = '#bd7b38'; context.font = '900 39px monospace'; context.fillText('MISSION ACCEPTED', 0, 13); context.restore()
    context.fillStyle = '#607c79'; context.font = '700 22px monospace'; context.fillText('OCEAN YES! · WEDDING CREW', 540, 1505)
    const imageUrl = canvas.toDataURL('image/jpeg', .92); rsvpTicketPreview.src = imageUrl; rsvpTicketSave.href = imageUrl; rsvpTicketSave.download = `blue-hole-wedding-${data.guestName || 'guest'}.jpg`; rsvpTicket.hidden = false
  }
  function collectRsvp() {
    const formData = new FormData(rsvpForm); const guestName = String(formData.get('guestName') || '').trim(); const needsAccommodation = formData.get('needsAccommodation') === 'yes'; const checkInAt = String(formData.get('checkInAt') || ''); const checkOutAt = String(formData.get('checkOutAt') || '')
    if (!guestName) throw new Error('请填写宾客姓名。'); if (needsAccommodation && (!checkInAt || !checkOutAt)) throw new Error('请填写完整的住宿时间。'); if (needsAccommodation && checkOutAt <= checkInAt) throw new Error('退房时间必须晚于入住时间。')
    return { id: savedRsvp?.id, editToken: savedRsvp?.editToken, crewNo: savedRsvp?.crewNo, guestName, partySize: Number(formData.get('partySize')), needsAccommodation, checkInAt: needsAccommodation ? checkInAt : null, checkOutAt: needsAccommodation ? checkOutAt : null, phone: String(formData.get('phone') || '').trim(), message: String(formData.get('message') || '').trim(), privacyConsent: formData.get('privacyConsent') === 'on' }
  }
  rsvpForm.addEventListener('change', (event) => { if (event.target.name === 'needsAccommodation') { accommodationField.removeAttribute('aria-invalid'); updateAccommodation() } })
  messageField.addEventListener('input', () => { messageCount.value = String(messageField.value.length) })
  rsvpForm.addEventListener('submit', async (event) => {
    event.preventDefault(); rsvpError.hidden = true
    let submission
    try { submission = collectRsvp() } catch (error) { showRsvpError(error.message); return }
    rsvpSubmit.disabled = true; rsvpSubmit.querySelector('span').textContent = '正在安全提交……'
    try {
      const endpoint = submission.id && submission.editToken ? `/api/rsvp/${submission.id}` : '/api/rsvp'
      const response = await fetch(endpoint, { method: submission.id && submission.editToken ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submission) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || '提交失败，请稍后重试。')
      savedRsvp = { ...submission, id: result.id || submission.id, editToken: result.editToken || submission.editToken, crewNo: result.crewNo || submission.crewNo }
      localStorage.setItem(storageKey, JSON.stringify(savedRsvp))
      rsvpForm.hidden = true; rsvpSuccess.hidden = false; rsvpSuccessTitle.textContent = `${submission.guestName}，登记成功`; rsvpSuccessSummary.textContent = `已登记 ${submission.partySize} 人${submission.needsAccommodation ? ' · 已提交住宿需求' : ' · 无需住宿'}。你可以在这台设备上继续修改。`; rsvpSuccess.focus({ preventScroll: true }); generateRsvpTicket(savedRsvp)
    } catch (error) { showRsvpError(error.message || '保存失败，请检查浏览器设置后重试。') }
    finally { rsvpSubmit.disabled = false; rsvpSubmit.querySelector('span').textContent = '提交赴约信息' }
  })
  document.querySelector('#rsvp-edit').addEventListener('click', () => { fillRsvp(savedRsvp); rsvpForm.hidden = false; rsvpSuccess.hidden = true })
  fillRsvp(savedRsvp)
}
