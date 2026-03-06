import { createClient } from "@/lib/supabase-server";
import ServicesClient, { WebService } from "./ServicesClient";

export default async function Services() {
    const supabase = await createClient();
    const { data: services } = await supabase
        .from("web_services")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true });

    if (!services || services.length === 0) {
        return null;
    }

    const formattedServices: WebService[] = services.map(s => ({
        id: s.id,
        title: s.title,
        price: s.price,
        icon: s.icon,
        features: s.features || []
    }));

    return <ServicesClient services={formattedServices} />;
}
