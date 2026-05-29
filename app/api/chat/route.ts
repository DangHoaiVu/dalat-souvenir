import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminSupabaseClient } from "@/lib/supabaseClient";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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

type ChatPromotion = {
  promotion_id?: string | null;
  name: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  fixed_price?: number | string | null;
};

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    (item.role === "user" || item.role === "assistant") &&
    typeof item.content === "string" &&
    item.content.trim().length > 0
  );
}

function buildGeminiHistory(messages: ChatMessage[]) {
  const history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  for (const message of messages) {
    if (history.length === 0 && message.role !== "user") continue;

    const role = message.role === "assistant" ? "model" : "user";
    const previous = history[history.length - 1];

    if (previous?.role === role) {
      previous.parts[0].text += `\n${message.content.trim()}`;
    } else {
      history.push({ role, parts: [{ text: message.content.trim() }] });
    }
  }

  while (history.at(-1)?.role === "user") {
    history.pop();
  }

  return history;
}

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    ""
  ).trim();
}

async function generateGeminiReply(
  apiKey: string,
  systemInstruction: string,
  history: ReturnType<typeof buildGeminiHistory>,
  message: string,
) {
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: unknown;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(message);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (error) {
      lastError = error;
      console.error(`[API/Chat] Gemini model ${modelName} failed:`, error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini returned no response");
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatVnd(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value))}đ`;
}

function getProductPrice(product: ChatProduct) {
  const promotedPrice = toNumber(product.promoted_price);
  return promotedPrice > 0 ? promotedPrice : toNumber(product.price);
}

function formatProductLine(product: ChatProduct) {
  const price = getProductPrice(product);
  const unitText = product.unit ? `/${product.unit}` : "";
  const stockText = typeof product.stock === "number" ? `, còn ${product.stock} sản phẩm` : "";
  return `- **${product.name || "Sản phẩm"}**: **${formatVnd(price)}${unitText}**${stockText}`;
}

function productText(product: ChatProduct) {
  return `${product.name || ""} ${product.description || ""}`.toLowerCase();
}

function pickProducts(products: ChatProduct[], keywords: string[], limit = 5) {
  return products
    .filter((product) => keywords.some((keyword) => productText(product).includes(keyword)))
    .sort((a, b) => getProductPrice(a) - getProductPrice(b))
    .slice(0, limit);
}

function formatProductSuggestions(products: ChatProduct[]) {
  if (products.length === 0) return "";
  return ["", "Một vài sản phẩm phù hợp trong shop:", ...products.map(formatProductLine)].join("\n");
}

function buildFallbackReply(
  messages: ChatMessage[],
  products: ChatProduct[] = [],
  promotions: ChatPromotion[] = [],
) {
  const lastMessage = (messages[messages.length - 1]?.content || "").toLowerCase();

  if (/(thanh toán|chuyển khoản|cod|nhận hàng|tiền mặt|payment)/.test(lastMessage)) {
    return [
      "Dạ shop hiện hỗ trợ 2 phương thức thanh toán:",
      "",
      "- **Thanh toán khi nhận hàng (COD):** anh/chị trả tiền mặt khi shipper giao hàng.",
      "- **Chuyển khoản ngân hàng:** shop sẽ xác nhận thông tin đơn và liên hệ lại để hướng dẫn chuyển khoản.",
      "",
      "Anh/chị có thể chọn phương thức phù hợp ở bước xác nhận đặt hàng ạ.",
    ].join("\n");
  }

  if (/(liên hệ|địa chỉ|ở đâu|sdt|số điện thoại|điện thoại|hotline|instagram|email)/.test(lastMessage)) {
    return [
      "Dạ đây là thông tin liên hệ của **Đà Lạt Souvenir**:",
      "",
      "- Hotline: **0979.777.777**",
      "- Email: **danghoaivu2004@gmail.com**",
      "- Địa chỉ: **Thành phố Qui Nhơn, Bình Định**",
      "- Instagram: **@lovehoaivulover**",
      "- Giờ hỗ trợ: **8:00 - 22:00 mỗi ngày**",
    ].join("\n");
  }

  if (/(khuyến mãi|giảm giá|sale|ưu đãi|voucher|mã giảm|quà tặng)/.test(lastMessage)) {
    const activePromotions = promotions.filter((promotion) => promotion.name);
    return [
      "Dạ các ưu đãi sẽ được cập nhật trực tiếp trên website và popup khuyến mãi.",
      activePromotions.length > 0
        ? [
            "",
            "Chương trình đang bật:",
            ...activePromotions.slice(0, 4).map((promotion) => {
              const price = toNumber(promotion.fixed_price);
              const priceText = price > 0 ? `, đồng giá ${formatVnd(price)}` : "";
              return `- **${promotion.name}**${priceText}`;
            }),
          ].join("\n")
        : "",
      "",
      "Anh/chị có thể xem mục **Bộ quà tặng** hoặc trang **Sản phẩm** để chọn món đang có ưu đãi ạ.",
    ].filter(Boolean).join("\n");
  }

  if (/(ăn được|uống được|đồ ăn|đồ uống|ngon|sức khỏe|healthy|tốt cho|atiso|trà|đặc sản)/.test(lastMessage)) {
    const foodProducts = pickProducts(products, [
      "trà",
      "tra",
      "atiso",
      "hồng",
      "hong",
      "mứt",
      "mut",
      "dâu",
      "dau",
      "bánh",
      "banh",
      "kẹo",
      "keo",
      "sấy",
      "say",
      "cà phê",
      "ca phe",
      "đặc sản",
      "dac san",
    ], 6);

    return [
      "Dạ có ạ. Nếu anh/chị muốn món **ăn/uống được, ngon và tương đối lành**, em gợi ý ưu tiên nhóm đặc sản Đà Lạt.",
      "",
      "**Nên chọn:** trà atiso, hồng treo gió, mứt/dâu sấy, bánh hoặc set đặc sản đóng gói. Các món này dễ dùng, dễ làm quà và hợp với nhiều độ tuổi.",
      "**Lưu ý:** đây là tư vấn tham khảo, không phải lời khuyên y tế. Nếu mua cho trẻ nhỏ, người dị ứng, tiểu đường hoặc có bệnh nền thì nên kiểm tra thành phần trước khi dùng.",
      formatProductSuggestions(foodProducts),
    ].filter(Boolean).join("\n");
  }

  if (/(trẻ em|tre em|em bé|em be|bé|be|5 tuổi|trẻ nhỏ|con nít)/.test(lastMessage)) {
    const childSafeProducts = pickProducts(products, [
      "sticker",
      "sổ",
      "so tay",
      "móc khóa",
      "moc khoa",
      "gấu",
      "gau",
      "túi",
      "tui",
      "nón",
      "non",
      "khăn",
      "khan",
      "len",
    ], 5);

    return [
      "Dạ với trẻ nhỏ, mình nên ưu tiên món **an toàn, nhẹ, dễ dùng và không có chi tiết nhỏ dễ nuốt**.",
      "",
      "Phù hợp hơn: sticker, sổ tay, móc khóa bản lớn, túi tote nhỏ, nón/khăn len hoặc đồ lưu niệm mềm.",
      "Nếu chọn đặc sản ăn được thì nên dùng lượng nhỏ và có phụ huynh kiểm tra thành phần.",
      formatProductSuggestions(childSafeProducts),
    ].filter(Boolean).join("\n");
  }

  if (/(giá|bao nhiêu|sản phẩm|món nào|mua gì|gợi ý|tư vấn|quà cho)/.test(lastMessage)) {
    const availableProducts = products
      .filter((product) => product.name && getProductPrice(product) > 0)
      .sort((a, b) => getProductPrice(a) - getProductPrice(b));

    return [
      "Dạ em gợi ý theo dữ liệu sản phẩm hiện có trong shop ạ.",
      availableProducts.length > 0
        ? [
            "",
            "Một vài sản phẩm dễ chọn:",
            ...availableProducts.slice(0, 6).map(formatProductLine),
          ].join("\n")
        : "",
      "",
      "Nếu anh/chị nói rõ ngân sách, người nhận quà hoặc dịp tặng, em sẽ lọc gợi ý sát hơn nha.",
    ].filter(Boolean).join("\n");
  }

  if (/(đặt hàng|đơn hàng|giỏ hàng|hủy đơn|lịch sử|giao hàng|ship)/.test(lastMessage)) {
    return [
      "Dạ quy trình mua hàng trên website như sau:",
      "",
      "1. Vào trang **Sản phẩm** và chọn món muốn mua.",
      "2. Thêm sản phẩm vào giỏ hàng.",
      "3. Kiểm tra giỏ hàng và xác nhận đặt hàng.",
      "4. Điền thông tin giao hàng, chọn **COD** hoặc **chuyển khoản**.",
      "5. Sau khi đặt thành công, xem đơn tại **Tài khoản > Đơn hàng**.",
      "",
      "Với đơn còn ở trạng thái cho phép, anh/chị có thể cập nhật thông tin hoặc hủy đơn trực tiếp trong trang đơn hàng.",
    ].join("\n");
  }

  return [
    "Dạ em hiểu câu hỏi của anh/chị ạ.",
    "",
    "Nếu câu hỏi liên quan đến shop, em có thể tư vấn sản phẩm, giá, khuyến mãi, thanh toán, giao hàng và đơn hàng. Nếu là câu hỏi phổ thông, em cũng sẽ cố gắng trả lời ngắn gọn, dễ hiểu như một trợ lý AI.",
    "",
    products.length > 0
      ? `Hiện shop đang có **${products.length} sản phẩm** để em dựa vào tư vấn. Anh/chị có thể hỏi cụ thể như: “món ăn được tốt cho sức khỏe”, “quà dưới 100k”, “quà cho bé”, hoặc “đang có khuyến mãi gì”.`
      : "Anh/chị hỏi rõ hơn một chút, em sẽ hỗ trợ sát nhu cầu hơn nha.",
  ].join("\n");
}

function buildProductsContext(products: ChatProduct[], categoryMap: Map<string, string>) {
  return products.map((product) => {
    const categoryName = product.category_id ? categoryMap.get(product.category_id) || "Khác" : "Khác";
    const promotedPrice = toNumber(product.promoted_price);
    const priceText = promotedPrice > 0
      ? `${formatVnd(promotedPrice)} (giá gốc ${formatVnd(toNumber(product.price))}, đang ưu đãi)`
      : formatVnd(toNumber(product.price));
    return [
      `- Tên: ${product.name}`,
      `  Danh mục: ${categoryName}`,
      `  Giá: ${priceText}`,
      `  Đơn vị: ${product.unit || "Cái/Hộp"}`,
      `  Tồn kho: ${typeof product.stock === "number" ? product.stock : "chưa rõ"}`,
      `  Mô tả: ${product.description || "Chưa có mô tả chi tiết."}`,
    ].join("\n");
  }).join("\n\n");
}

function buildPromotionsContext(promotions: ChatPromotion[]) {
  return promotions.map((promotion) => {
    const fixedPrice = toNumber(promotion.fixed_price);
    return [
      `- Chương trình: ${promotion.name}`,
      `  Mô tả: ${promotion.description || "Không có mô tả chi tiết."}`,
      fixedPrice > 0 ? `  Đồng giá: ${formatVnd(fixedPrice)}` : null,
      `  Thời gian: ${promotion.start_date ? new Date(promotion.start_date).toLocaleDateString("vi-VN") : "chưa rõ"} đến ${promotion.end_date ? new Date(promotion.end_date).toLocaleDateString("vi-VN") : "chưa rõ"}`,
    ].filter(Boolean).join("\n");
  }).join("\n\n");
}

function buildSystemInstruction(productsContext: string, promotionsContext: string) {
  return `Bạn là trợ lý AI thông minh, tự nhiên và thân thiện của cửa hàng "Đà Lạt Souvenir" (hoạt động 24/7).
Bạn có thể trả lời câu hỏi phổ thông như một trợ lý Gemini, đồng thời ưu tiên dùng dữ liệu thật của shop khi câu hỏi liên quan đến sản phẩm, giá, khuyến mãi, thanh toán, giao hàng, tài khoản hoặc đơn hàng.
Không được lặp một câu trả lời chung cho mọi câu hỏi. Luôn đọc đúng ý câu hỏi mới nhất của khách.

THÔNG TIN CỬA HÀNG:
- Địa chỉ: Thành phố Qui Nhơn, Bình Định. Shop bán đặc sản/quà lưu niệm Đà Lạt tuyển chọn.
- Hotline: 0979.777.777
- Email: danghoaivu2004@gmail.com
- Instagram: @lovehoaivulover
- Giờ hỗ trợ: 8:00 - 22:00 mỗi ngày.
- Phương thức thanh toán: COD và chuyển khoản ngân hàng.
- Giao hàng: hỗ trợ giao toàn quốc.

CHỨC NĂNG WEBSITE:
- Xem sản phẩm, chi tiết sản phẩm, câu chuyện thương hiệu, bộ quà tặng và giỏ hàng.
- Đăng nhập bằng Google hoặc email/password.
- Đặt hàng, xem lịch sử đơn hàng, cập nhật thông tin giao hàng hoặc hủy đơn khi trạng thái cho phép.
- Admin quản lý sản phẩm, đơn hàng, khuyến mãi, ảnh sản phẩm và mô tả bằng AI.
- Chatbot chỉ tư vấn; thao tác đặt/hủy đơn vẫn cần thực hiện trên giao diện website.

DANH SÁCH SẢN PHẨM ĐANG KINH DOANH:
${productsContext || "Hiện chưa lấy được dữ liệu sản phẩm."}

CHƯƠNG TRÌNH KHUYẾN MÃI ĐANG CHẠY:
${promotionsContext || "Hiện không có chương trình khuyến mãi đang bật."}

QUY TẮC TRẢ LỜI:
1. Trả lời bằng tiếng Việt, thân thiện, tự nhiên, dễ hiểu, xưng hô anh/chị.
2. Với câu hỏi về shop/sản phẩm/giá/khuyến mãi, chỉ dùng dữ liệu đã cung cấp, không bịa giá hoặc sản phẩm.
3. Với câu hỏi ngoài phạm vi shop, vẫn trả lời như trợ lý AI phổ thông; nếu phù hợp thì liên hệ nhẹ về nhu cầu chọn quà/sản phẩm.
4. Với sức khỏe, trẻ em, dị ứng, bệnh lý, phụ nữ mang thai hoặc người lớn tuổi: chỉ tư vấn tham khảo, không chẩn đoán bệnh, không khẳng định chữa bệnh.
5. Nếu khách hỏi "shop có sản phẩm gì ăn được, ngon, tốt cho sức khỏe không", phải tư vấn nhóm đặc sản ăn/uống được như trà atiso, hồng treo gió, mứt/dâu sấy, bánh hoặc set đặc sản.
6. Trả lời súc tích nhưng đủ ý. Dùng markdown gọn gàng: gạch đầu dòng, chữ đậm, đoạn ngắn.`;
}

export async function POST(req: Request) {
  let messages: ChatMessage[] = [];
  let products: ChatProduct[] = [];
  let promotions: ChatPromotion[] = [];

  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages.filter(isChatMessage) : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: "Thiếu nội dung câu hỏi." }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    const [categoriesResult, productsResult, promotionsResult] = await Promise.all([
      supabase.from("categories").select("category_id, name"),
      supabase
        .from("products")
        .select("product_id, name, price, promoted_price, stock, unit, description, category_id")
        .eq("is_for_sale", true),
      supabase
        .from("promotions")
        .select("promotion_id, name, description, start_date, end_date, fixed_price")
        .eq("is_active", true),
    ]);

    const categories = categoriesResult.data || [];
    products = productsResult.data || [];
    promotions = promotionsResult.data || [];

    const apiKey = getGeminiApiKey();
    const isMockMode = !apiKey || apiKey.includes("your_gemini_api_key");

    if (isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json({
        reply: buildFallbackReply(messages, products, promotions),
        fallback: true,
      });
    }

    const categoryMap = new Map(categories.map((category) => [category.category_id, category.name]));
    const systemInstruction = buildSystemInstruction(
      buildProductsContext(products, categoryMap),
      buildPromotionsContext(promotions),
    );
    const formattedHistory = buildGeminiHistory(messages.slice(0, -1));
    const lastMessage = messages[messages.length - 1]?.content || "";
    const text = await generateGeminiReply(apiKey, systemInstruction, formattedHistory, lastMessage);

    return NextResponse.json({ reply: text });
  } catch (error: unknown) {
    console.error("[API/Chat] Error:", error);
    return NextResponse.json({
      reply: buildFallbackReply(messages, products, promotions),
      fallback: true,
    });
  }
}
