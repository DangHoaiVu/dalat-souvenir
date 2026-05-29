import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createAdminSupabaseClient } from "@/lib/supabaseClient";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatProduct = {
  product_id?: string | null;
  name: string | null;
  price: number | string | null;
  promoted_price?: number | string | null;
  stock?: number | null;
  unit?: string | null;
  description?: string | null;
  category_id?: string | null;
};
type ChatCategory = { category_id: string; name: string };
type ChatPromotion = {
  promotion_id?: string | null;
  name: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  fixed_price?: number | string | null;
};

// ═══════════════════════════════════════════
// Utility functions
// ═══════════════════════════════════════════

function isChatMessage(v: unknown): v is ChatMessage {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (o.role === "user" || o.role === "assistant") && typeof o.content === "string" && o.content.trim().length > 0;
}

function toNumber(v: number | string | null | undefined) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") { const n = Number(v.replace(/[^\d.-]/g, "")); return Number.isFinite(n) ? n : 0; }
  return 0;
}

function formatVnd(v: number) { return `${new Intl.NumberFormat("vi-VN").format(Math.round(v))}đ`; }

function getProductPrice(p: ChatProduct) {
  const pp = toNumber(p.promoted_price);
  return pp > 0 ? pp : toNumber(p.price);
}

function formatProductLine(p: ChatProduct) {
  const price = getProductPrice(p);
  const unit = p.unit ? `/${p.unit}` : "";
  const stock = typeof p.stock === "number" ? `, còn ${p.stock}` : "";
  return `- **${p.name}**: **${formatVnd(price)}${unit}**${stock}`;
}

function formatProductDetail(p: ChatProduct) {
  const price = getProductPrice(p);
  const promo = toNumber(p.promoted_price);
  const promoText = promo > 0 ? ` ~~${formatVnd(toNumber(p.price))}~~ → **${formatVnd(promo)}** (đang ưu đãi!)` : `**${formatVnd(price)}**`;
  return [
    `**${p.name}**`,
    `- Giá: ${promoText}`,
    `- Đơn vị: ${p.unit || "Cái/Hộp"}`,
    typeof p.stock === "number" ? `- Tồn kho: ${p.stock} sản phẩm` : null,
    p.description ? `- Mô tả: ${p.description}` : null,
  ].filter(Boolean).join("\n");
}

// Vietnamese text normalization: remove diacritics for fuzzy matching
function normalize(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ").trim();
}

const STOP_WORDS = new Set([
  "co", "khong", "nao", "gia", "san", "pham", "shop", "bao", "nhieu", "mua",
  "cho", "tui", "toi", "minh", "muon", "can", "tim", "gi", "duoc", "cua",
  "la", "va", "thi", "ma", "cai", "con", "mot", "nhung", "nhu", "voi",
  "em", "anh", "chi", "ban", "hay", "rat", "lam", "nhe", "ne", "ah", "a",
  "o", "day", "dau", "sao", "the", "nay", "do", "roi", "biet", "xin",
  "da", "dang", "se", "cung", "nua", "hon", "nhat", "qua", "het",
  "duoi", "tren", "tu", "den", "trong", "ngoai", "ve", "tai",
  "vay", "voi", "bao", "luc", "khi", "gio", "hom", "nay",
]);

function extractKeywords(text: string): string[] {
  return normalize(text).split(/\s+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w));
}

function productMatchScore(p: ChatProduct, keywords: string[]): number {
  const name = normalize(p.name || "");
  const desc = normalize(p.description || "");
  let score = 0;
  for (const kw of keywords) {
    if (name.includes(kw)) score += 3;
    if (desc.includes(kw)) score += 1;
  }
  return score;
}

// ═══════════════════════════════════════════
// Category & Tag mapping for smart search
// ═══════════════════════════════════════════

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Đặc sản Đà Lạt": ["dac san", "an", "uong", "tra", "ca phe", "mut", "banh", "hong", "dau", "thuc pham", "do an", "ngon", "say", "keo", "che"],
  "Đồ len & phụ kiện": ["len", "khan", "mu", "gang", "ao", "tui", "bang do", "phu kien", "am", "lanh", "thoi trang"],
  "Đồ lưu niệm handmade": ["luu niem", "moc khoa", "nam cham", "so tay", "chuong gio", "thiep", "vi", "handmade", "thu cong"],
  "Nến thơm & decor": ["nen", "thom", "decor", "trang tri", "hoa", "den", "khung anh", "binh", "phong", "nha", "vintage"],
  "Quà tặng Đà Lạt": ["qua", "tang", "set", "combo", "hop", "gau", "sticker", "ly", "tote", "canvas"],
};

