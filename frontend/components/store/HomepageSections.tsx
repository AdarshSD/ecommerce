"use client";

import { HomepageSection } from "@/lib/api/config";
import SectionRow from "./SectionRow";
import BestsellersSection from "./BestsellersSection";
import GenreGrid from "./GenreGrid";

interface Props {
  sections: HomepageSection[];
  currencySymbol?: string;
}

const SECTION_LINKS: Record<string, string> = {
  featured:     "/products?is_featured=true",
  bestseller:   "/products?is_bestseller=true",
  new_arrivals: "/products?is_new_arrival=true",
};

const SECTION_LABELS: Record<string, string> = {
  featured:     "Staff Picks",
  new_arrivals: "Just Arrived",
};

export default function HomepageSections({ sections, currencySymbol = "$" }: Props) {
  return (
    <>
      {sections.map((section) => {
        if (section.type === "bestseller") {
          return <BestsellersSection key={section.id} />;
        }
        if (section.type === "categories") {
          return <GenreGrid key={section.id} />;
        }
        return (
          <SectionRow
            key={section.id}
            sectionId={section.id}
            title={section.title}
            subtitle={section.subtitle ?? undefined}
            currencySymbol={currencySymbol}
            viewAllHref={SECTION_LINKS[section.type]}
            sectionLabel={SECTION_LABELS[section.type]}
          />
        );
      })}
    </>
  );
}
