import type { ReportLanguage } from '@/hooks/useReport'

/**
 * Report wording in each language. A report is read by the client, in the
 * language the agency chose for it — not the agency's own interface language —
 * so these live apart from the app's translations.
 *
 * Thai, Burmese and Lao are worth a native reader's check before real use.
 */
export interface ReportTerms {
  title: string
  client: string
  preparedBy: string
  summary: string
  keyFigures: string
  comparedWith: (period: string) => string
  metric: Record<string, string>
  from: (n: string) => string
  tooSmall: string
  aboutSame: string
  noPrevious: string
  notCollected: string
  posting: string
  postsPublished: string
  previousMonth: string
  longestGap: string
  days: (n: number) => string
  dailyViews: string
  topPosts: string
  post: string
  platform: string
  published: string
  views: string
  noPosts: string
  noData: string
  source: string
}

export const REPORT_TERMS: Record<ReportLanguage, ReportTerms> = {
  en: {
    title: 'Social media report',
    client: 'Client',
    preparedBy: 'Prepared by',
    summary: 'Summary',
    keyFigures: 'Key figures',
    comparedWith: (p) => `Compared with ${p}`,
    metric: {
      page_media_view: 'Views',
      page_total_media_view_unique: 'People reached',
      page_post_engagements: 'Engagement',
      page_follows: 'Followers',
    },
    from: (n) => `from ${n}`,
    tooSmall: 'too small to compare',
    aboutSame: 'About the same',
    noPrevious: 'No data for the previous month',
    notCollected: 'Not collected',
    posting: 'Posting',
    postsPublished: 'Posts published',
    previousMonth: 'previous month',
    longestGap: 'Longest gap without a post',
    days: (n) => `${n} ${n === 1 ? 'day' : 'days'}`,
    dailyViews: 'Daily views',
    topPosts: 'Top posts',
    post: 'Post',
    platform: 'Platform',
    published: 'Published',
    views: 'Views',
    noPosts: 'No posts were published this month.',
    noData: 'No figures have been collected for this month.',
    source: 'Figures from Meta, collected by Movio.',
  },
  th: {
    title: 'รายงานผลโซเชียลมีเดีย',
    client: 'ลูกค้า',
    preparedBy: 'จัดทำโดย',
    summary: 'สรุปผล',
    keyFigures: 'ตัวเลขสำคัญ',
    comparedWith: (p) => `เทียบกับ${p}`,
    metric: {
      page_media_view: 'ยอดการดู',
      page_total_media_view_unique: 'จำนวนคนที่เข้าถึง',
      page_post_engagements: 'การมีส่วนร่วม',
      page_follows: 'ผู้ติดตาม',
    },
    from: (n) => `จาก ${n}`,
    tooSmall: 'ตัวเลขน้อยเกินกว่าจะเปรียบเทียบ',
    aboutSame: 'ใกล้เคียงเดิม',
    noPrevious: 'ไม่มีข้อมูลของเดือนก่อน',
    notCollected: 'ยังไม่มีข้อมูล',
    posting: 'การโพสต์',
    postsPublished: 'จำนวนโพสต์',
    previousMonth: 'เดือนก่อน',
    longestGap: 'ช่วงที่ไม่มีโพสต์นานที่สุด',
    days: (n) => `${n} วัน`,
    dailyViews: 'ยอดการดูรายวัน',
    topPosts: 'โพสต์ยอดนิยม',
    post: 'โพสต์',
    platform: 'แพลตฟอร์ม',
    published: 'วันที่โพสต์',
    views: 'ยอดการดู',
    noPosts: 'เดือนนี้ไม่มีการโพสต์',
    noData: 'ยังไม่มีข้อมูลสำหรับเดือนนี้',
    source: 'ข้อมูลจาก Meta รวบรวมโดย Movio',
  },
  my: {
    title: 'ဆိုရှယ်မီဒီယာ အစီရင်ခံစာ',
    client: 'ဖောက်သည်',
    preparedBy: 'ပြင်ဆင်သူ',
    summary: 'အနှစ်ချုပ်',
    keyFigures: 'အဓိက ကိန်းဂဏန်းများ',
    comparedWith: (p) => `${p}နှင့် နှိုင်းယှဉ်ထားသည်`,
    metric: {
      page_media_view: 'ကြည့်ရှုမှု',
      page_total_media_view_unique: 'ရောက်ရှိသူ',
      page_post_engagements: 'ပါဝင်ဆောင်ရွက်မှု',
      page_follows: 'ဖော်လိုဝါ',
    },
    from: (n) => `${n} မှ`,
    tooSmall: 'နှိုင်းယှဉ်ရန် နည်းလွန်းသည်',
    aboutSame: 'ယခင်အတိုင်း နီးပါး',
    noPrevious: 'ယခင်လအတွက် ဒေတာမရှိ',
    notCollected: 'ဒေတာမရှိသေး',
    posting: 'ပို့စ်တင်ခြင်း',
    postsPublished: 'တင်ခဲ့သော ပို့စ်',
    previousMonth: 'ယခင်လ',
    longestGap: 'ပို့စ်မတင်ခဲ့သည့် အရှည်ဆုံးကာလ',
    days: (n) => `${n} ရက်`,
    dailyViews: 'နေ့စဉ် ကြည့်ရှုမှု',
    topPosts: 'ထိပ်တန်း ပို့စ်များ',
    post: 'ပို့စ်',
    platform: 'ပလက်ဖောင်း',
    published: 'တင်သည့်ရက်',
    views: 'ကြည့်ရှုမှု',
    noPosts: 'ဤလတွင် ပို့စ်မတင်ခဲ့ပါ။',
    noData: 'ဤလအတွက် ဒေတာ မစုဆောင်းရသေးပါ။',
    source: 'Meta မှ ကိန်းဂဏန်းများ၊ Movio မှ စုစည်းထားသည်။',
  },
  lo: {
    title: 'ລາຍງານສື່ສັງຄົມ',
    client: 'ລູກຄ້າ',
    preparedBy: 'ຈັດທຳໂດຍ',
    summary: 'ສະຫຼຸບ',
    keyFigures: 'ຕົວເລກສຳຄັນ',
    comparedWith: (p) => `ທຽບກັບ${p}`,
    metric: {
      page_media_view: 'ຍອດເບິ່ງ',
      page_total_media_view_unique: 'ຈຳນວນຄົນທີ່ເຂົ້າເຖິງ',
      page_post_engagements: 'ການມີສ່ວນຮ່ວມ',
      page_follows: 'ຜູ້ຕິດຕາມ',
    },
    from: (n) => `ຈາກ ${n}`,
    tooSmall: 'ຕົວເລກໜ້ອຍເກີນໄປທີ່ຈະປຽບທຽບ',
    aboutSame: 'ໃກ້ຄຽງເດີມ',
    noPrevious: 'ບໍ່ມີຂໍ້ມູນຂອງເດືອນກ່ອນ',
    notCollected: 'ຍັງບໍ່ມີຂໍ້ມູນ',
    posting: 'ການໂພສ',
    postsPublished: 'ຈຳນວນໂພສ',
    previousMonth: 'ເດືອນກ່ອນ',
    longestGap: 'ໄລຍະທີ່ບໍ່ມີໂພສດົນທີ່ສຸດ',
    days: (n) => `${n} ມື້`,
    dailyViews: 'ຍອດເບິ່ງລາຍວັນ',
    topPosts: 'ໂພສຍອດນິຍົມ',
    post: 'ໂພສ',
    platform: 'ແພລດຟອມ',
    published: 'ວັນທີໂພສ',
    views: 'ຍອດເບິ່ງ',
    noPosts: 'ເດືອນນີ້ບໍ່ມີການໂພສ',
    noData: 'ຍັງບໍ່ມີຂໍ້ມູນສຳລັບເດືອນນີ້',
    source: 'ຂໍ້ມູນຈາກ Meta ລວບລວມໂດຍ Movio',
  },
}

/**
 * Date locale for each language. Western digits everywhere, matching the
 * summary; Thai keeps the Buddhist year, as Thai business documents do.
 */
export const DATE_LOCALE: Record<ReportLanguage, string> = {
  en: 'en-GB',
  th: 'th-TH-u-nu-latn',
  my: 'my-MM-u-nu-latn',
  lo: 'lo-LA-u-nu-latn',
}