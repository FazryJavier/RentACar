import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui";
import { home } from "@/content/home";
import { Reveal } from "./reveal";
import { HomeSection, SectionHeading } from "./section-heading";

export function FaqTeaser() {
  return (
    <HomeSection labelledBy="faq-title">
      <Reveal>
        <SectionHeading id="faq-title" title={home.faq.title} />
        <Accordion type="single" collapsible className="bg-surface rounded-lg px-4 shadow-sm">
          {home.faq.items.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <Link
          href="/faq"
          className="text-body text-accent hover:text-accent-hover focus-visible:focus-ring mt-6 inline-flex min-h-11 items-center rounded-sm font-semibold"
        >
          Lihat semua FAQ
        </Link>
      </Reveal>
    </HomeSection>
  );
}
