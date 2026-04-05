import { Suspense } from "react";

import { CATALOG_ORDER } from "@/lib/document-registry";
import { DocumentEditor } from "./DocumentEditor";

export function generateStaticParams() {
  return CATALOG_ORDER.map((slug) => ({ slug }));
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense fallback={null}>
      <DocumentEditor slug={slug} />
    </Suspense>
  );
}
