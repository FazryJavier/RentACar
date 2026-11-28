"use client";

import { Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  EmptyState,
  Field,
  Input,
} from "@/components/ui";
import type { FaqCategory } from "@/content/faq";
import { foldText } from "@/lib/slug";

/** Categories whose questions or answers contain every word of the query (accent-insensitive). */
export function filterFaq(categories: FaqCategory[], query: string): FaqCategory[] {
  const words = foldText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return categories;
  }
  return categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => {
        const text = foldText(`${item.question} ${item.answer}`);
        return words.every((word) => text.includes(word));
      }),
    }))
    .filter((category) => category.items.length > 0);
}

/** FAQ with a live search box; categories as keyboard-operable accordions. */
export function FaqSearch({ categories }: { categories: FaqCategory[] }) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const shown = useMemo(() => filterFaq(categories, query), [categories, query]);
  const count = shown.reduce((total, category) => total + category.items.length, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="max-w-form">
        <Field label="Cari pertanyaan">
          <div className="relative">
            <Search
              aria-hidden="true"
              strokeWidth={1.75}
              className="text-text-subtle pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
            />
            <Input
              ref={input}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Contoh: deposit"
              className="pl-12"
            />
          </div>
        </Field>
        <p role="status" className="text-body-sm text-text-muted mt-2">
          {count} pertanyaan
        </p>
      </div>

      {count === 0 ? (
        <EmptyState
          title="Pertanyaan tidak ditemukan"
          description="Coba kata lain atau lihat semua pertanyaan."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                input.current?.focus();
              }}
            >
              Hapus pencarian
            </Button>
          }
        />
      ) : (
        shown.map((category) => (
          <section key={category.id} aria-labelledby={`faq-${category.id}`}>
            <h2 id={`faq-${category.id}`} className="text-h3 text-text mb-4">
              {category.title}
            </h2>
            <Accordion type="multiple" className="bg-surface rounded-lg px-4 shadow-sm">
              {category.items.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))
      )}
    </div>
  );
}
