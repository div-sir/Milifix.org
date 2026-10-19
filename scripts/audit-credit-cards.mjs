// 匯出 CMS 上所有信用卡的權益清單，供逐張對照官網核對（唯讀，只用公開 API）。
// 用法：CMS_URL=https://milifix-cms.onrender.com node scripts/audit-credit-cards.mjs > card-audit.md
const CMS = process.env.CMS_URL ?? 'https://milifix-cms.onrender.com'

const res = await fetch(`${CMS}/api/credit-cards?limit=200&depth=0&sort=bank,name`)
if (!res.ok) { console.error(`CMS 回應 ${res.status}`); process.exit(1) }
const { docs } = await res.json()

const fee = (n) => (n ? `NT$${n.toLocaleString('en-US')}` : '免年費')

console.log(`# 信用卡權益核對清單（${docs.length} 張，匯出於 ${new Date().toISOString().slice(0, 10)}）\n`)
for (const c of docs) {
  console.log(`## ${c.name}（\`${c.slug}\`）`)
  console.log(`- 銀行：${c.bank}｜卡組織：${c.cardNetwork}｜年費：${fee(c.annualFee)}${c.annualFeeNote ? `（${c.annualFeeNote}）` : ''}`)
  console.log(`- 官網：${c.officialUrl ?? '（未填）'}｜最後核對：${c.lastVerifiedAt?.slice(0, 10) ?? '（未填）'}`)
  for (const b of c.benefits ?? []) {
    const cond = b.conditions ? `［條件：${b.conditions}］` : ''
    console.log(`- [ ] **${b.benefitType}**：${b.title}${cond}`)
  }
  console.log('')
}
