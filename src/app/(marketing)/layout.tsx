import { ReactNode } from "react";

// (marketing) layout — transparent wrapper, no additions.
// The actual public page (app/page.tsx) includes Navbar directly.
export default function MarketingLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