const RECIPIENT_KEYWORDS: Record<string, string[]> = {
  "người lớn tuổi": ["ba", "me", "ong", "ba", "nguoi lon", "phu huynh", "gia dinh", "bac", "co", "chu"],
  "bạn bè": ["ban", "ban be", "ban than", "homie", "bestie"],
  "người yêu": ["nguoi yeu", "vo", "chong", "crush", "nua kia", "gau", "valentine"],
  "trẻ em": ["tre em", "em be", "be", "con nit", "tre nho", "thieu nhi", "nhi"],
  "đồng nghiệp": ["dong nghiep", "sep", "co quan", "van phong"],
};

function findCategoryProducts(products: ChatProduct[], categoryMap: Map<string, string>, categoryName: string): ChatProduct[] {
  const catIds = new Set<string>();
  for (const [id, name] of categoryMap) {
    if (normalize(name).includes(normalize(categoryName))) catIds.add(id);
  }
  return products.filter(p => p.category_id && catIds.has(p.category_id));
}

function searchProductsByKeywords(products: ChatProduct[], keywords: string[]): ChatProduct[] {
  return products
    .map(p => ({ product: p, score: productMatchScore(p, keywords) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.product);
}

// ═══════════════════════════════════════════
// Price parsing
// ═══════════════════════════════════════════

function parsePrice(numStr: string, unitStr?: string): number {
  let price = toNumber(numStr);
  const unit = (unitStr || "").toLowerCase();
  if (unit === "k" || unit === "ngan" || unit === "nghin" || unit === "ngàn" || unit === "nghìn") price *= 1000;
  else if (unit === "trieu" || unit === "triệu") price *= 1000000;
  else if (price > 0 && price < 1000) price *= 1000;
  return price;
}

// ═══════════════════════════════════════════
// Intent detection
// ═══════════════════════════════════════════

type Intent =
  | "greeting" | "thanks" | "goodbye"
  | "contact" | "payment" | "shipping" | "order_process" | "return_policy"
  | "promotion" | "price_above" | "price_below" | "price_around" | "price_range"
  | "cheapest" | "most_expensive" | "best_seller"
  | "category_search" | "product_search" | "product_detail"
  | "health_food" | "gift_recommend" | "gift_for_recipient"
  | "about_shop" | "hours" | "general_question" | "unknown";

function detectIntent(msg: string, norm: string): Intent {
  // Greeting
  if (/^(chào|hello|hi|xin chào|hey|alo|chào em|chào bé|chào shop|yo)\b/i.test(msg)) return "greeting";
  if (/^(cảm ơn|cám ơn|thanks|thank you|tks|cảm ơn em|cảm ơn bé)/i.test(msg)) return "thanks";
  if (/^(bye|tạm biệt|hẹn gặp|bái bai|bb)/i.test(msg)) return "goodbye";

  // Price queries
  if (/(?:từ\s*)?(\d[\d.,]*)\s*(k|ngàn|nghìn|triệu)?\s*(?:đến|tới|[-–])\s*(\d[\d.,]*)\s*(k|ngàn|nghìn|triệu|đ|vnd)?/i.test(msg)) return "price_range";
  if (/(trên|hơn|cao hơn|lớn hơn|>=?)\s*\d/i.test(msg) && !/dưới|thấp/i.test(msg)) return "price_above";
  if (/(dưới|thấp hơn|nhỏ hơn|rẻ hơn|<=?|không quá)\s*\d/i.test(msg)) return "price_below";
  if (/(khoảng|tầm|chừng|cỡ)\s*\d/i.test(msg)) return "price_around";
  if (/(rẻ nhất|thấp nhất|giá thấp|ít tiền nhất)/i.test(msg)) return "cheapest";
  if (/(đắt nhất|cao nhất|giá cao|mắc nhất|premium)/i.test(msg)) return "most_expensive";
  if (/(bán chạy|phổ biến|hot|best seller|nổi bật|được mua nhiều)/i.test(msg)) return "best_seller";

  // Shop info
  if (/(liên hệ|địa chỉ|ở đâu|s[đd]t|số điện thoại|điện thoại|hotline|instagram|email|facebook|zalo)/i.test(msg)) return "contact";
  if (/(thanh toán|chuyển khoản|cod|tiền mặt|payment|trả tiền|momo|vnpay)/i.test(msg)) return "payment";
  if (/(giao hàng|ship|vận chuyển|phí ship|phí giao|bao lâu|mấy ngày)/i.test(msg) && /(giao|ship|vận)/i.test(msg)) return "shipping";
  if (/(đặt hàng|đơn hàng|giỏ hàng|hủy đơn|lịch sử|cách mua|mua hàng|order)/i.test(msg)) return "order_process";
  if (/(đổi trả|trả hàng|hoàn tiền|bảo hành|khiếu nại)/i.test(msg)) return "return_policy";
  if (/(mấy giờ|giờ mở|giờ làm|giờ hoạt động|bao giờ đóng|khi nào mở)/i.test(msg)) return "hours";
  if (/(khuyến mãi|giảm giá|sale|ưu đãi|voucher|mã giảm|flash sale|deal)/i.test(msg)) return "promotion";
  if (/(shop|cửa hàng|về shop|giới thiệu|câu chuyện|thương hiệu|brand)/i.test(msg) && /(gì|nào|giới thiệu|về|là)/i.test(msg)) return "about_shop";

  // Product queries
  if (/(ăn được|uống được|đồ ăn|đồ uống|ngon|sức khỏe|healthy|tốt cho|bổ dưỡng|dinh dưỡng|vitamin)/i.test(msg)) return "health_food";
  if (/(quà cho|tặng cho|mua cho|biếu|quà biếu)/i.test(msg)) return "gift_for_recipient";
  if (/(quà|quà tặng|gợi ý quà|tư vấn quà|set quà|combo)/i.test(msg)) return "gift_recommend";

  // Category search by keyword
  for (const [, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => norm.includes(kw))) return "category_search";
  }

  // General product search
  if (/(sản phẩm|giá|bao nhiêu|tư vấn|gợi ý|mua gì|món nào|có gì|bán gì|danh sách)/i.test(msg)) return "product_search";

  // Check if any product name mentioned
  return "unknown";
}

// ═══════════════════════════════════════════
// Build Gemini system instruction
// ═══════════════════════════════════════════

function buildProductsContext(products: ChatProduct[], categoryMap: Map<string, string>) {
  if (products.length === 0) return "Hiện chưa lấy được dữ liệu sản phẩm.";
  return products.map(p => {
    const cat = p.category_id ? categoryMap.get(p.category_id) || "Khác" : "Khác";
    const pp = toNumber(p.promoted_price);
    const priceText = pp > 0
      ? `${formatVnd(pp)} (giá gốc ${formatVnd(toNumber(p.price))}, đang khuyến mãi)`
      : formatVnd(toNumber(p.price));
    return `• ${p.name} | ${cat} | ${priceText} | ${p.unit || "Cái"} | Kho: ${p.stock ?? "?"} | ${p.description || ""}`;
  }).join("\n");
}

function buildPromotionsContext(promotions: ChatPromotion[]) {
  if (promotions.length === 0) return "Không có.";
  return promotions.map(p => {
    const fp = toNumber(p.fixed_price);
    return `• ${p.name}${fp > 0 ? ` (đồng giá ${formatVnd(fp)})` : ""} | ${p.description || ""} | ${p.start_date || "?"} → ${p.end_date || "?"}`;
  }).join("\n");
}

function buildSystemInstruction(productsCtx: string, promotionsCtx: string) {
  return `Bạn là "Bé" 🐾 — trợ lý AI thông minh nhất của shop "Đà Lạt Souvenir", chuyên bán đặc sản & quà lưu niệm Đà Lạt.

🎯 NHIỆM VỤ CỐT LÕI: Trả lời ĐÚNG, CHÍNH XÁC mọi câu hỏi. Bạn là AI đa năng:
• Câu hỏi về shop/sản phẩm → dùng dữ liệu thật bên dưới
• Câu hỏi ngoài shop (toán, khoa học, lịch sử, đời sống, sức khỏe, nấu ăn, du lịch, tâm lý, code, ...) → trả lời như Google Gemini thông minh nhất, rồi nếu phù hợp thì gợi ý nhẹ sản phẩm shop

📌 THÔNG TIN SHOP:
• Tên: Đà Lạt Souvenir | Địa chỉ: TP. Qui Nhơn, Bình Định (shop online, hàng tuyển từ Đà Lạt)
• Hotline: 0979.777.777 | Email: danghoaivu2004@gmail.com | IG: @lovehoaivulover
• Giờ nhân viên: 8:00-22:00 | Chat AI: 24/7
• Thanh toán: COD hoặc chuyển khoản | Giao hàng: toàn quốc
• Website: Xem/tìm sản phẩm, đăng nhập Google/email, giỏ hàng, đặt hàng, xem đơn, hủy đơn (khi trạng thái cho phép)
• Chatbot chỉ tư vấn, không thao tác đặt/hủy đơn

📦 SẢN PHẨM (${productsCtx.split("\n").length} sản phẩm):
${productsCtx}

🏷️ KHUYẾN MÃI:
${promotionsCtx}

⚖️ QUY TẮC BẮT BUỘC:
1. Tiếng Việt, xưng "em/bé", gọi "anh/chị". Thân thiện, tự nhiên, dễ thương.
2. Sản phẩm/giá: CHỈ dùng dữ liệu trên. KHÔNG bịa. Nếu không có → nói rõ "shop chưa có".
3. Hỏi giá "trên X" → lọc sản phẩm ≥ X. "Dưới X" → ≤ X. "Khoảng X" → ±30%.
4. Hỏi "rẻ nhất" → sản phẩm giá thấp nhất. "Đắt nhất" → giá cao nhất.
5. Hỏi đồ ăn/uống/sức khỏe → gợi ý đặc sản (mứt, trà, cà phê, hồng, dâu, bánh).
6. Hỏi quà cho ai → gợi ý phù hợp đối tượng.
7. Hỏi ngoài shop → trả lời đầy đủ, thông minh, chính xác. Cuối cùng gợi ý nhẹ sản phẩm nếu liên quan.
8. Sức khỏe → tư vấn tham khảo, KHÔNG chẩn đoán. Ghi "chỉ mang tính tham khảo".
9. Format: markdown gọn, bullet points, chữ đậm. Không quá dài.
10. KHÔNG lặp câu trả lời. Đọc KỸ câu hỏi mới nhất.
11. Chào hỏi → nồng nhiệt, giới thiệu bản thân, hỏi cần gì.
12. Khi so sánh sản phẩm → liệt kê rõ giá, mô tả từng món.
13. Nếu khách hỏi mơ hồ → hỏi lại để hiểu rõ nhu cầu, ĐỪNG đoán bừa.`;
}

function buildGenaiContents(messages: ChatMessage[]) {
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user";
    if (contents.length === 0 && role === "model") continue;
    const prev = contents[contents.length - 1];
    if (prev?.role === role) prev.parts[0].text += `\n${m.content.trim()}`;
    else contents.push({ role, parts: [{ text: m.content.trim() }] });
  }
  return contents;
}

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
  ).trim();
}

