import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminSupabaseClient } from "@/lib/supabaseClient";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatProduct = {
  name: string | null;
  price: number | string | null;
  promoted_price?: number | string | null;
  stock?: number | null;
  unit?: string | null;
  description?: string | null;
  category_id?: string | null;
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
  const promoted = toNumber(product.promoted_price);
  return promoted > 0 ? promoted : toNumber(product.price);
}

function parsePriceThreshold(message: string) {
  const match = message.match(/(\d+(?:[.,]\d+)?)\s*(triệu|trieu|tr|m|k|nghìn|ngan|ngàn)?/i);
  if (!match) return null;

  const rawNumber = Number(match[1].replace(",", "."));
  if (!Number.isFinite(rawNumber)) return null;

  const unit = (match[2] || "").toLowerCase();
  let amount = rawNumber;
  if (["triệu", "trieu", "tr", "m"].includes(unit)) {
    amount *= 1_000_000;
  } else if (["k", "nghìn", "ngan", "ngàn"].includes(unit)) {
    amount *= 1_000;
  }

  const direction = /(trên|hơn|cao hơn|lớn hơn|quá|từ).*(trở lên)?/.test(message)
    ? "above"
    : /(dưới|nhỏ hơn|thấp hơn|ít hơn|rẻ hơn)/.test(message)
      ? "below"
      : null;

  return direction ? { amount, direction } : null;
}

function isPriceRelatedMessage(message: string) {
  return (
    Boolean(parsePriceThreshold(message)) ||
    /(giá|bao nhiêu|cao nhất|đắt nhất|mắc nhất|rẻ nhất|thấp nhất|tầm tiền|khoảng tiền)/.test(message)
  );
}

function formatProductLine(product: ChatProduct) {
  const price = getProductPrice(product);
  const stockText = typeof product.stock === "number" ? `, còn ${product.stock} sản phẩm` : "";
  const unitText = product.unit ? `/${product.unit}` : "";
  return `- **${product.name || "Sản phẩm"}**: **${formatVnd(price)}${unitText}**${stockText}`;
}

function getProductSearchText(product: ChatProduct) {
  return `${product.name || ""} ${product.description || ""}`.toLowerCase();
}

function findSuggestedProducts(products: ChatProduct[], keywords: string[], limit = 4) {
  return products
    .filter((product) => {
      const searchText = getProductSearchText(product);
      return keywords.some((keyword) => searchText.includes(keyword));
    })
    .sort((a, b) => getProductPrice(a) - getProductPrice(b))
    .slice(0, limit);
}

function findFoodProducts(products: ChatProduct[], limit = 5) {
  return findSuggestedProducts(products, [
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
  ], limit);
}

function isFoodHealthMessage(message: string) {
  const normalized = message.toLowerCase();
  const asksProduct =
    /(shop|sản phẩm|san pham|món|mon|đặc sản|dac san|quà|qua|đồ ăn|do an|đồ uống|do uong|thực phẩm|thuc pham)/.test(normalized);
  const asksFoodOrHealth =
    /(ăn được|an duoc|uống được|uong duoc|ngon|sức khỏe|suc khoe|healthy|lành|lanh|bổ|bo|tốt cho|tot cho|atiso|trà|tra)/.test(normalized);

  return asksProduct && asksFoodOrHealth;
}

function isChildMessage(message: string) {
  return /(trẻ em|tre em|em bé|em be|bé|be|5 tuổi|5 tuoi|trẻ nhỏ|tre nho|con nít|con nit)/.test(message);
}

function formatProductSuggestions(products: ChatProduct[]) {
  if (products.length === 0) return "";
  return [
    "",
    "Một vài món phù hợp trong shop:",
    ...products.map(formatProductLine),
  ].join("\n");
}

