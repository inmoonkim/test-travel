interface CancelPageProps {
  params: Promise<{ token: string }>;
}

async function fetchCancelStatus(token: string): Promise<{ cancelled: boolean; message: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/alerts/cancel?token=${encodeURIComponent(token)}`, {
    cache: "no-store",
  });
  return res.json();
}

export default async function CancelPage({ params }: CancelPageProps) {
  const { token } = await params;
  const result = await fetchCancelStatus(token);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="max-w-sm rounded-xl border p-8 text-center">
        <h1 className="mb-2 text-xl font-semibold">가격 알림</h1>
        <p className="text-muted-foreground">{result.message}</p>
        <a href="/" className="mt-4 inline-block text-sm underline">
          홈으로 돌아가기
        </a>
      </div>
    </main>
  );
}
