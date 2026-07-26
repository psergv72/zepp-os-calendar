import { getText } from '@zos/i18n'
import { getLanguage } from '@zos/settings'

const MONTH_KEYS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const DAY_KEYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const EN_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const RU_MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
const RU_DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

let cachedLocale = null
let monthNamesCache = null
let dayNamesCache = null
let todayTextCache = null

function hasCyrillic(str) {
  return /[а-яА-ЯёЁ]/.test(str)
}

function detectIsRussian() {
  const months = MONTH_KEYS.map((k) => getText(k))
  const hasRu = months.some((m) => hasCyrillic(m))
  if (hasRu) return true

  const lang = getLanguage()
  return lang === 11
}

function getLocale() {
  if (!cachedLocale) {
    const isRu = detectIsRussian()
    cachedLocale = {
      firstDay: isRu ? 1 : 0,
      months: isRu ? RU_MONTHS : EN_MONTHS,
      days: isRu ? RU_DAYS : EN_DAYS,
      today: isRu ? 'Сегодня' : 'Today',
    }
  }
  return cachedLocale
}

function buildCaches() {
  if (monthNamesCache) return

  const loc = getLocale()

  const sysMonths = MONTH_KEYS.map(k => {
    const t = getText(k)
    return (t && t !== k) ? to3title(t) : null
  })
  monthNamesCache = sysMonths[0] ? sysMonths : loc.months

  const sysDays = DAY_KEYS.map(k => toTitleFirst(getText(k)))
  dayNamesCache = (sysDays[0] && sysDays[0].toUpperCase() !== DAY_KEYS[0]) ? sysDays : loc.days

  const sysToday = getText('TODAY')
  todayTextCache = (sysToday && sysToday !== 'TODAY') ? sysToday : loc.today
}

export function getFirstDayOfWeek() {
  return getLocale().firstDay
}

function toTitleFirst(str) {
  if (!str || str.length < 2) return str
  return str[0].toUpperCase() + str.slice(1).toLowerCase()
}

function to3title(str) {
  if (!str) return str
  return str[0].toUpperCase() + str.slice(1, 3).toLowerCase()
}

export function getMonthName(monthIndex) {
  buildCaches()
  return monthNamesCache[monthIndex]
}

export function getDayNames() {
  buildCaches()
  return dayNamesCache
}

export function getTodayText() {
  buildCaches()
  return todayTextCache
}
