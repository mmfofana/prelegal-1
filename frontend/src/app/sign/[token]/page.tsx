import { Suspense } from "react";
import { SigningPage } from "./SigningPage";

export function generateStaticParams() {
  return [{ token: "_" }];
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <Suspense fallback={null}>
      <SigningPage token={token} />
    </Suspense>
  );
}
