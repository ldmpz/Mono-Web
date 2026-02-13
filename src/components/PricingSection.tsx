import { createClient } from "@/lib/supabase-server";
import PricingClient from "./PricingClient";

export default async function PricingSection() {
    const supabase = await createClient();
    const { data: cards } = await supabase
        .from("pricing_cards")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true });

    if (!cards || cards.length === 0) {
        return null;
    }

    // Convert Supabase data to the interface expected by PricingClient
    const formattedCards = cards.map(card => ({
        id: card.id,
        title: card.title,
        price: card.price,
        description: card.description,
        features: card.features || [],
        image_url: card.image_url
    }));

    return <PricingClient cards={formattedCards} />;
}
