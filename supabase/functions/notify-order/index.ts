import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, total, items, telegram } = await req.json();

    console.log(`📦 NEW ORDER: ${orderId} | ₱${total} | ${items} items | TG: ${telegram}`);

    // Send to Telegram
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");

    if (botToken && chatId) {
      const message = `🛒 *New Order\\!*\n\n📦 Order: \`${orderId?.slice(0, 8)}\`\n💰 Total: *₱${total}*\n📋 Items: ${items}\n📱 Deliver to: ${telegram || "N/A"}\n\nCheck admin dashboard to manage\\.`;

      const tgRes = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "MarkdownV2",
          }),
        }
      );

      if (!tgRes.ok) {
        const errText = await tgRes.text();
        console.error("Telegram error:", errText);
        
        // Fallback to plain text if MarkdownV2 fails
        const plainMessage = `🛒 New Order!\n\n📦 Order: ${orderId?.slice(0, 8)}\n💰 Total: ₱${total}\n📋 Items: ${items}\n📱 Deliver to: ${telegram || "N/A"}\n\nCheck admin dashboard to manage.`;
        
        await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: plainMessage,
            }),
          }
        );
        console.log("Telegram notification sent (plain text fallback)");
      } else {
        console.log("Telegram notification sent");
      }
    } else {
      console.log("Telegram not configured - set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID");
    }

    // Optional: Resend email
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const notifyEmail = Deno.env.get("ADMIN_EMAIL");

    if (resendKey && notifyEmail) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Store <onboarding@resend.dev>",
          to: [notifyEmail],
          subject: `New Order #${orderId?.slice(0, 8)} — ₱${total}`,
          html: `<h2>New Order Received!</h2><p><strong>Order ID:</strong> ${orderId}</p><p><strong>Total:</strong> ₱${total}</p><p><strong>Items:</strong> ${items}</p><p><strong>Deliver to:</strong> ${telegram}</p>`,
        }),
      });

      if (!emailRes.ok) {
        console.error("Resend error:", await emailRes.text());
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
