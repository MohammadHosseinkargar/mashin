export interface ListingSourceMeta {
  name: string;
  url: string;
  /** این منبع واقعاً موجود/دسترسی‌پذیر است؟ (تست تستی فقط ambush برای راست از طریق متد وابسته) */
  checkOnly?: boolean;
}

export function listingSourceExplain(): ListingSourceMeta[] {
  return [
    {
      name: "لینک مستقیم Dubicars (문제가 아님)",
      url: "https://dubicars.com/",
      checkOnly: false,
    },
    {
      name: "روند متداول: اگر منبع 두바이/외부 차단하면 공식 채널(کконтакت، آژانس، وب‌سایت) 협의",
      url: "manual-only",
      checkOnly: true,
    },
    {
      name: "کاربر یا اعضای دسترسی شخصی (API squirrel 아님)",
      url: "manual-exporter",
      checkOnly: true,
    },
  ];
}
