// Minimal PromptPay EMV payload generator (phone number only), CRC16-CCITT included.
// Note: This is a simplified implementation for generating payload; we return just the payload string.

function toDigitsOnly(input: string) {
  return (input || "").replace(/\D+/g, "")
}

// CRC16-CCITT (0x1021) per EMVCo spec
function crc16ccitt(str: string) {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021
      else crc <<= 1
      crc &= 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

function tlv(id: string, value: string) {
  const len = value.length.toString().padStart(2, "0")
  return `${id}${len}${value}`
}

// Normalize Thai PromptPay phone number to EMV proxy format (0066 + no leading 0)
function normalizePhoneForPromptPay(phone: string) {
  const digits = toDigitsOnly(phone)
  if (!digits) return ""
  // If already starts with 0066
  if (digits.startsWith("0066")) return digits
  // If starts with 66, prefix 00
  if (digits.startsWith("66")) return "00" + digits
  // If starts with 0 (Thai mobile), replace leading 0 with 0066
  if (digits.startsWith("0")) return "0066" + digits.slice(1)
  // Fallback: assume raw national without leading 0 -> prefix 0066
  return "0066" + digits
}

export function buildPromptPayPayload(phone: string, amount?: number) {
  const proxyDigits = normalizePhoneForPromptPay(phone)
  if (!proxyDigits) throw new Error("Invalid PromptPay phone")

  // GUID for PromptPay (Merchant Presented Mode) "A000000677010111"
  const guid = tlv("00", "A000000677010111")
  const proxy = tlv("01", proxyDigits)
  const merchantInfo = tlv("29", guid + proxy)

  const payloadFormat = tlv("00", "01")
  // 11 = static, 12 = dynamic (amount-specific). Use dynamic when amount provided.
  const method = tlv("01", amount != null ? "12" : "11")
  const merchantCategory = tlv("52", "0000")
  const currency = tlv("53", "764")
  const amountTlv = amount != null ? tlv("54", amount.toFixed(2)) : ""
  const countryCode = tlv("58", "TH")

  // CRC placeholder
  const crcId = "63"
  const crcLen = "04"
  const base = payloadFormat + method + merchantInfo + merchantCategory + currency + amountTlv + countryCode + crcId + crcLen
  const crc = crc16ccitt(base)
  return base + crc
}