function buildFoodHealthReply(products: ChatProduct[]) {
  const suggestions = findFoodProducts(products, 6);

  return [
    "Dạ có ạ. Nếu anh/chị muốn món **ăn/uống được, ngon và tương đối lành**, em gợi ý ưu tiên nhóm đặc sản Đà Lạt thay vì các món decor.",
    "",
    "**Nên chọn:** trà atiso, hồng treo gió, mứt/dâu sấy, bánh hoặc set đặc sản đóng gói. Trà atiso hợp làm quà nhẹ nhàng; hồng treo gió và dâu/mứt sấy dễ ăn, tiện mang đi.",
    "**Lưu ý sức khỏe:** đây là tư vấn tham khảo, không phải lời khuyên y tế. Các món ngọt/sấy khô nên dùng vừa phải; nếu mua cho trẻ nhỏ, người tiểu đường, dị ứng hoặc đang có bệnh nền thì nên kiểm tra thành phần trước khi dùng.",
    formatProductSuggestions(suggestions),
    suggestions.length === 0
      ? "Hiện em chưa thấy sản phẩm ăn được trong dữ liệu đang mở bán, anh/chị có thể xem lại trang Sản phẩm hoặc hỏi em theo ngân sách cụ thể nha."
      : "",
  ].filter(Boolean).join("\n");
}

function buildChildAdviceReply(products: ChatProduct[]) {
  const safeGiftProducts = findSuggestedProducts(products, [
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
    "chuông gió",
    "chuong gio",
  ]);

  const lightFoodProducts = findSuggestedProducts(products, [
    "dâu",
    "dau",
    "mứt",
    "mut",
    "hồng",
    "hong",
    "bánh",
    "banh",
  ], 3);

  return [
    "Dạ với bé khoảng **5 tuổi**, em khuyên mình nên ưu tiên các món **an toàn, nhẹ, dễ dùng và không có chi tiết nhỏ dễ nuốt** ạ.",
    "",
    "**Phù hợp hơn:** sticker, sổ tay, móc khóa bản lớn, túi tote nhỏ, nón/khăn len, gấu bông hoặc đồ lưu niệm mềm.",
    "**Đồ ăn đặc sản:** nếu chọn mứt, dâu sấy, hồng treo hoặc bánh thì nên cho bé dùng **lượng nhỏ**, có phụ huynh kiểm soát và lưu ý dị ứng/đường.",
    "**Không nên tự ý dùng như sản phẩm sức khỏe:** trà thảo mộc/atiso hoặc sản phẩm có công dụng thanh nhiệt nên hỏi phụ huynh hoặc bác sĩ nếu bé có bệnh nền.",
    formatProductSuggestions(safeGiftProducts.length > 0 ? safeGiftProducts : lightFoodProducts),
  ].filter(Boolean).join("\n");
}

function buildGiftAdviceReply(lastMessage: string, products: ChatProduct[]) {
  const isForPartner = /(người yêu|bạn gái|bạn trai|crush|lover|vợ|chồng)/.test(lastMessage);
  const isForParent = /(^|\s)(mẹ|ba|bố|cha|ông|bà)(\s|$)|phụ huynh|người lớn/.test(lastMessage);
  const isForTeacher = /(thầy|cô|giáo viên|giảng viên)/.test(lastMessage);

  if (!isForPartner && !isForParent && !isForTeacher) return null;

  const keywords = isForPartner
    ? ["nến", "nen", "hoa", "len", "túi", "tui", "vòng", "vong", "gấu", "gau"]
    : isForParent
      ? ["trà", "tra", "atiso", "hồng", "hong", "mứt", "mut", "dâu", "dau", "set"]
      : ["trà", "tra", "atiso", "sổ", "so tay", "set", "hộp", "hop", "mứt", "mut"];
  const suggestions = findSuggestedProducts(products, keywords, 5);
  const target = isForPartner ? "người yêu/crush" : isForParent ? "người lớn trong gia đình" : "thầy cô";

  return [
    `Dạ nếu mua quà cho **${target}**, em gợi ý chọn món có cảm giác lịch sự, dễ dùng và có câu chuyện Đà Lạt rõ ràng ạ.`,
    "",
    isForPartner
      ? "Mình có thể ưu tiên món xinh, thơm, mềm mại như nến thơm, đồ len, túi nhỏ hoặc quà handmade."
      : isForParent
        ? "Mình có thể ưu tiên đặc sản dễ dùng như trà atiso, hồng treo, mứt/dâu sấy hoặc set quà đóng gói gọn gàng."
        : "Mình có thể ưu tiên set trà, đặc sản đóng hộp, sổ tay hoặc món quà trang nhã, không quá cá nhân.",
    formatProductSuggestions(suggestions),
  ].filter(Boolean).join("\n");
}

