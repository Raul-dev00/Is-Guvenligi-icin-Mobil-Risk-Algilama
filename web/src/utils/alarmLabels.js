export const ALARM_TYPE_LABELS = {
  hard_impact: 'Sert Darbe',
  fall_suspected: 'Düşme Şüphesi',
  danger_zone_entry: 'Tehlikeli Bölgeye Giriş',
  inactivity: 'Hareketsizlik',
  high_noise: 'Yüksek Gürültü',
  network_lost: 'Ağ Bağlantısı Koptu',
  high_risk_score: 'Yüksek Risk Puanı',
};

export const SEVERITY_LABELS = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
};

export function getAlarmTypeLabel(type) {
  return ALARM_TYPE_LABELS[type] || type;
}

export function getSeverityLabel(severity) {
  return SEVERITY_LABELS[severity] || severity;
}
