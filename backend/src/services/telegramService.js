const ALARM_TYPE_LABELS = {
  hard_impact: 'Sert Darbe',
  fall_suspected: 'Düşme Şüphesi',
  danger_zone_entry: 'Tehlikeli Bölgeye Giriş',
  inactivity: 'Hareketsizlik',
  high_noise: 'Yüksek Gürültü',
  network_lost: 'Ağ Bağlantısı Koptu',
  high_risk_score: 'Yüksek Risk Puanı',
};

const SEVERITY_LABELS = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
};

function isEnabled() {
  return process.env.TELEGRAM_ENABLED === 'true'
    && process.env.TELEGRAM_BOT_TOKEN
    && process.env.TELEGRAM_CHAT_ID;
}

function formatMessage(alarm) {
  const typeLabel = ALARM_TYPE_LABELS[alarm.alarmType] || alarm.alarmType;
  const severityLabel = SEVERITY_LABELS[alarm.severity] || alarm.severity;
  const deviceName = alarm.device?.deviceName || 'Bilinmeyen cihaz';
  const employee = alarm.device?.user?.fullName || 'Bilinmeyen çalışan';
  const time = new Date(alarm.createdAt).toLocaleString('tr-TR');

  return [
    '🚨 ISG Risk Alarmı',
    `Tip: ${typeLabel}`,
    `Cihaz: ${deviceName}`,
    `Çalışan: ${employee}`,
    `Risk: ${Math.round(alarm.riskScore)} | Önem: ${severityLabel}`,
    `Mesaj: ${alarm.message}`,
    `Zaman: ${time}`,
  ].join('\n');
}

async function sendTelegramAlert(alarm) {
  if (!isEnabled()) return;
  if (!['high', 'critical'].includes(alarm.severity)) return;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const text = formatMessage(alarm);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Telegram send failed:', res.status, body);
    }
  } catch (err) {
    console.error('Telegram send error:', err.message);
  }
}

module.exports = { sendTelegramAlert, isEnabled };
