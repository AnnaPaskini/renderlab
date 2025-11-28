import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes("@")) {
            return NextResponse.json({ error: "Valid email required" }, { status: 400 });
        }

        // Check if already subscribed
        const { data: existing } = await supabase
            .from("subscribers")
            .select("id")
            .eq("email", email)
            .single();

        if (existing) {
            return NextResponse.json({ error: "Already subscribed!" }, { status: 400 });
        }

        // Insert new subscriber
        const { error } = await supabase
            .from("subscribers")
            .insert({ email, subscribed_at: new Date().toISOString() });

        if (error) {
            console.error("Subscribe error:", error);
            return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Subscribe error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