function buildPriceReply(lastMessage: string, products: ChatProduct[]) {
  const pricedProducts = products
    .filter((product) => product.name && getProductPrice(product) > 0)
    .sort((a, b) => getProductPrice(a) - getProductPrice(b));

  if (pricedProducts.length === 0) return null;

  const threshold = parsePriceThreshold(lastMessage);
  const cheapest = pricedProducts[0];
  const mostExpensive = pricedProducts[pricedProducts.length - 1];

  if (threshold) {
    const matchedProducts = pricedProducts.filter((product) => {
      const price = getProductPrice(product);
      return threshold.direction === "above" ? price > threshold.amount : price < threshold.amount;
    });

    if (matchedProducts.length === 0) {
      const compareText = threshold.direction === "above" ? "trên" : "dưới";
      const reference = threshold.direction === "above" ? mostExpensive : cheapest;
      return [
        `Dạ hiện shop **chưa có sản phẩm nào giá ${compareText} ${formatVnd(threshold.amount)}** ạ.`,
        "",
        threshold.direction === "above"
          ? `Sản phẩm cao nhất hiện tại là **${reference.name}** với giá **${formatVnd(getProductPrice(reference))}**.`
          : `Sản phẩm thấp nhất hiện tại là **${reference.name}** với giá **${formatVnd(getProductPrice(reference))}**.`,
        "",
        "Anh/chị có thể xem thêm các sản phẩm đang bán trong trang Sản phẩm nha.",
      ].join("\n");
    }

    const compareText = threshold.direction === "above" ? "trên" : "dưới";
    return [
      `Dạ có **${matchedProducts.length} sản phẩm** giá ${compareText} **${formatVnd(threshold.amount)}** ạ:`,
      "",
      ...matchedProducts.slice(0, 6).map(formatProductLine),
      matchedProducts.length > 6 ? "" : null,
      matchedProducts.length > 6 ? `Và còn ${matchedProducts.length - 6} sản phẩm khác phù hợp.` : null,
    ].filter(Boolean).join("\n");
  }

  if (lastMessage.includes("cao nhất") || lastMessage.includes("đắt nhất") || lastMessage.includes("mắc nhất")) {
    return [
      `Dạ sản phẩm có giá cao nhất hiện tại là **${mostExpensive.name}** với giá **${formatVnd(getProductPrice(mostExpensive))}** ạ.`,
      "",
      "Giá có thể thay đổi nếu admin bật chương trình ưu đãi mới.",
    ].join("\n");
  }

  if (lastMessage.includes("rẻ nhất") || lastMessage.includes("thấp nhất")) {
    return [
      `Dạ sản phẩm có giá thấp nhất hiện tại là **${cheapest.name}** với giá **${formatVnd(getProductPrice(cheapest))}** ạ.`,
      "",
      "Nếu anh/chị cần quà nhỏ xinh, em có thể gợi ý thêm các món giá mềm trong shop nha.",
    ].join("\n");
  }

  return [
    `Dạ khoảng giá sản phẩm hiện tại từ **${formatVnd(getProductPrice(cheapest))}** đến **${formatVnd(getProductPrice(mostExpensive))}** ạ.`,
    "",
    "Một vài sản phẩm tiêu biểu:",
    ...pricedProducts.slice(0, 5).map(formatProductLine),
  ].join("\n");
}

