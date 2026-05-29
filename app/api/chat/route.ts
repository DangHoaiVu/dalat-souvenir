import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminSupabaseClient } from "@/lib/supabaseClient";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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

function buildFallbackReply(messages: ChatMessage[]) {
  const lastMessage = (messages[messages.length - 1]?.content || "").toLowerCase();

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

  if (
    lastMessage.includes("sức khỏe") ||
    lastMessage.includes("tốt cho") ||
    lastMessage.includes("atiso") ||
    lastMessage.includes("trà")
  ) {
    return [
      "Dạ với nhóm sản phẩm tốt cho sức khỏe, anh/chị có thể tham khảo:",
      "",
      "- Trà atiso túi lọc: phù hợp làm quà, hỗ trợ thanh nhiệt và dễ sử dụng hằng ngày.",
      "- Hồng treo gió: vị ngọt tự nhiên, phù hợp làm quà đặc sản Đà Lạt.",
      "- Dâu tằm sấy dẻo: món ăn nhẹ dễ dùng, phù hợp làm quà cho bạn bè và gia đình.",
    ].join("\n");
  }

  if (
    lastMessage.includes("giá") ||
    lastMessage.includes("bao nhiêu") ||
    lastMessage.includes("sản phẩm")
  ) {
    return [
      "Dạ anh/chị có thể xem giá mới nhất tại trang Sản phẩm của website.",
      "",
      "Một số nhóm sản phẩm nổi bật gồm đặc sản Đà Lạt, đồ len/phụ kiện, đồ lưu niệm handmade, nến thơm và bộ quà tặng. Giá có thể thay đổi theo chương trình ưu đãi đang bật.",
    ].join("\n");
  }

  return [
    "Dạ em chào anh/chị! Em là trợ lý ảo của Đà Lạt Souvenir.",
    "",
    "Em có thể hỗ trợ tư vấn sản phẩm, giá bán, khuyến mãi, thông tin liên hệ và gợi ý quà tặng Đà Lạt. Hiện hệ thống AI đang dùng phản hồi dự phòng để đảm bảo anh/chị vẫn được hỗ trợ liên tục.",
  ].join("\n");
}

