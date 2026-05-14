// Supabase Edge Function: send-category-notification
// Triggered when a new recipe is inserted to notify category subscribers
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import nodemailer from "https://esm.sh/nodemailer@1.11.0";

interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  from: string;
  devMode?: boolean;
}

interface RecipeNotification {
  recipeId: string;
  title: string;
  description?: string;
  category?: string;
  authorName?: string;
}

class EmailService {
  private config: EmailConfig;
  private transporter: nodemailer.Transporter | null = null;

  constructor(config: EmailConfig) {
    this.config = config;
    if (!config.devMode) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    }
  }

  async sendNewRecipeEmail(
    email: string,
    notification: RecipeNotification
  ): Promise<{ success: boolean; message: string }> {
    if (this.config.devMode) {
      console.log("[DEV MODE] New recipe notification: " + email + " -> " + notification.title);
      return { success: true, message: "dev mode" };
    }

    if (!this.transporter) {
      return { success: false, message: "email service not configured" };
    }

    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to: email,
        subject: "New recipe published: " + notification.title,
        html: this.generateNewRecipeTemplate(notification),
      });
      return { success: true, message: "sent successfully" };
    } catch (error) {
      console.error("Send failed:", error);
      return { success: false, message: "send failed" };
    }
  }

  private generateNewRecipeTemplate(notification: RecipeNotification): string {
    const description = notification.description || "Check out this new recipe!";
    const appUrl = Deno.env.get("APP_URL") || "https://recipe-app.com";
    const categoryBadge = notification.category
      ? '<span style="background:#10b981;color:white;padding:4px 12px;border-radius:12px;font-size:12px;display:inline-block;margin-bottom:10px;">' + notification.category + "</span>"
      : "";
    const authorLine = notification.authorName
      ? '<p style="color:#666;font-size:14px;">Author: <strong>' + notification.authorName + "</strong></p>"
      : "";
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.container{background:#f9f9f9;border-radius:8px;padding:30px}.header{text-align:center;margin-bottom:20px}.title{font-size:24px;font-weight:bold;color:#f97316;margin-bottom:10px}.badge{background:#10b981;color:white;padding:4px 12px;border-radius:12px;font-size:12px;display:inline-block;margin-bottom:10px}.description{background:#fff;padding:20px;border-radius:8px;margin:20px 0}.button{display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:20px 0}.footer{font-size:12px;color:#666;margin-top:20px;text-align:center}</style></head><body><div class="container"><div class="header"><div class="badge">New Recipe Published</div>' + categoryBadge + "<h1 class=\"title\">" + notification.title + '</h1></div><div class="description"><p>' + description + "</p>" + authorLine + '</div><div style="text-align:center;"><a href="' + appUrl + "/recipes/" + notification.recipeId + '" class="button">View Recipe</a></div><div class="footer">You are receiving this email because you subscribed to category or author updates.<br>To manage your subscriptions, visit your account settings.</div></div></body></html>';
  }
}

serve(async (_req) => {
  const { record } = await _req.json();

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase environment variables" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get the recipe details
    const { data: recipeData, error: recipeError } = await supabase
      .from("recipes")
      .select("id, title, description, category, created_by")
      .eq("id", record.id)
      .single();

    if (recipeError) {
      console.error("Error fetching recipe:", recipeError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch recipe" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get the author's name
    let authorName = "Unknown Author";
    if (recipeData.created_by) {
      const { data: userData } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", recipeData.created_by)
        .single();

      if (userData) {
        authorName = userData.display_name;
      }
    }

    // Get category subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from("category_subscriptions")
      .select("user_id")
      .eq("category", recipeData.category)
      .eq("subscribed", true);

    if (subscribersError) {
      console.error("Error fetching subscribers:", subscribersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscribers" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user emails for notification
    const userEmails: string[] = [];
    for (const subscriber of subscribers) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("id", subscriber.user_id)
        .single();

      if (!userError && userData && userData.email) {
        userEmails.push(userData.email);
      }
    }

    // Send notifications to all subscribers
    const notification = {
      recipeId: recipeData.id,
      title: recipeData.title,
      description: recipeData.description || "",
      category: recipeData.category,
      authorName: authorName,
    };

    // Initialize email service
    const emailService = new EmailService({
      smtp: {
        host: Deno.env.get("SMTP_HOST") || "localhost",
        port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
        user: Deno.env.get("SMTP_USER") || "",
        pass: Deno.env.get("SMTP_PASS") || "",
      },
      from: Deno.env.get("SMTP_FROM") || "noreply@recipe-app.com",
      devMode: Deno.env.get("EMAIL_DEV_MODE") === "true",
    });

    // Send emails
    let successCount = 0;
    for (const email of userEmails) {
      try {
        const result = await emailService.sendNewRecipeEmail(email, notification);
        if (result.success) {
          successCount++;
        }
      } catch (error) {
        console.error("Failed to send email to:", email, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Sent ${successCount} notifications successfully`,
        total: userEmails.length,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-category-notification:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
