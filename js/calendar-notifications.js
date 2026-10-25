import { playNotificationChime, speakText } from './voice-audio.js';

let firedMinutes = new Set();

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (_) {
    return 'denied';
  }
}

export function triggerSmartNotification(title, body, lang = 'en', voiceEnabled = true, onToast = null) {
  playNotificationChime();
  if (onToast) {
    onToast(`🔔 ${title}: ${body}`);
  }
  speakText(`${title}. ${body}`, lang, voiceEnabled);

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            tag: 'better-me-reminder',
            renotify: true
          });
        }).catch(() => {
          new Notification(title, { body });
        });
      } else {
        new Notification(title, { body });
      }
    } catch (_) {}
  }
}

export function startScheduleWatcher(getState, onToast) {
  setInterval(() => {
    const state = getState();
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const currentHm = `${hh}:${mm}`;
    const dayKey = `${now.toDateString()}_${currentHm}`;

    if (firedMinutes.has(dayKey)) return;

    const matchingEvents = (state.events || []).filter((ev) => ev.time === currentHm);
    if (matchingEvents.length > 0) {
      firedMinutes.add(dayKey);
      matchingEvents.forEach((ev) => {
        const eventTitle = typeof ev.title === 'object' ? (ev.title[state.lang] || ev.title.en) : ev.title;
        const header =
          state.lang === 'ar'
            ? `حان موعد عادتك يا ${state.user.name}!`
            : `Time for your habit, ${state.user.name}!`;
        triggerSmartNotification(header, eventTitle, state.lang, state.voiceEnabled, onToast);
      });
    }
  }, 15000);
}

export function getGoogleCalendarUrl(event, lang = 'en') {
  const title = typeof event.title === 'object' ? (event.title[lang] || event.title.en) : event.title;
  const [hours, minutes] = (event.time || '09:00').split(':').map(Number);

  const start = new Date();
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + 30 * 60000);

  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const details =
    lang === 'ar'
      ? 'تذكير من تطبيق نواة (Nawwa) - ازرع نواتك اليوم ولو بخطوة برونزية لمدة دقيقتين!'
      : 'Scheduled via Nawwa (نواة) App — Plant your 2-minute Bronze seed today!';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Nawwa | نواة: ${title}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcsFile(events, lang = 'en') {
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  let icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nawwa//Habit & Life Coach//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events.forEach((ev) => {
    const title = typeof ev.title === 'object' ? (ev.title[lang] || ev.title.en) : ev.title;
    const [hours, minutes] = (ev.time || '09:00').split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + 30 * 60000);

    const fmtLocal = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${y}${m}${day}T${h}${min}00`;
    };

    icsLines.push(
      'BEGIN:VEVENT',
      `UID:${ev.id}@nawwa.app`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART:${fmtLocal(start)}`,
      `DTEND:${fmtLocal(end)}`,
      'RRULE:FREQ=DAILY',
      `SUMMARY:Nawwa | نواة - ${title}`,
      'DESCRIPTION:Plant a 2-minute Bronze seed to keep your momentum alive!',
      'BEGIN:VALARM',
      'TRIGGER:-PT5M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${title}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  icsLines.push('END:VCALENDAR');

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nawwa-schedule.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
