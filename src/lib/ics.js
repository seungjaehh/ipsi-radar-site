// iCalendar export so the schedule lands in the phone's own calendar with a day-before alarm.
// RFC 5545: CRLF line endings, escaped text, UTC times.

const esc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const utc = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

// Only items with a source and as-of date are exportable (docs/PRODUCT.md §8-3).
export const isVerified = item => Boolean(item?.source && item?.asOf && !Number.isNaN(Date.parse(item.start)));

// A date given without a time (e.g. "면접 2026. 12. 4.") is an all-day event, not 00:00-01:00.
export const isAllDay = item => Boolean(item.allDay ?? (!item.end && /T00:00(:00)?(\+09:00)?$/.test(item.start)));
const kstDate = (iso, addDays = 0) => {
  const d = new Date(Date.parse(iso) + 9 * 3600_000 + addDays * 86400_000);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
};

export function toIcs(items, { now = new Date(), calName = '입시 레이더 일정' } = {}) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ipsi-radar//KO', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${esc(calName)}`];
  for (const it of items.filter(isVerified)) {
    const end = it.end ?? new Date(Date.parse(it.start) + 60 * 60 * 1000).toISOString();
    const when = isAllDay(it) ? [`DTSTART;VALUE=DATE:${kstDate(it.start)}`, `DTEND;VALUE=DATE:${kstDate(it.start, 1)}`] : [`DTSTART:${utc(it.start)}`, `DTEND:${utc(end)}`];
    const note = `${it.kind} · 출처: ${it.source.name}${it.source.url ? ` ${it.source.url}` : ''}${it.page ? ` p.${it.page}` : ''} · 기준일 ${it.asOf}. 반드시 대학 공지로 다시 확인하세요.`;
    lines.push('BEGIN:VEVENT', `UID:${esc(it.id)}@ipsi-radar`, `DTSTAMP:${utc(now.toISOString())}`,
      ...when, `SUMMARY:${esc(it.title)}`, `DESCRIPTION:${esc(note)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(`내일: ${it.title}`)}`, 'TRIGGER:-P1D', 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
