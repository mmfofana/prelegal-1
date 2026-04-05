import { Suspense } from "react";
import { ShareViewer } from "./ShareViewer";

export function generateStaticParams() {
  return [{ token: "_" }];
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <Suspense fallback={null}>
      <ShareViewer token={token} />
    </Suspense>
  );
}
