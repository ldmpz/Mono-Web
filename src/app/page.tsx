import ScrollReveal from "@/components/ScrollReveal";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import PricingSection from "@/components/PricingSection";
import Methodology from "@/components/Methodology";
import Advantages from "@/components/Advantages";
import UseCases from "@/components/UseCases";
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
        <Advantages />
      </ScrollReveal>
      <ScrollReveal>
        <UseCases />
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