// ═══════════════════════════════════════════
// Smart Fallback Responder
// ═══════════════════════════════════════════

function buildFallbackReply(
  messages: ChatMessage[],
  products: ChatProduct[],
  categoryMap: Map<string, string>,
  promotions: ChatPromotion[],
) {
  const raw = (messages[messages.length - 1]?.content || "").trim();
  const msg = raw.toLowerCase();
  const norm = normalize(raw);
  const intent = detectIntent(msg, norm);

  // ─── Greeting / Thanks / Bye ───
  if (intent === "greeting") {
    return "Dạ em chào anh/chị! 🌸 Bé là trợ lý ảo 24/7 của **Đà Lạt Souvenir**.\n\nEm có thể giúp anh/chị:\n- 🔍 Tìm sản phẩm theo giá, loại, nhu cầu\n- 🎁 Gợi ý quà tặng phù hợp\n- 📦 Hướng dẫn đặt hàng, thanh toán\n- 📞 Thông tin liên hệ shop\n- 💬 Trả lời câu hỏi chung\n\nHôm nay anh/chị cần bé hỗ trợ gì ạ?";
  }
  if (intent === "thanks") {
    return "Dạ không có gì ạ! 🥰 Bé rất vui được hỗ trợ anh/chị. Nếu cần gì thêm cứ nhắn bé nha!";
  }
  if (intent === "goodbye") {
    return "Dạ hẹn gặp lại anh/chị! 👋🌸 Chúc anh/chị một ngày thật vui. Khi nào cần tư vấn cứ quay lại nha!";
  }

  // ─── Contact ───
  if (intent === "contact") {
    return "Dạ đây là thông tin liên hệ **Đà Lạt Souvenir**:\n\n- 📞 Hotline: **0979.777.777**\n- 📧 Email: **danghoaivu2004@gmail.com**\n- 📍 Địa chỉ: **TP. Qui Nhơn, Bình Định**\n- 📸 Instagram: **@lovehoaivulover**\n- ⏰ Hỗ trợ: **8:00 - 22:00** (chat AI 24/7)";
  }

  // ─── Hours ───
  if (intent === "hours") {
    return "Dạ shop hoạt động như sau:\n\n- 🤖 **Chat AI**: Hỗ trợ **24/7**, bất kỳ lúc nào cũng sẵn sàng!\n- 👩‍💼 **Nhân viên**: **8:00 - 22:00** mỗi ngày\n- 📞 Hotline: **0979.777.777**";
  }

  // ─── Payment ───
  if (intent === "payment") {
    return "Dạ shop hỗ trợ **2 phương thức** thanh toán:\n\n- 💵 **COD**: Trả tiền mặt khi nhận hàng.\n- 🏦 **Chuyển khoản**: Shop xác nhận đơn → hướng dẫn chuyển khoản.\n\nAnh/chị chọn lúc xác nhận đặt hàng trên website ạ.";
  }

  // ─── Shipping ───
  if (intent === "shipping") {
    return "Dạ shop hỗ trợ **giao hàng toàn quốc** ạ!\n\n- ⏱️ Thời gian giao: **2-5 ngày** tùy khu vực\n- 💰 Phí ship: tùy đơn vị vận chuyển, hiển thị khi đặt hàng\n- 📦 Đóng gói cẩn thận, đặc biệt với đồ dễ vỡ\n\nAnh/chị có thể theo dõi đơn ở **Tài khoản > Đơn hàng** sau khi đặt ạ.";
  }

  // ─── Order process ───
  if (intent === "order_process") {
    return "Dạ quy trình mua hàng rất đơn giản:\n\n1. 🔍 Vào **Sản phẩm**, chọn món muốn mua\n2. 🛒 Nhấn **Thêm vào giỏ hàng**\n3. 📝 Vào giỏ hàng, kiểm tra và **Đặt hàng**\n4. 📍 Điền thông tin giao hàng, chọn **COD** hoặc **Chuyển khoản**\n5. ✅ Xem đơn ở **Tài khoản > Đơn hàng**\n\nCó thể hủy/cập nhật đơn khi trạng thái cho phép ạ.";
  }

  // ─── Return policy ───
  if (intent === "return_policy") {
    return "Dạ về chính sách đổi trả:\n\n- Nếu sản phẩm bị lỗi hoặc giao sai → anh/chị liên hệ shop qua **Hotline 0979.777.777** hoặc **Email danghoaivu2004@gmail.com** trong vòng 24h sau khi nhận hàng.\n- Shop sẽ hỗ trợ đổi hoặc hoàn tiền theo từng trường hợp cụ thể ạ.\n\n⚠️ *Lưu ý: Đặc sản thực phẩm (mứt, trà, cà phê...) cần kiểm tra kỹ khi nhận hàng.*";
  }

  // ─── About shop ───
  if (intent === "about_shop") {
    return "Dạ **Đà Lạt Souvenir** là shop online chuyên bán đặc sản và quà lưu niệm Đà Lạt tuyển chọn 🌸\n\n- 📍 Có trụ sở tại **TP. Qui Nhơn, Bình Định**\n- 🏔️ Sản phẩm được tuyển chọn trực tiếp từ **Đà Lạt**\n- 🎁 Gồm 5 nhóm: Đặc sản, Đồ len, Lưu niệm handmade, Nến thơm & decor, Quà tặng\n- 🚚 Giao hàng **toàn quốc**, thanh toán **COD** hoặc **chuyển khoản**\n\nAnh/chị có thể xem thêm tại mục **Câu chuyện thương hiệu** trên website ạ!";
  }

  // ─── Promotions ───
  if (intent === "promotion") {
    const active = promotions.filter(p => p.name);
    if (active.length > 0) {
      const lines = active.slice(0, 5).map(p => {
        const fp = toNumber(p.fixed_price);
        return `- **${p.name}**${fp > 0 ? ` — đồng giá ${formatVnd(fp)}` : ""}${p.description ? `: ${p.description}` : ""}`;
      });
      return `Dạ shop đang có chương trình khuyến mãi:\n\n${lines.join("\n")}\n\nAnh/chị xem chi tiết trên web ạ!`;
    }
    return "Dạ hiện shop chưa có khuyến mãi nào đang chạy ạ. Anh/chị theo dõi trang web hoặc hỏi bé lại sau nha! 🌸";
  }

  // ─── Price queries (with products) ───
  if (products.length > 0) {
    const priceRangeMatch = msg.match(/(?:từ\s*)?(\d[\d.,]*)\s*(k|ngàn|nghìn|triệu)?\s*(?:đến|tới|[-–])\s*(\d[\d.,]*)\s*(k|ngàn|nghìn|triệu|đ|vnd)?/i);
    const aboveMatch = msg.match(/(trên|hơn|cao hơn|lớn hơn|>=?)\s*(\d[\d.,]*)\s*(k|ngàn|nghìn|triệu|đ|vnd)?/i);
    const belowMatch = msg.match(/(dưới|thấp hơn|nhỏ hơn|rẻ hơn|<=?|không quá)\s*(\d[\d.,]*)\s*(k|ngàn|nghìn|triệu|đ|vnd)?/i);
    const aroundMatch = msg.match(/(khoảng|tầm|chừng|cỡ)\s*(\d[\d.,]*)\s*(k|ngàn|nghìn|triệu|đ|vnd)?/i);

    if (intent === "price_range" && priceRangeMatch) {
      const min = parsePrice(priceRangeMatch[1], priceRangeMatch[2]);
      const max = parsePrice(priceRangeMatch[3], priceRangeMatch[4]);
      const matches = products.filter(p => { const pr = getProductPrice(p); return pr >= min && pr <= max; })
        .sort((a, b) => getProductPrice(a) - getProductPrice(b));
      if (matches.length > 0) return `Dạ có **${matches.length} sản phẩm** giá từ **${formatVnd(min)}** đến **${formatVnd(max)}**:\n\n${matches.slice(0, 8).map(formatProductLine).join("\n")}\n\nAnh/chị ưng món nào ạ?`;
      return `Dạ hiện shop chưa có sản phẩm trong khoảng ${formatVnd(min)} - ${formatVnd(max)} ạ. Giá shop dao động từ 25.000đ - 350.000đ.`;
    }

    if (intent === "price_above" && aboveMatch) {
      const min = parsePrice(aboveMatch[2], aboveMatch[3]);
      const matches = products.filter(p => getProductPrice(p) >= min)
        .sort((a, b) => getProductPrice(b) - getProductPrice(a));
      if (matches.length > 0) return `Dạ có **${matches.length} sản phẩm** giá từ **${formatVnd(min)}** trở lên:\n\n${matches.slice(0, 8).map(formatProductLine).join("\n")}\n\nAnh/chị thích món nào ạ?`;
      return `Dạ hiện shop chưa có sản phẩm giá trên ${formatVnd(min)} ạ. Sản phẩm đắt nhất khoảng 350.000đ.`;
    }

    if (intent === "price_below" && belowMatch) {
      const max = parsePrice(belowMatch[2], belowMatch[3]);
      const matches = products.filter(p => getProductPrice(p) <= max)
        .sort((a, b) => getProductPrice(a) - getProductPrice(b));
      if (matches.length > 0) return `Dạ có **${matches.length} sản phẩm** giá dưới **${formatVnd(max)}**:\n\n${matches.slice(0, 8).map(formatProductLine).join("\n")}\n\nAnh/chị chọn món nào ạ?`;
      return `Dạ hiện shop chưa có sản phẩm dưới ${formatVnd(max)} ạ. Sản phẩm rẻ nhất khoảng 25.000đ.`;
    }

    if (intent === "price_around" && aroundMatch) {
      const target = parsePrice(aroundMatch[2], aroundMatch[3]);
      const margin = target * 0.35;
      const matches = products.filter(p => { const pr = getProductPrice(p); return pr >= target - margin && pr <= target + margin; })
        .sort((a, b) => Math.abs(getProductPrice(a) - target) - Math.abs(getProductPrice(b) - target));
      if (matches.length > 0) return `Dạ có **${matches.length} sản phẩm** giá khoảng **${formatVnd(target)}**:\n\n${matches.slice(0, 8).map(formatProductLine).join("\n")}\n\nAnh/chị ưng món nào ạ?`;
      return `Dạ hiện shop chưa có sản phẩm giá khoảng ${formatVnd(target)} ạ.`;
    }

    // ─── Cheapest / Most expensive ───
    if (intent === "cheapest") {
      const sorted = [...products].sort((a, b) => getProductPrice(a) - getProductPrice(b));
      return `Dạ sản phẩm **rẻ nhất** shop:\n\n${sorted.slice(0, 5).map(formatProductLine).join("\n")}\n\nAnh/chị muốn xem chi tiết món nào ạ?`;
    }
    if (intent === "most_expensive") {
      const sorted = [...products].sort((a, b) => getProductPrice(b) - getProductPrice(a));
      return `Dạ sản phẩm **giá cao nhất** shop:\n\n${sorted.slice(0, 5).map(formatProductLine).join("\n")}\n\nAnh/chị muốn xem chi tiết ạ?`;
    }
    if (intent === "best_seller") {
      const popular = [...products].sort((a, b) => (toNumber(b.stock) > 50 ? 1 : 0) - (toNumber(a.stock) > 50 ? 1 : 0) || getProductPrice(a) - getProductPrice(b));
      return `Dạ một số sản phẩm **nổi bật** của shop:\n\n${popular.slice(0, 6).map(formatProductLine).join("\n")}\n\nAnh/chị quan tâm món nào ạ?`;
    }

    // ─── Health / Food ───
    if (intent === "health_food") {
      const foodProducts = findCategoryProducts(products, categoryMap, "Đặc sản Đà Lạt");
      if (foodProducts.length > 0) {
        return `Dạ shop có các **đặc sản ăn/uống được**, tốt cho sức khỏe:\n\n${foodProducts.map(formatProductLine).join("\n")}\n\n💡 *Trà atiso thanh mát, hồng treo gió giàu vitamin, dâu tằm sấy nhiều chất chống oxy hóa. Đây là tham khảo, không phải tư vấn y tế.*\n\nAnh/chị muốn biết thêm về món nào ạ?`;
      }
    }

    // ─── Gift for recipient ───
    if (intent === "gift_for_recipient") {
      let recipientType = "";
      for (const [type, keywords] of Object.entries(RECIPIENT_KEYWORDS)) {
        if (keywords.some(kw => norm.includes(kw))) { recipientType = type; break; }
      }

      let suggestions: ChatProduct[] = [];
      let advice = "";

      if (recipientType.includes("lớn tuổi") || recipientType.includes("ba") || recipientType.includes("me")) {
        suggestions = findCategoryProducts(products, categoryMap, "Đặc sản");
        if (suggestions.length === 0) suggestions = products.filter(p => /(trà|hồng|mứt|set|hộp quà)/i.test(p.name || ""));
        advice = "Người lớn tuổi thường thích đặc sản thực phẩm: trà, hồng treo gió, set quà tổng hợp.";
      } else if (recipientType.includes("yêu")) {
        suggestions = products.filter(p => /(nến|hoa|khung|gấu|tote|ví|len)/i.test(p.name || ""));
        advice = "Tặng người yêu thì ưu tiên đồ tinh tế: nến thơm, hoa khô, gấu bông, phụ kiện len.";
      } else if (recipientType.includes("trẻ")) {
        suggestions = products.filter(p => /(sticker|gấu|sổ|móc|mũ)/i.test(p.name || ""));
        advice = "Trẻ em thích sticker, gấu bông, sổ tay, móc khóa dễ thương. Tránh đồ nhỏ dễ nuốt.";
      } else if (recipientType.includes("bạn")) {
        suggestions = products.filter(p => /(móc|tote|sticker|ly|ví|sổ|nến)/i.test(p.name || ""));
        advice = "Bạn bè thích đồ cá tính: móc khóa, tote, sticker, ly sứ, nến thơm.";
      } else {
        suggestions = products.filter(p => /(set|hộp|combo|ly|tote)/i.test(p.name || ""));
        advice = "Set quà tổng hợp hoặc hộp quà đặc sản là lựa chọn an toàn cho mọi đối tượng.";
      }

      if (suggestions.length > 0) {
        return `Dạ ${advice}\n\nEm gợi ý:\n\n${suggestions.slice(0, 6).map(formatProductLine).join("\n")}\n\nAnh/chị thấy hợp món nào ạ?`;
      }
    }

    // ─── Gift general ───
    if (intent === "gift_recommend") {
      const giftProducts = findCategoryProducts(products, categoryMap, "Quà tặng Đà Lạt");
      const allGifts = giftProducts.length > 0 ? giftProducts : products.filter(p => /(set|hộp|combo|quà|gấu|ly|tote|sticker)/i.test(p.name || ""));
      if (allGifts.length > 0) {
        return `Dạ em gợi ý quà tặng Đà Lạt:\n\n${allGifts.slice(0, 8).map(formatProductLine).join("\n")}\n\nNếu anh/chị nói rõ tặng ai (bạn bè, người yêu, ba mẹ...) thì bé gợi ý sát hơn nha!`;
      }
    }

    // ─── Category search ───
    if (intent === "category_search") {
      let matchedCat = "";
      let maxHits = 0;
      for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        const hits = keywords.filter(kw => norm.includes(kw)).length;
        if (hits > maxHits) { maxHits = hits; matchedCat = catName; }
      }
      if (matchedCat) {
        const catProducts = findCategoryProducts(products, categoryMap, matchedCat);
        if (catProducts.length > 0) {
          return `Dạ trong danh mục **${matchedCat}**, shop có:\n\n${catProducts.slice(0, 8).map(formatProductLine).join("\n")}\n\nAnh/chị muốn xem chi tiết sản phẩm nào ạ?`;
        }
      }
    }

    // ─── Exact product name match ───
    const nameMatches = products.filter(p => p.name && msg.includes(p.name.toLowerCase()));
    if (nameMatches.length > 0) {
      return `Dạ shop có sản phẩm này ạ:\n\n${nameMatches.map(formatProductDetail).join("\n\n")}\n\nAnh/chị muốn đặt hàng không ạ?`;
    }

    // ─── Fuzzy keyword search ───
    const keywords = extractKeywords(raw);
    if (keywords.length > 0) {
      const results = searchProductsByKeywords(products, keywords);
      if (results.length > 0) {
        return `Dạ em tìm thấy **${results.length} sản phẩm** liên quan:\n\n${results.slice(0, 6).map(formatProductLine).join("\n")}\n\nAnh/chị cần biết thêm chi tiết không ạ?`;
      }
    }

    // ─── Generic product search ───
    if (intent === "product_search") {
      const sorted = [...products].sort((a, b) => getProductPrice(a) - getProductPrice(b));
      return `Dạ shop đang có **${products.length} sản phẩm**, giá từ **${formatVnd(getProductPrice(sorted[0]))}** đến **${formatVnd(getProductPrice(sorted[sorted.length - 1]))}**:\n\n${sorted.slice(0, 8).map(formatProductLine).join("\n")}\n\nAnh/chị có thể hỏi theo:\n- 💰 Giá: *\"dưới 200k\"*, *\"trên 300k\"*, *\"100k - 200k\"*\n- 🏷️ Loại: *\"đồ len\"*, *\"đặc sản\"*, *\"nến thơm\"*\n- 🎁 Quà: *\"quà cho bạn bè\"*, *\"quà cho mẹ\"*`;
    }
  }

  // ─── General / Unknown → helpful response ───
  if (intent === "unknown" || intent === "general_question") {
    // If has products data, try keyword search one more time
    if (products.length > 0) {
      const keywords = extractKeywords(raw);
      const results = searchProductsByKeywords(products, keywords);
      if (results.length > 0 && results.length <= 8) {
        return `Dạ em tìm thấy một số sản phẩm có thể liên quan:\n\n${results.slice(0, 5).map(formatProductLine).join("\n")}\n\nNếu không phải ý anh/chị, hãy hỏi rõ hơn để bé hỗ trợ chính xác hơn nha!`;
      }
    }

    return "Dạ bé hiểu câu hỏi của anh/chị nhưng hiện đang ở **chế độ offline** nên khả năng trả lời hạn chế ạ 🐾\n\nBé có thể hỗ trợ tốt nhất về:\n- 🔍 Tìm sản phẩm: *\"sản phẩm dưới 200k\"*, *\"đồ len\"*\n- 🎁 Gợi ý quà: *\"quà cho mẹ\"*, *\"quà cho bạn\"*\n- 📞 Liên hệ: *\"thông tin liên hệ\"*\n- 💳 Mua hàng: *\"cách đặt hàng\"*, *\"thanh toán\"*\n\nKhi AI online trở lại, bé sẽ trả lời được mọi câu hỏi luôn ạ!";
  }

  return "Dạ bé chưa hiểu rõ ý anh/chị ạ 🐾 Anh/chị có thể diễn đạt lại không ạ?";
}