function buildFallbackReply(messages: ChatMessage[], products: ChatProduct[] = []) {
  const lastMessage = (messages[messages.length - 1]?.content || "").toLowerCase();

  if (isChildMessage(lastMessage)) {
    return buildChildAdviceReply(products);
  }

  if (
    lastMessage.includes("thanh toán") ||
    lastMessage.includes("chuyển khoản") ||
    lastMessage.includes("cod") ||
    lastMessage.includes("nhận hàng") ||
    lastMessage.includes("tiền mặt")
  ) {
    return [
      "Dạ shop hiện hỗ trợ 2 phương thức thanh toán:",
      "",
      "- Thanh toán khi nhận hàng (COD): anh/chị trả tiền mặt khi shipper giao hàng.",
      "- Chuyển khoản ngân hàng: shop sẽ xác nhận thông tin đơn và liên hệ lại để hướng dẫn chuyển khoản.",
      "",
      "Anh/chị có thể chọn phương thức phù hợp ở bước xác nhận đặt hàng ạ.",
    ].join("\n");
  }

  if (
    lastMessage.includes("liên hệ") ||
    lastMessage.includes("địa chỉ") ||
    lastMessage.includes("ở đâu") ||
    lastMessage.includes("sdt") ||
    lastMessage.includes("điện thoại")
  ) {
    return [
      "Dạ đây là thông tin liên hệ của Đà Lạt Souvenir:",
      "",
      "- Hotline: 0979.777.777",
      "- Email: danghoaivu2004@gmail.com",
      "- Địa chỉ: Thành phố Qui Nhơn, Bình Định",
      "- Instagram: @lovehoaivulover",
      "",
      "Shop hỗ trợ tư vấn và giao hàng toàn quốc ạ.",
    ].join("\n");
  }

  if (
    lastMessage.includes("khuyến mãi") ||
    lastMessage.includes("giảm giá") ||
    lastMessage.includes("sale") ||
    lastMessage.includes("ưu đãi") ||
    lastMessage.includes("quà tặng")
  ) {
    return [
      "Dạ hiện shop có khu vực ưu đãi/khuyến mãi được cập nhật trực tiếp trên website.",
      "",
      "- Các chương trình đang bật sẽ hiện trong popup khuyến mãi.",
      "- Sản phẩm được áp dụng ưu đãi sẽ hiển thị giá khuyến mãi ngay trên thẻ sản phẩm.",
      "- Anh/chị có thể bấm vào mục Bộ quà tặng hoặc xem danh sách sản phẩm để chọn món phù hợp.",
      "",
      "Nếu cần kiểm tra nhanh chương trình đang chạy, anh/chị có thể liên hệ hotline 0979.777.777 ạ.",
    ].join("\n");
  }

  if (isFoodHealthMessage(lastMessage)) {
    return buildFoodHealthReply(products);
  }

  const giftAdvice = buildGiftAdviceReply(lastMessage, products);
  if (giftAdvice) return giftAdvice;

  if (
    lastMessage.includes("giá") ||
    lastMessage.includes("bao nhiêu") ||
    lastMessage.includes("sản phẩm")
  ) {
    const priceReply = buildPriceReply(lastMessage, products);
    if (priceReply) return priceReply;

    return [
      "Dạ anh/chị có thể xem giá mới nhất tại trang Sản phẩm của website.",
      "",
      "Một số nhóm sản phẩm nổi bật gồm đặc sản Đà Lạt, đồ len/phụ kiện, đồ lưu niệm handmade, nến thơm và bộ quà tặng. Giá có thể thay đổi theo chương trình ưu đãi đang bật.",
    ].join("\n");
  }

  if (
    lastMessage.includes("đặt hàng") ||
    lastMessage.includes("đơn hàng") ||
    lastMessage.includes("giỏ hàng") ||
    lastMessage.includes("hủy đơn") ||
    lastMessage.includes("lịch sử")
  ) {
    return [
      "Dạ anh/chị có thể mua hàng theo quy trình sau:",
      "",
      "1. Vào trang Sản phẩm và chọn món muốn mua.",
      "2. Thêm sản phẩm vào giỏ hàng.",
      "3. Mở giỏ hàng, kiểm tra sản phẩm và bấm xác nhận đặt hàng.",
      "4. Điền thông tin giao hàng và chọn thanh toán COD hoặc chuyển khoản.",
      "5. Sau khi đặt thành công, anh/chị có thể xem đơn trong mục Tài khoản > Đơn hàng.",
      "",
      "Với đơn chưa xử lý/giao, anh/chị có thể cập nhật thông tin hoặc hủy đơn trong trang đơn hàng của mình ạ.",
    ].join("\n");
  }

  return [
    "Dạ em hiểu câu hỏi của anh/chị ạ.",
    "",
    "Với ngữ cảnh của Đà Lạt Souvenir, em có thể hỗ trợ theo các hướng như: chọn quà theo người nhận, tư vấn đặc sản/đồ lưu niệm, so sánh giá, kiểm tra khuyến mãi, phương thức thanh toán, giao hàng và cách đặt đơn.",
    "",
    products.length > 0
      ? `Hiện shop đang có **${products.length} sản phẩm** để em dựa vào tư vấn. Anh/chị có thể hỏi cụ thể hơn, ví dụ: “quà cho bé 5 tuổi”, “món dưới 100k”, “quà cho mẹ”, “đặc sản dễ ăn”, hoặc “món nào đang khuyến mãi”.`
      : "Anh/chị hỏi rõ hơn một chút về nhu cầu hoặc người nhận quà, em sẽ tư vấn sát hơn nha.",
  ].join("\n");
}

