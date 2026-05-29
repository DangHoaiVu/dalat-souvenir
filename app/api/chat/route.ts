import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminSupabaseClient } from "@/lib/supabaseClient";
import { CATEGORIES, PRODUCTS } from "@/features/products/mock-data";

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
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
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
      // 1. Try standard string instruction (Gemini SDK v0.24.0+)
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction,
      });
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(message);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (error) {
      lastError = error;
      console.warn(`[API/Chat] Gemini model ${modelName} with string instruction failed, trying fallback:`, error);
      
      try {
        // 2. Try content object shape instruction for older SDK configurations
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: {
            role: "system",
            parts: [{ text: systemInstruction }]
          } as any
        });
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(message);
        const text = result.response.text().trim();
        if (text) return text;
      } catch (innerError) {
        lastError = innerError;
        console.error(`[API/Chat] Gemini model ${modelName} failed completely:`, innerError);
      }
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

function buildSleepAdviceReply(products: ChatProduct[]) {
  const relaxingProducts = pickProducts(products, ["nến", "nen", "lavender", "thông rừng", "thong rung", "trà", "tra", "atiso"], 4);
  return [
    "Dạ nếu anh/chị muốn **dễ ngủ hơn**, mình có thể thử vài cách nhẹ nhàng này trước ạ:",
    "",
    "- Tắt điện thoại/màn hình trước khi ngủ khoảng **30-60 phút**.",
    "- Giữ phòng mát, tối, yên tĩnh; hạn chế cà phê/trà đặc sau chiều tối.",
    "- Thử hít thở chậm: hít vào 4 giây, giữ 2 giây, thở ra 6 giây, lặp lại vài phút.",
    "- Có thể tắm nước ấm, nghe nhạc nhẹ hoặc đọc vài trang sách để cơ thể dịu lại.",
    "- Nếu mất ngủ kéo dài nhiều ngày, ảnh hưởng học/làm việc hoặc kèm lo âu mạnh thì nên hỏi bác sĩ/chuyên gia.",
    relaxingProducts.length > 0
      ? [
          "",
          "Nếu muốn tạo cảm giác thư giãn trong phòng, shop có vài món hợp vibe nhẹ nhàng:",
          ...relaxingProducts.map(formatProductLine),
        ].join("\n")
      : "",
  ].filter(Boolean).join("\n");
}

function buildTravelAdviceReply() {
  return [
    "Dạ nếu anh/chị chuẩn bị đi Đà Lạt hoặc mua quà kiểu Đà Lạt, em gợi ý nhanh như này:",
    "",
    "- Thời tiết Đà Lạt thường mát, nên mang áo khoác mỏng, giày dễ đi và ô/áo mưa nhẹ.",
    "- Quà dễ mua: trà atiso, hồng treo gió, mứt/dâu sấy, móc khóa, túi tote, nến thơm hoặc đồ len.",
    "- Nếu mua tặng người lớn: ưu tiên trà, hồng treo, set đặc sản đóng gói.",
    "- Nếu mua tặng bạn bè/người yêu: ưu tiên đồ handmade, nến thơm, túi, móc khóa hoặc phụ kiện nhỏ xinh.",
  ].join("\n");
}

function buildStudyAdviceReply() {
  return [
    "Dạ nếu anh/chị muốn học/làm việc tập trung hơn, có thể thử cách ngắn gọn này:",
    "",
    "- Chia việc thành phiên **25 phút tập trung + 5 phút nghỉ**.",
    "- Trước mỗi phiên chỉ đặt 1 mục tiêu nhỏ, ví dụ: học xong 2 trang hoặc sửa xong 1 lỗi.",
    "- Để điện thoại xa tay, tắt thông báo trong lúc làm.",
    "- Sau 3-4 phiên thì nghỉ dài hơn 15-20 phút để não hồi lại.",
  ].join("\n");
}

