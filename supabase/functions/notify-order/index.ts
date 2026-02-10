import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { orderId, total, items } = await req.json();

    // Log the order notification (email integration can be added later with Resend)
    console.log(`📦 NEW ORDER NOTIFICATION`);
    console.log(`Order ID: ${orderId}`);
    console.log(`Total: $${total}`);
    console.log(`Items: ${items}`);

    // If RESEND_API_KEY is configured, send email
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
          subject: `New Order #${orderId?.slice(0, 8)} — $${total}`,
          html: `
            <h2>New Order Received!</h2>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Total:</strong> $${total}</p>
            <p><strong>Items:</strong> ${items}</p>
            <p>Log in to admin dashboard to manage this order.</p>
          `,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error("Resend error:", errText);
      } else {
        console.log("Email sent successfully");
      }
    } else {
      console.log("Email not configured - set RESEND_API_KEY and ADMIN_EMAIL secrets to enable");
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
