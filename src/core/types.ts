// 所有資料的形狀都在這裡。金額單位一律是新台幣「元」，利率一律用小數（2.6% 寫成 0.026）。

/** 一份收入來源。interrupt 為真，代表壓力測試時假設這份收入會消失 */
export interface IncomeSource {
  id: string
  name: string
  annual: number
  interrupt: boolean
}

/** 資產分類。美股填美元，BTC 填顆數，其餘填新台幣 */
export type AssetKey = 'twStock' | 'twEtf' | 'usStock' | 'fund' | 'policy' | 'btc' | 'cash'

export interface Asset {
  key: AssetKey
  /** 美股＝美元、BTC＝顆數、其他＝新台幣 */
  amount: number
  /** 買房時要不要動用這筆 */
  use: boolean
  /** 動用比例，0～1。1＝全部動用 */
  ratio: number
}

export interface Rates {
  /** 1 美元 = 幾元台幣 */
  usdTwd: number
  /** 1 顆 BTC = 幾美元 */
  btcUsd: number
}

/** 存檔用英文代碼，畫面上的中文名稱在 src/lib/labels.ts */
export type LoanKind = 'mortgage' | 'personal'

export interface Loan {
  id: string
  name: string
  kind: LoanKind
  originalPrincipal: number
  /** 起始日，格式 YYYY-MM-DD；沒有就填 null */
  startDate: string | null
  termYears: number
  annualRate: number
  remainingPrincipal: number
  /** 已知月繳金時直接填，會蓋過自動計算；null＝自動算 */
  monthlyOverride: number | null
  /** 賣房後是否一次還清 */
  settleOnSale: boolean
  /** 提前還款違約金率 */
  penaltyRate: number
}

export interface Household {
  sources: IncomeSource[]
  /** 每天平均生活費 */
  dailyExpense: number
  /** 每年想存下的金額 */
  yearlySavings: number
  /** 購屋後至少保留幾個月生活費 */
  reserveMonths: number
  /** 壓力測試：標「假設中斷」的收入消失幾個月 */
  interruptMonths: number
  /** 現金可撐月數低於它＝高風險 */
  warnMonths: number
  /** 現金可撐月數高於它＝低風險 */
  safeMonths: number
}

export interface Seller {
  /** false＝不賣舊屋（第一次買房，或舊屋留著），賣屋相關數字全部不計 */
  enabled: boolean
  /** 每坪單價 */
  unitPrice: number
  ping: number
  feeRate: number
  /** 原買價；null＝沒填，房地合一稅以 0 計 */
  originalPrice: number | null
  /** 持有年數；null＝沒填 */
  holdingYears: number | null
  /** 設籍並居住滿 6 年，適用 400 萬免稅（簡化） */
  ownerOccupiedExempt: boolean
  landValueTax: number
  otherFees: number
}

export interface Buyer {
  price: number
  /** 貸款成數，0～1 */
  ltv: number
  annualRate: number
  termYears: number
  /** 寬限期年數，期間只繳利息 */
  graceYears: number
  feeRate: number
  renovation: number
  otherCosts: number
}

/** 使用者填的全部內容 */
export interface Scenario {
  household: Household
  assets: Asset[]
  rates: Rates
  loans: Loan[]
  seller: Seller
  buyer: Buyer
}

export type Verdict = '可行' | '有條件可行' | '不可行'
export type CashCheck = '通過' | '不足'
export type AnnualCheck = '通過' | '儲蓄不足' | '耗用現金' | '超出預算'
export type RunwayRating = '不耗用現金' | '低風險' | '需留意' | '高風險'

/** 逐月推演的一列 */
export interface MonthRow {
  month: number
  income: number
  living: number
  newMortgage: number
  retained: number
  net: number
  /** 這個月底的累計現金 */
  cash: number
}

export interface LoanResult {
  id: string
  /** 月繳金（自動算或手動填） */
  monthly: number
  /** 還剩幾個月；null＝算不出來，視為一直繳 */
  remainingMonths: number | null
  /** 賣房後一次還清要出的現金（含違約金） */
  payoffCash: number
  penalty: number
  /** 依起始日推算的剩餘本金，用來提醒填寫是否差太多；沒資料時為 null */
  estimatedPrincipal: number | null
  /** 需要提醒使用者的話；沒問題為空字串 */
  note: string
}

export interface Runway {
  /** 每年是否會動用現金 */
  burnsCash: boolean
  /** 現金可撐幾個月；null＝撐過整個推演期間 */
  months: number | null
  rating: RunwayRating
  /** 第幾個月起每月收支轉正；null＝推演期間內都沒有 */
  firstPositiveMonth: number | null
  /** 推演期間累計現金的最低點 */
  lowestCash: number
  /** 不考慮貸款到期的可撐月數 */
  monthsIgnoringPayoff: number | null
}

export interface StressTest {
  monthlyIncome: number
  monthlyExpense: number
  monthlyGap: number
  /** 購後現金能撐幾個月；null＝缺口為 0，不受影響 */
  months: number | null
  passed: boolean
}

export interface Evaluation {
  assetsTotal: number
  usableAssets: number
  unusedAssets: number
  salePrice: number
  sellerFee: number
  capitalGainsTax: number
  loans: LoanResult[]
  payoffTotal: number
  retainedMonthly: number
  retainedPrincipal: number
  /** 現有貸款的本金合計 */
  debtTotal: number
  loanAmount: number
  graceMonthly: number
  monthlyPayment: number
  downPayment: number
  buyerFee: number
  cashNeeded: number
  availableCash: number
  remainingCash: number
  reserve: number
  cashAfterReserve: number
  annualIncome: number
  annualLiving: number
  annualBudget: number
  annualPayment: number
  budgetSlack: number
  annualNetCashflow: number
  monthlyOutflow: number
  cashCheck: CashCheck
  annualCheck: AnnualCheck
  verdict: Verdict
  runway: Runway
  stress: StressTest
  netWorthBefore: number
  netWorthAfter: number
  schedule: MonthRow[]
}
