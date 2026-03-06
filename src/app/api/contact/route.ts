import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, phone, subject, message } = body;

        if (!name || !email || !message) {
            return NextResponse.json(
                { error: "Name, email, and message are required" },
                { status: 400 }
            );
        }

        const supabase = await createAdminClient();

        // Agregar el asunto dentro del cuerpo en notas de CRM
        const combinedNotes = subject
            ? `Asunto: ${subject}\n\nMensaje:\n${message}`
            : `Mensaje:\n${message}`;

        // Crear una nueva tarjeta en pipeline CRM
        const { error } = await supabase
            .from("clients")
            .insert([
                {
                    company_name: name,
                    contact_name: name,
                    email: email,
                    phone: phone || null,
                    notes: combinedNotes,
                    source: "Landing Page",
                    status: "lead"
                }
            ]);

        if (error) {
            console.error("Supabase error:", error);
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
