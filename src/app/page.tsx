import ScrollReveal from "@/components/ScrollReveal";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import PricingSection from "@/components/PricingSection";
import Methodology from "@/components/Methodology";

import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <PricingSection />
      <ScrollReveal>
        <Services />
      </ScrollReveal>
      <ScrollReveal>
        <Methodology />
      </ScrollReveal>

      <ScrollReveal>
        <ContactForm />
      </ScrollReveal>
      <ScrollReveal>
        <Footer />
      </ScrollReveal>
    </main>
  );
}

