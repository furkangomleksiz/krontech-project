"use client";

import { useState } from "react";
import { SectionTitle } from "@/components/ui/SectionTitle";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  title?: string;
}

export function FaqAccordion({ items, title = "FAQs" }: FaqAccordionProps) {
  const [open, setOpen] = useState<number | null>(null);

  function toggle(i: number) {
    setOpen((prev) => (prev === i ? null : i));
  }

  return (
    <section className="faq-section section-pad" aria-label="Frequently asked questions">
      <div className="container">
        <SectionTitle title={title} center />
        <div className="faq-list" style={{ maxWidth: 860, margin: "0 auto" }}>
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className={`faq-item${isOpen ? " faq-item--open" : ""}`}>
                <button
                  className="faq-item__trigger"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                  id={`faq-btn-${i}`}
                >
                  <span className="faq-item__question">{item.question}</span>
                  <span className="faq-item__icon" aria-hidden="true">+</span>
                </button>
                {isOpen && (
                  <div
                    className="faq-item__answer"
                    id={`faq-answer-${i}`}
                    role="region"
                    aria-labelledby={`faq-btn-${i}`}
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
