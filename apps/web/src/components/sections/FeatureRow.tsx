"use client";

import type { ReactNode } from "react";
import type { ProductFeature } from "@/types/content";

interface FeatureRowProps {
  feature: ProductFeature;
}

export function FeatureRow({ feature }: FeatureRowProps) {
  const imageUrl = feature.imageUrl?.trim();
  const hasImage = Boolean(imageUrl);

  /* Replace the highlighted word with a <mark> element */
  const titleNodes = feature.titleHighlight
    ? feature.title.split(feature.titleHighlight).reduce<ReactNode[]>((acc, part, i, arr) => {
        acc.push(part);
        if (i < arr.length - 1) {
          acc.push(<mark key={i}>{feature.titleHighlight}</mark>);
        }
        return acc;
      }, [])
    : [feature.title];

  return (
    <article
      className={`feature-row${feature.reverse ? " feature-row--reverse" : ""}${
        hasImage ? "" : " feature-row--text-only"
      }`}
      aria-label={feature.title}
    >
      <div className="feature-row__text">
        <h2 className="feature-row__title">{titleNodes}</h2>
        <p className="feature-row__desc">{feature.description}</p>
      </div>
      {hasImage ? (
        <div className="feature-row__media" aria-hidden="true">
          <img src={imageUrl} alt={feature.imageAlt?.trim() || feature.title} loading="lazy" />
        </div>
      ) : null}
    </article>
  );
}
