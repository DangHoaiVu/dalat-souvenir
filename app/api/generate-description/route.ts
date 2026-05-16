import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

function formatIntoParagraphs(text: string): string {
  const raw = String(text ?? '').trim();
  if (!raw) return '';
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (/\n\s*\n/.test(normalized)) {
    return normalized
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .join('\n\n');
  }
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 2) {
    return normalized;
  }
  const chunkSize = 2;
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    paragraphs.push(sentences.slice(i, i + chunkSize).join(' '));
  }
  return paragraphs.join('\n\n');
}

const PROMPTS = {
  product: ({ name, categoryName }: { name: string; categoryName: string }) =>
    `Viết mô tả ngắn gọn, hấp dẫn cho sản phẩm đồ lưu niệm Đà Lạt tên "${name}" thuộc danh mục "${categoryName}". Độ dài 2-3 đoạn, nhấn mạnh thiết kế, cảm giác kỷ niệm, độ phù hợp để làm quà và tinh thần thành phố sương mù. KHÔNG thêm lời mở đầu hay kết luận. Chỉ trả về mô tả.`,
  gift: ({ name }: { name: string }) =>
    `Viết mô tả ngắn gọn bằng tiếng Việt cho quà tặng kèm tên "${name}". Chỉ 1-2 câu, nêu đặc điểm nổi bật và giá trị của quà tặng. KHÔNG thêm lời mở đầu hay kết luận. Chỉ trả về mô tả.`,
  promotion: ({ promotionName, promotedProductNames = [], fixedPrice = null }: { promotionName: string; promotedProductNames?: string[]; fixedPrice?: number | null }) => {
    const productsText = promotedProductNames.length
      ? promotedProductNames.join(', ')
      : 'Chưa có sản phẩm cụ thể';
    const fixedPriceText = fixedPrice != null && Number.isFinite(fixedPrice)
      ? `${fixedPrice} VND`
      : 'Không có giá cố định';
    return `Viết mô tả khuyến mãi cho cửa hàng Shop Lưu Niệm Đà Lạt - bán đồ lưu niệm và quà tặng Đà Lạt bằng tiếng Việt cho chương trình tên "${promotionName}".\nThông tin tham chiếu:\n- Sản phẩm đang nằm trong khuyến mãi: ${productsText}\n- Giá cố định hiện tại: ${fixedPriceText}\n\nYêu cầu:\n- Viết dài hơn mô tả sản phẩm thông thường, khoảng 4-6 đoạn ngắn.\n- Giọng văn bán hàng tự nhiên, rõ lợi ích, nhấn mạnh điểm nổi bật của nhóm sản phẩm.\n- Nếu có danh sách sản phẩm, hãy đề cập khéo léo theo nhóm hoặc tiêu biểu.\n- Không thêm lời mở đầu/kết luận kiểu "Dưới đây là...".\n- Chỉ trả về phần mô tả hoàn chỉnh.`;
  },
};
type PromptType = keyof typeof PROMPTS;

export async function POST(req: Request) {
  const body = await req.json();
  const { type = "product", ...params } = body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing Gemini API key" }, { status: 500 });
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  let prompt = "";
  if (type in PROMPTS) {
    prompt = PROMPTS[type as PromptType](params as never);
  } else {
    return NextResponse.json({ error: "Unknown prompt type" }, { status: 400 });
  }
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const formatted = type === "promotion" ? formatIntoParagraphs(text) : text;
    return NextResponse.json({ description: formatted });
  } catch {
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