function buildFallbackReply(
  messages: ChatMessage[],
  products: ChatProduct[] = [],
  promotions: ChatPromotion[] = [],
) {
  const lastMessage = (messages[messages.length - 1]?.content || "").toLowerCase();

  // 1. Handle Greetings
  if (/(chào|hello|hi|xin chào|chào em|chào bé|alo|helo|hey)/.test(lastMessage)) {
    return [
      "Dạ em chào anh/chị! Bé là trợ lý ảo của cửa hàng **Đà Lạt Souvenir** 🌸",
      "",
      "Bé rất sẵn lòng tư vấn cho anh/chị về các sản phẩm đặc sản Đà Lạt (như mứt dâu tây, hồng treo gió, trà atiso), nến thơm, đồ len handmade, các chương trình khuyến mãi cũng như cách đặt hàng và liên hệ shop.",
      "",
      "Hôm nay anh/chị cần bé hỗ trợ tìm sản phẩm nào ạ?"
    ].join("\n");
  }

  // 2. Handle Budget Queries (e.g. "dưới 200 ngàn", "tầm 100k", "dưới 150.000")
  const budgetMatch = lastMessage.match(/(dưới|khoảng|tầm|hơn|nhỏ hơn|thấp hơn|dưới)\s*(\d+[\d.,]*)\s*(k|ngàn|nghìn|triệu|đ|vnd)?/i);
  if (budgetMatch) {
    let limitPrice = toNumber(budgetMatch[2]);
    const unit = budgetMatch[3]?.toLowerCase();
    if (unit === "k" || unit === "ngàn" || unit === "nghìn") {
      limitPrice = limitPrice * 1000;
    } else if (limitPrice < 1000) {
      // If user typed "dưới 200" without units, it means 200k
      limitPrice = limitPrice * 1000;
    }
    
    const matchingProducts = products
      .filter((p) => getProductPrice(p) <= limitPrice)
      .sort((a, b) => getProductPrice(a) - getProductPrice(b));

    if (matchingProducts.length > 0) {
      return [
        `Dạ em tìm thấy các sản phẩm có giá dưới **${formatVnd(limitPrice)}** phù hợp với ngân sách của anh/chị:`,
        "",
        ...matchingProducts.slice(0, 6).map(formatProductLine),
        "",
        "Anh/chị xem có món nào ưng ý hông nha!"
      ].join("\n");
    } else {
      return `Dạ hiện shop chưa có sản phẩm nào có giá dưới **${formatVnd(limitPrice)}** ạ. Các sản phẩm của shop dao động từ 25.000đ đến 350.000đ.`;
    }
  }

  // 3. Handle specific product name queries (e.g. "mứt dâu", "khăn len")
  const matchedProducts = products.filter(p => p.name && lastMessage.includes(p.name.toLowerCase()));
  if (matchedProducts.length > 0) {
    return [
      "Dạ shop có sản phẩm này ạ! Thông tin chi tiết:",
      "",
      ...matchedProducts.map(p => {
        const price = getProductPrice(p);
        return `- **${p.name}**: Giá **${formatVnd(price)}** (${p.unit || "hộp"}). Mô tả: ${p.description || "Đặc sản thơm ngon chất lượng."}`;
      }),
      "",
      "Anh/chị có muốn bé hướng dẫn đặt hàng sản phẩm này không ạ?"
    ].join("\n");
  }

  // 4. Default categories of questions
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
    const foodProducts = pickProducts(products, ["trà", "tra", "atiso", "hồng", "hong", "mứt", "mut", "dâu", "dau", "bánh", "banh", "kẹo", "keo", "sấy", "say", "cà phê", "ca phe", "đặc sản", "dac san"], 6);
    return [
      "Dạ có ạ. Nếu anh/chị muốn món **ăn/uống được, ngon và tương đối lành**, em gợi ý ưu tiên nhóm đặc sản Đà Lạt.",
      "",
      "**Nên chọn:** trà atiso, hồng treo gió, mứt/dâu sấy, bánh hoặc set đặc sản đóng gói. Các món này dễ dùng, dễ làm quà và hợp với nhiều độ tuổi.",
      "**Lưu ý:** đây là tư vấn tham khảo, không phải lời khuyên y tế. Nếu mua cho trẻ nhỏ, người dị ứng, tiểu đường hoặc có bệnh nền thì nên kiểm tra thành phần trước khi dùng.",
      formatProductSuggestions(foodProducts),
    ].filter(Boolean).join("\n");
  }

  if (/(trẻ em|tre em|em bé|em be|bé|be|5 tuổi|trẻ nhỏ|con nít)/.test(lastMessage)) {
    const childSafeProducts = pickProducts(products, ["sticker", "sổ", "so tay", "móc khóa", "moc khoa", "gấu", "gau", "túi", "tui", "nón", "non", "khăn", "khan", "len"], 5);
    return [
      "Dạ với trẻ nhỏ, mình nên ưu tiên món **an toàn, nhẹ, dễ dùng và không có chi tiết nhỏ dễ nuốt**.",
      "",
      "Phù hợp hơn: sticker, sổ tay, móc khóa bản lớn, túi tote nhỏ, nón/khăn len hoặc đồ lưu niệm mềm.",
      "Nếu chọn đặc sản ăn được thì nên dùng lượng nhỏ và có phụ huynh kiểm tra thành phần.",
      formatProductSuggestions(childSafeProducts),
    ].filter(Boolean).join("\n");
  }

  if (/(ngủ|ngu|mất ngủ|mat ngu|dễ ngủ|de ngu|khó ngủ|kho ngu|sleep|insomnia|thư giãn|thu gian)/.test(lastMessage)) {
    return buildSleepAdviceReply(products);
  }

  if (/(du lịch|du lich|đi đà lạt|di da lat|đà lạt chơi|da lat choi|mua quà đà lạt|mua qua da lat)/.test(lastMessage)) {
    return buildTravelAdviceReply();
  }

  if (/(học|hoc|ôn thi|on thi|tập trung|tap trung|deadline|làm việc|lam viec)/.test(lastMessage)) {
    return buildStudyAdviceReply();
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
    "Dạ bé chưa hiểu ý anh/chị lắm ạ 🐾",
    "",
    "Anh/chị có thể hỏi rõ hơn như: *đặc sản tốt cho sức khỏe*, *giá mứt dâu tây*, *sản phẩm dưới 200k* hoặc *thông tin liên hệ* của shop để bé hỗ trợ chính xác nhất nha!"
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
6. Trả lời súc tích nhưng đủ ý. Dùng markdown gọn gàng: gạch đầu dòng, chữ đậm, đoạn ngắn.
7. Khi khách hàng chỉ chào hỏi như "xin chào", "hello", "hi", hãy phản hồi cực kỳ nồng nhiệt, thân thiện, giới thiệu bản thân là trợ lý của shop Đà Lạt Souvenir và hỏi xem có thể giúp gì cho họ.`;
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

    // Try to fetch Supabase data but catch errors so they don't break the chatbot
    try {
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
    } catch (dbError) {
      console.warn("[API/Chat] Supabase query failed, falling back to mock catalog:", dbError);
      // fallback to mock catalog so the chatbot always has data
      products = PRODUCTS.map(p => ({
        product_id: p.product_id,
        name: p.name,
        price: p.price,
        promoted_price: null,
        stock: p.stock,
        unit: p.unit || "Cái/Hộp",
        description: p.description,
        category_id: p.category_id
      }));
      promotions = [];
    }

    const apiKey = getGeminiApiKey();
    const isMockMode = !apiKey || apiKey.includes("your_gemini_api_key");

    if (isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json({
        reply: buildFallbackReply(messages, products, promotions),
        fallback: true,
      });
    }

    const categoriesList = CATEGORIES;
    const categoryMap = new Map(categoriesList.map((category) => [String(category.id), category.name]));
    const systemInstruction = buildSystemInstruction(
      buildProductsContext(products, categoryMap),
      buildPromotionsContext(promotions),
    );
    const formattedHistory = buildGeminiHistory(messages.slice(0, -1));
    const lastMessage = messages[messages.length - 1]?.content || "";
    const text = await generateGeminiReply(apiKey, systemInstruction, formattedHistory, lastMessage);

    return NextResponse.json({ reply: text });
  } catch (error: unknown) {
    console.error("[API/Chat] Error calling Gemini, using fallback responder:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      reply: `*(Lỗi kết nối Gemini API thật: ${errMessage})*\n\n` + buildFallbackReply(messages, products, promotions),
      fallback: true,
    });
  }
}