// ═══════════════════════════════════════════
// Main API handler
// ═══════════════════════════════════════════

export async function POST(req: Request) {
  let messages: ChatMessage[] = [];
  let products: ChatProduct[] = [];
  let categories: ChatCategory[] = [];
  let promotions: ChatPromotion[] = [];
  let categoryMap = new Map<string, string>();

  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages.filter(isChatMessage) : [];
    if (messages.length === 0) {
      return NextResponse.json({ error: "Thiếu nội dung câu hỏi." }, { status: 400 });
    }

    // ─── Fetch data from Supabase ───
    try {
      const supabase = createAdminSupabaseClient();
      const [catRes, prodRes, promoRes] = await Promise.all([
        supabase.from("categories").select("category_id, name"),
        supabase.from("products")
          .select("product_id, name, price, promoted_price, stock, unit, description, category_id")
          .eq("is_for_sale", true),
        supabase.from("promotions")
          .select("promotion_id, name, description, start_date, end_date, fixed_price")
          .eq("is_active", true),
      ]);
      categories = (catRes.data as ChatCategory[]) || [];
      products = (prodRes.data as ChatProduct[]) || [];
      promotions = (promoRes.data as ChatPromotion[]) || [];
      categoryMap = new Map(categories.map(c => [c.category_id, c.name]));
      console.log(`[Chat] DB: ${products.length} products, ${categories.length} categories, ${promotions.length} promotions`);
    } catch (e) {
      console.warn("[Chat] Supabase failed:", e);
    }

    // ─── Check API key ───
    const apiKey = getGeminiApiKey();
    if (!apiKey || apiKey.includes("your_gemini_api_key")) {
      return NextResponse.json({
        reply: buildFallbackReply(messages, products, categoryMap, promotions),
        fallback: true,
      });
    }

    // ─── Call Gemini ───
    const systemInstruction = buildSystemInstruction(
      buildProductsContext(products, categoryMap),
      buildPromotionsContext(promotions),
    );
    const contents = buildGenaiContents(messages);
    const ai = new GoogleGenAI({ apiKey });
    let responseText: string | null = null;
    let lastError: unknown = null;

    for (const model of ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: contents as any,
          config: { systemInstruction, temperature: 0.7, maxOutputTokens: 1500 } as any,
        });
        const text = typeof res?.text === "string" ? res.text.trim() : "";
        if (text.length > 0) { responseText = text; break; }
      } catch (err: any) {
        lastError = err;
        if (err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("429")) {
          await new Promise(r => setTimeout(r, 800));
        }
      }
    }

    if (responseText) {
      return NextResponse.json({ reply: responseText });
    }

    // Gemini failed → smart fallback
    return NextResponse.json({
      reply: buildFallbackReply(messages, products, categoryMap, promotions),
      fallback: true,
    });

  } catch (error) {
    console.error("[Chat] Error:", error);
    return NextResponse.json({
      reply: buildFallbackReply(messages, products, categoryMap, promotions),
      fallback: true,
    });
  }
}