export async function POST(req: Request) {
  let messages: ChatMessage[] = [];

  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages.filter(isChatMessage) : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: "Thiếu nội dung câu hỏi." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isMockMode = !apiKey || apiKey.includes("your_gemini_api_key");

    if (isMockMode) {
      // Return a simulated, smart mock response based on user input
      const lastMessage = (messages[messages.length - 1]?.content || "").toLowerCase();
      let reply = "Dạ em chào anh/chị! Em là trợ lý ảo Đà Lạt Souvenir. (Hiện tại API Key của Gemini đang chạy ở chế độ thử nghiệm/offline nên em sẽ phản hồi bằng dữ liệu giả lập nhé ạ!)\n\n";

      if (lastMessage.includes("liên hệ") || lastMessage.includes("địa chỉ") || lastMessage.includes("ở đâu") || lastMessage.includes("sđt") || lastMessage.includes("điện thoại")) {
        reply += "📍 **Thông tin liên hệ của Shop:**\n- **Địa chỉ:** Thành phố Qui Nhơn, Bình Định (Shop chuyên đặc sản Đà Lạt tuyển chọn).\n- **Hotline:** 0979.777.777\n- **Email:** danghoaivu2004@gmail.com\n- **Instagram:** @lovehoaivulover\n- **Giờ mở cửa:** 8:00 - 22:00 hàng ngày.";
      } else if (lastMessage.includes("sức khỏe") || lastMessage.includes("tốt cho") || lastMessage.includes("atiso") || lastMessage.includes("atixô") || lastMessage.includes("trà")) {
        reply += "🍵 **Sản phẩm tốt cho sức khỏe tiêu biểu:**\n- **Trà atiso túi lọc:** Hỗ trợ thanh nhiệt, mát gan, giải độc cơ thể cực tốt. Rất thích hợp làm quà biếu.\n- **Hồng treo gió:** Sấy treo tự nhiên, vị ngọt dẻo lành mạnh, không đường hóa học.\n- **Dâu tằm sấy dẻo:** Nhiều vitamin, giúp đẹp da và hỗ trợ tiêu hóa.";
      } else if (lastMessage.includes("khuyến mãi") || lastMessage.includes("giảm giá") || lastMessage.includes("sale") || lastMessage.includes("quà tặng")) {
        reply += "🎁 **Chương trình ưu đãi hiện có:**\n- **Miễn phí vận chuyển:** Cho tất cả các đơn hàng từ **500k** trở lên trên phạm vi toàn quốc.\n- **Combo quà tặng:** Có Set lưu niệm mix nhiều món (mứt, trà, sổ tay) với giá cực kỳ tiết kiệm để làm quà.";
      } else if (lastMessage.includes("mứt") || lastMessage.includes("dâu tây") || lastMessage.includes("giá") || lastMessage.includes("bao nhiêu")) {
        reply += "🍓 **Thông tin giá cả sản phẩm nổi bật:**\n- **Mứt dâu tây Đà Lạt:** 120.000 VND / Hộp 500g.\n- **Hồng treo gió:** 315.000 VND / Hộp 500g.\n- **Khăn len handmade:** 150.000 VND / Cái.\n- **Nến thơm lavender/thông rừng:** 140.000 - 150.000 VND / Hũ.";
      } else {
        reply += "Dạ, Đà Lạt Souvenir chuyên cung cấp các sản phẩm đặc sản Đà Lạt (Mứt dâu tây, hồng treo gió, trà atiso), nến thơm decor, đồ len handmade xinh xắn.\n\nAnh/chị cần em hỗ trợ xem giá sản phẩm nào, tư vấn quà tặng tốt cho sức khỏe hay cần thông tin liên lạc giao hàng ạ?";
      }

      // Simulate network delay for realistic typing indicator
      await new Promise(resolve => setTimeout(resolve, 800));
      return NextResponse.json({ reply });
    }

    // 1. Fetch products & promotions to build the AI's context
    const supabase = createAdminSupabaseClient();

    // Fetch categories first
    const { data: categories } = await supabase
      .from("categories")
      .select("category_id, name");

    // Fetch active/saleable products
    const { data: products } = await supabase
      .from("products")
      .select("product_id, name, price, promoted_price, stock, unit, description, category_id")
      .eq("is_for_sale", true);

    // Fetch active promotions
    const { data: promotions } = await supabase
      .from("promotions")
      .select("promotion_id, name, description, start_date, end_date, fixed_price")
      .eq("is_active", true);

    // Format products context
    const categoryMap = new Map(categories?.map(c => [c.category_id, c.name]) || []);
    const productsContext = (products || []).map(p => {
      const catName = categoryMap.get(p.category_id) || "Khác";
      const priceText = p.promoted_price ? `${p.promoted_price} VND (Giá gốc: ${p.price} VND, đang khuyến mãi)` : `${p.price} VND`;
      return `- Tên: ${p.name}\n  Danh mục: ${catName}\n  Giá: ${priceText}\n  Đơn vị: ${p.unit || "Cái/Hộp"}\n  Còn lại: ${p.stock} sản phẩm trong kho\n  Mô tả: ${p.description || "Chưa có mô tả chi tiết."}`;
    }).join("\n\n");

    // Format promotions context
    const promotionsContext = (promotions || []).map(promo => {
      return `- Chương trình: ${promo.name}\n  Mô tả: ${promo.description || "Không có mô tả chi tiết."}\n  Thời gian: ${promo.start_date ? new Date(promo.start_date).toLocaleDateString("vi-VN") : ""} đến ${promo.end_date ? new Date(promo.end_date).toLocaleDateString("vi-VN") : ""}`;
    }).join("\n");

    const systemInstruction = `Bạn là Trợ lý ảo AI thông minh và thân thiện của cửa hàng "Đà Lạt Souvenir" (hoạt động 24/7).
Nhiệm vụ của bạn là tư vấn cho khách hàng về các sản phẩm lưu niệm, đặc sản Đà Lạt, các chương trình khuyến mãi, giá cả, và các thông tin liên quan đến shop.

THÔNG TIN CỬA HÀNG "ĐÀ LẠT SOUVENIR":
- Địa chỉ: Thành phố Qui Nhơn, Bình Định (Lưu ý: Shop bán đặc sản Đà Lạt tuyển chọn chất lượng cao nhưng có trụ sở tại Quy Nhơn).
- Điện thoại/Hotline: 0979.777.777
- Email: danghoaivu2004@gmail.com
- Instagram: @lovehoaivulover (https://www.instagram.com/lovehoaivulover/)
- Giờ mở cửa: 8:00 - 22:00 mỗi ngày.
- Chủ cửa hàng: Đặng Hoài Vũ.
- Phí giao hàng: Miễn phí cho đơn hàng từ 500k trở lên. Giao hàng toàn quốc nhanh chóng từ 2-4 ngày.

DANH SÁCH SẢN PHẨM ĐANG KINH DOANH:
${productsContext || "Hiện tại không có sản phẩm nào trực tuyến."}

DANH SÁCH CHƯƠNG TRÌNH KHUYẾN MÃI ĐANG CHẠY:
${promotionsContext || "Hiện không có chương trình khuyến mãi lớn nào đang diễn ra."}

QUY TẮC PHẢN HỒI:
1. Trả lời thân thiện, lịch sự, xưng hô là "Dạ em chào anh/chị" hoặc "Dạ, Đà Lạt Souvenir xin nghe" và kết thúc câu chào/hỏi tự nhiên. Sử dụng biểu tượng cảm xúc (emoji) tinh tế.
2. Dữ liệu sản phẩm và giá cả phải đúng tuyệt đối theo danh sách được cung cấp ở trên. Nếu khách hàng hỏi sản phẩm không có trong danh sách, hãy phản hồi khéo léo là hiện shop chưa kinh doanh sản phẩm này nhưng gợi ý sản phẩm thay thế tương đương.
3. Khi khách hỏi về công dụng sức khỏe (ví dụ Atiso thanh nhiệt mát gan, hồng treo gió dẻo ngọt tự nhiên,...), hãy dựa vào mô tả và công dụng thực tế của sản phẩm để tư vấn chu đáo và chuyên nghiệp.
4. Trả lời ngắn gọn, súc tích, dễ hiểu. Sử dụng định dạng markdown (danh sách gạch đầu dòng, chữ đậm) để câu trả lời rõ ràng.
5. KHÔNG tự bịa ra thông tin liên hệ hay giá cả khác ngoài các thông tin đã được cung cấp ở trên.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    // Format history for Google AI SDK
    // The SDK expects history like: [{ role: 'user' | 'model', parts: [{ text: '...' }] }]
    const formattedHistory = buildGeminiHistory(messages.slice(0, -1));

    const lastMessage = messages[messages.length - 1]?.content || "";

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(lastMessage);
    const text = result.response.text().trim();

    return NextResponse.json({ reply: text });
  } catch (error: unknown) {
    console.error("[API/Chat] Error:", error);
    return NextResponse.json({
      reply: buildFallbackReply(messages),
      fallback: true,
    });
  }
}
