"use client";

import { HomepageSection } from "@/lib/api/config";
import SectionRow from "./SectionRow";

interface Props {
  sections: HomepageSection[];
  currencySymbol?: string;
}

const SECTION_LINKS: Record<string, string> = {
  featured:    "/products?is_featured=true",
  bestseller:  "/products?is_bestseller=true",
  new_arrivals: "/products?sort=newest",
};

export default function HomepageSections({ sections, currencySymbol = "$" }: Props) {
  return (
    <>
      {sections.map((section) => {
        if (section.type === "categories") return null; // handled separately
        return (
          <SectionRow
            key={section.id}
            sectionId={section.id}
            title={section.title}
            subtitle={section.subtitle ?? undefined}
            currencySymbol={currencySymbol}
            viewAllHref={SECTION_LINKS[section.type]}
          />
        );
      })}
    </>
  );
}