export async function POST(req: Request) {
  let messages: ChatMessage[] = [];
  let products: ChatProduct[] = [];

  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages.filter(isChatMessage) : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: "Thiếu nội dung câu hỏi." }, { status: 400 });
    }

    const apiKey = getGeminiApiKey();
    const isMockMode = !apiKey || apiKey.includes("your_gemini_api_key");

    // 1. Fetch products & promotions to build the AI's context
    const supabase = createAdminSupabaseClient();

    // Fetch categories first
    const { data: categories } = await supabase
      .from("categories")
      .select("category_id, name");

    // Fetch active/saleable products
    const { data: productRows } = await supabase
      .from("products")
      .select("product_id, name, price, promoted_price, stock, unit, description, category_id")
      .eq("is_for_sale", true);

    products = productRows || [];

    // Fetch active promotions
    const { data: promotions } = await supabase
      .from("promotions")
      .select("promotion_id, name, description, start_date, end_date, fixed_price")
      .eq("is_active", true);

    // Format products context
    const categoryMap = new Map(categories?.map(c => [c.category_id, c.name]) || []);
    const productsContext = products.map(p => {
      const catName = categoryMap.get(p.category_id) || "Khác";
      const priceText = p.promoted_price ? `${p.promoted_price} VND (Giá gốc: ${p.price} VND, đang khuyến mãi)` : `${p.price} VND`;
      return `- Tên: ${p.name}\n  Danh mục: ${catName}\n  Giá: ${priceText}\n  Đơn vị: ${p.unit || "Cái/Hộp"}\n  Còn lại: ${p.stock} sản phẩm trong kho\n  Mô tả: ${p.description || "Chưa có mô tả chi tiết."}`;
    }).join("\n\n");

    // Format promotions context
    const promotionsContext = (promotions || []).map(promo => {
      return `- Chương trình: ${promo.name}\n  Mô tả: ${promo.description || "Không có mô tả chi tiết."}\n  Thời gian: ${promo.start_date ? new Date(promo.start_date).toLocaleDateString("vi-VN") : ""} đến ${promo.end_date ? new Date(promo.end_date).toLocaleDateString("vi-VN") : ""}`;
    }).join("\n");

    const lastMessage = (messages[messages.length - 1]?.content || "").toLowerCase();
    if (isChildMessage(lastMessage)) {
      return NextResponse.json({
        reply: buildChildAdviceReply(products),
        deterministic: true,
      });
    }

    if (isFoodHealthMessage(lastMessage)) {
      return NextResponse.json({
        reply: buildFoodHealthReply(products),
        deterministic: true,
      });
    }

    if (isPriceRelatedMessage(lastMessage)) {
      const priceReply = buildPriceReply(lastMessage, products);
      if (priceReply) {
        return NextResponse.json({
          reply: priceReply,
          deterministic: true,
        });
      }
    }

    if (isMockMode) {
      return NextResponse.json({
        reply: buildFallbackReply(messages, products),
        fallback: true,
      });
    }

    const systemInstruction = `Bạn là trợ lý AI thông minh, tự nhiên và thân thiện của cửa hàng "Đà Lạt Souvenir" (hoạt động 24/7).
Bạn hoạt động giống một trợ lý Gemini trong website: có thể trả lời câu hỏi phổ thông, giải thích khái niệm, gợi ý lựa chọn, trò chuyện tự nhiên và hỗ trợ khách hàng. Khi câu hỏi liên quan đến shop, sản phẩm, giá, khuyến mãi, thanh toán, giao hàng, tài khoản hoặc đơn hàng thì phải ưu tiên dùng dữ liệu thật được cung cấp bên dưới.
Không được lặp một câu trả lời chung cho mọi câu hỏi. Luôn đọc đúng ý câu hỏi cuối cùng của khách, phân biệt rõ khách đang hỏi về sản phẩm, giá, sức khỏe, trẻ em, thanh toán, khuyến mãi hay câu hỏi phổ thông ngoài shop.

THÔNG TIN CỬA HÀNG "ĐÀ LẠT SOUVENIR":
- Địa chỉ: Thành phố Qui Nhơn, Bình Định (Lưu ý: Shop bán đặc sản Đà Lạt tuyển chọn chất lượng cao nhưng có trụ sở tại Quy Nhơn).
- Điện thoại/Hotline: 0979.777.777
- Email: danghoaivu2004@gmail.com
- Instagram: @lovehoaivulover (https://www.instagram.com/lovehoaivulover/)
- Giờ mở cửa: 8:00 - 22:00 mỗi ngày.
- Chủ cửa hàng: Đặng Hoài Vũ.
- Phí giao hàng: Miễn phí cho đơn hàng từ 500k trở lên. Giao hàng toàn quốc nhanh chóng từ 2-4 ngày.
- Phương thức thanh toán: Hỗ trợ thanh toán khi nhận hàng (COD) và chuyển khoản ngân hàng. Với COD, khách thanh toán bằng tiền mặt khi nhận hàng. Với chuyển khoản, shop sẽ liên hệ xác nhận và hướng dẫn thông tin chuyển khoản.

CHỨC NĂNG WEBSITE:
- Khách hàng có thể xem trang chủ, trang sản phẩm, trang chi tiết sản phẩm, câu chuyện thương hiệu, giỏ hàng và bộ quà tặng.
- Người dùng có thể đăng nhập bằng Google hoặc email/password.
- Người dùng có thể thêm sản phẩm vào giỏ hàng, đặt hàng, chọn thanh toán khi nhận hàng hoặc chuyển khoản ngân hàng, xem lịch sử đơn hàng trong mục Tài khoản > Đơn hàng.
- Người dùng có thể cập nhật thông tin giao hàng hoặc hủy đơn khi đơn hàng còn ở trạng thái cho phép.
- Admin có thể xem website như người dùng thường và có thêm Admin Panel để quản lý sản phẩm, đơn hàng, khuyến mãi, ảnh sản phẩm và mô tả bằng AI.
- Chương trình khuyến mãi có thể được bật/tắt. Khi đang hoạt động, website có thể hiển thị popup ưu đãi và áp dụng giá ưu đãi cho các sản phẩm được chọn.
- Chatbot chỉ hỗ trợ tư vấn; các thao tác đặt hàng, hủy đơn, chỉnh thông tin đơn hoặc thanh toán vẫn cần người dùng thực hiện trực tiếp trên giao diện website.

DANH SÁCH SẢN PHẨM ĐANG KINH DOANH:
${productsContext || "Hiện tại không có sản phẩm nào trực tuyến."}

DANH SÁCH CHƯƠNG TRÌNH KHUYẾN MÃI ĐANG CHẠY:
${promotionsContext || "Hiện không có chương trình khuyến mãi lớn nào đang diễn ra."}

QUY TẮC PHẢN HỒI:
0. Trước khi trả lời, xác định đúng loại câu hỏi. Nếu khách hỏi "shop có sản phẩm gì ăn được/ngon/tốt cho sức khỏe không" thì phải tư vấn nhóm đặc sản ăn/uống được; không tự chuyển sang chủ đề quà cho gia đình nếu khách chưa nói.
1. Trả lời thân thiện, lịch sự, xưng hô là "Dạ em chào anh/chị" hoặc "Dạ, Đà Lạt Souvenir xin nghe" và kết thúc câu chào/hỏi tự nhiên. Sử dụng biểu tượng cảm xúc (emoji) tinh tế.
2. Dữ liệu sản phẩm và giá cả phải đúng tuyệt đối theo danh sách được cung cấp ở trên. Nếu khách hàng hỏi sản phẩm không có trong danh sách, hãy phản hồi khéo léo là hiện shop chưa kinh doanh sản phẩm này nhưng gợi ý sản phẩm thay thế tương đương.
3. Khi khách hỏi về công dụng sức khỏe (ví dụ Atiso thanh nhiệt mát gan, hồng treo gió dẻo ngọt tự nhiên,...), hãy dựa vào mô tả và công dụng thực tế của sản phẩm để tư vấn chu đáo và chuyên nghiệp.
4. Nếu khách hỏi câu rộng hoặc ngoài phạm vi mua hàng, vẫn trả lời tự nhiên theo hiểu biết chung, sau đó liên hệ nhẹ nhàng về nhu cầu chọn quà/sản phẩm nếu phù hợp. Không được trả lời cụt kiểu "em chỉ tư vấn sản phẩm".
5. Nếu câu hỏi liên quan trẻ em, sức khỏe, bệnh lý, dị ứng, phụ nữ mang thai hoặc người lớn tuổi, chỉ tư vấn ở mức thông tin tham khảo, ưu tiên an toàn, nhắc khách kiểm tra thành phần và hỏi phụ huynh/bác sĩ khi cần. Không chẩn đoán bệnh và không khẳng định tác dụng chữa bệnh.
6. Khi tư vấn quà, hãy hỏi hoặc suy luận theo người nhận, độ tuổi, ngân sách, dịp tặng và sở thích. Nếu thiếu thông tin, đưa 2-3 hướng chọn hợp lý thay vì từ chối.
7. Trả lời ngắn gọn, súc tích, dễ hiểu. Sử dụng định dạng markdown (danh sách gạch đầu dòng, chữ đậm) để câu trả lời rõ ràng.
8. KHÔNG tự bịa ra thông tin liên hệ hay giá cả khác ngoài các thông tin đã được cung cấp ở trên.`;

    // Format history for Google AI SDK
    // The SDK expects history like: [{ role: 'user' | 'model', parts: [{ text: '...' }] }]
    const formattedHistory = buildGeminiHistory(messages.slice(0, -1));
    const text = await generateGeminiReply(
      apiKey,
      systemInstruction,
      formattedHistory,
      messages[messages.length - 1]?.content || "",
    );

    return NextResponse.json({ reply: text });
  } catch (error: unknown) {
    console.error("[API/Chat] Error:", error);
    return NextResponse.json({
      reply: buildFallbackReply(messages, products),
      fallback: true,
    });
  }
}
