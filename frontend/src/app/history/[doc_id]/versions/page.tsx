import { Suspense } from "react";
import { VersionsPage } from "./VersionsPage";

export function generateStaticParams() {
  return [{ doc_id: "0" }];
}

export default async function Page({ params }: { params: Promise<{ doc_id: string }> }) {
  const { doc_id } = await params;
  return (
    <Suspense fallback={null}>
      <VersionsPage docId={Number(doc_id)} />
    </Suspense>
  );
}
