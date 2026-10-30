/**
 * Контакты сети «Бункер».
 *
 * Сообщества сети, общий режим работы и телефон предоставлены владелицей
 * (24–26.10.2026). TODO(данные владельца): почта сети — заглушка,
 * заменить по списку docs/NEEDS-DATA.md перед публикацией.
 */
export const bunkerContacts = {
  // Единый телефон сети (подтверждён владелицей 26.10.2026).
  phone: "+7 (8452) 99-15-59",
  phoneHref: "tel:+78452991559",
  // TODO: электронная почта
  email: "info@bunker.example",
  vk: "https://vk.ru/bunker_vape",
  telegram: "https://t.me/bunker_store",
  instagram: "https://www.instagram.com/bunker_srtv/",
  // Общий режим работы всех точек сети.
  hours: "Ежедневно, 8:00–01:00",
};

/**
 * Комиссионный сервис сети — Vape Express: сообщества ВКонтакте и Telegram
 * (предоставлено владелицей 24.10 и 31.10.2026) и список услуг. Блок
 * выводится на странице контактов и в разделе «Б/у устройства» (/used);
 * условия оказания услуг — в сообществах, сайт только справочник.
 */
export const vapeExpress = {
  name: "Vape Express",
  vk: "https://vk.ru/vape.express",
  telegram: "https://t.me/VapeExpress",
  services: ["Трейд-ин", "Срочный выкуп", "Продажа б/у", "Ремонт устройств"],
} as const;
