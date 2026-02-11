import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_OTP_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 10;
const RATE_LIMIT_MINUTES = 2; // min time between OTP requests

function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action } = body;
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";

    // ─── REQUEST OTP ───
    if (action === "request_otp") {
      const { email } = body;
      if (!email || typeof email !== "string" || email.length > 255) {
        return new Response(JSON.stringify({ error: "Valid email required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Find user by email
      const { data: profile } = await adminClient
        .from("profiles")
        .select("user_id, telegram_chat_id, full_name")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (!profile || !profile.telegram_chat_id) {
        // Don't reveal whether user exists - generic message
        return new Response(
          JSON.stringify({ error: "If this email is registered with a Telegram account, an OTP has been sent." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Rate limit: check last token created
      const { data: recentToken } = await adminClient
        .from("password_reset_tokens")
        .select("created_at")
        .eq("user_id", profile.user_id)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentToken) {
        const lastCreated = new Date(recentToken.created_at).getTime();
        const now = Date.now();
        if (now - lastCreated < RATE_LIMIT_MINUTES * 60 * 1000) {
          return new Response(
            JSON.stringify({ error: `Please wait ${RATE_LIMIT_MINUTES} minutes before requesting another code.` }),
            { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      // Generate OTP and hash it
      const otp = generateOTP();
      const tokenHash = await hashToken(otp);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

      // Insert token (trigger auto-invalidates old ones)
      const { error: insertErr } = await adminClient.from("password_reset_tokens").insert({
        user_id: profile.user_id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        ip_address: clientIp,
      });

      if (insertErr) {
        console.error("Insert token error:", insertErr);
        return new Response(JSON.stringify({ error: "Failed to generate reset code" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Send OTP via Telegram
      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (!botToken) {
        return new Response(JSON.stringify({ error: "Telegram not configured" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const tgMessage = `🔐 Password Reset Code\n\nHi ${profile.full_name || "there"},\n\nYour one-time reset code is:\n\n<b>${otp}</b>\n\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes.\n\n⚠️ Do not share this code with anyone.`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: profile.telegram_chat_id,
          text: tgMessage,
          parse_mode: "HTML",
        }),
      });

      // Log activity
      await adminClient.from("password_reset_log").insert({
        user_id: profile.user_id,
        action: "otp_requested",
        ip_address: clientIp,
      });

      return new Response(
        JSON.stringify({ success: true, message: "Reset code sent to your Telegram." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ─── VERIFY OTP & RESET PASSWORD ───
    if (action === "verify_otp") {
      const { email, otp, newPassword } = body;
      if (!email || !otp || !newPassword) {
        return new Response(JSON.stringify({ error: "Email, OTP, and new password required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Find user
      const { data: profile } = await adminClient
        .from("profiles")
        .select("user_id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (!profile) {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Find valid token
      const { data: tokens } = await adminClient
        .from("password_reset_tokens")
        .select("*")
        .eq("user_id", profile.user_id)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      const token = tokens?.[0];
      if (!token) {
        return new Response(JSON.stringify({ error: "No valid reset code found. Please request a new one." }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Check attempts
      if (token.attempts >= MAX_OTP_ATTEMPTS) {
        await adminClient
          .from("password_reset_tokens")
          .update({ used: true })
          .eq("id", token.id);

        await adminClient.from("password_reset_log").insert({
          user_id: profile.user_id,
          action: "otp_max_attempts_exceeded",
          ip_address: clientIp,
        });

        return new Response(
          JSON.stringify({ error: "Too many attempts. Please request a new code." }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verify OTP hash
      const otpHash = await hashToken(otp.trim());
      if (otpHash !== token.token_hash) {
        // Increment attempts
        await adminClient
          .from("password_reset_tokens")
          .update({ attempts: token.attempts + 1 })
          .eq("id", token.id);

        const remaining = MAX_OTP_ATTEMPTS - token.attempts - 1;
        return new Response(
          JSON.stringify({ error: `Invalid code. ${remaining} attempt(s) remaining.` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // OTP valid! Reset password
      const { error: resetErr } = await adminClient.auth.admin.updateUserById(profile.user_id, {
        password: newPassword,
      });

      if (resetErr) {
        return new Response(JSON.stringify({ error: resetErr.message }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Mark token as used
      await adminClient
        .from("password_reset_tokens")
        .update({ used: true })
        .eq("id", token.id);

      // Log activity
      await adminClient.from("password_reset_log").insert({
        user_id: profile.user_id,
        action: "password_reset_success",
        ip_address: clientIp,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ─── CHANGE PASSWORD (authenticated user) ───
    if (action === "change_password") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: userErr } = await userClient.auth.getUser();
      if (userErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword || newPassword.length < 6) {
        return new Response(JSON.stringify({ error: "Current password and new password (min 6 chars) required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Verify current password by attempting sign-in
      const { error: signInErr } = await adminClient.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInErr) {
        return new Response(JSON.stringify({ error: "Current password is incorrect" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Update password
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Log activity
      await adminClient.from("password_reset_log").insert({
        user_id: user.id,
        action: "password_changed",
        ip_address: clientIp,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
