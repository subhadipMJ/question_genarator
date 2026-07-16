import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export default function Home() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl">QMaster</CardTitle>
          <CardDescription>The Smart Assessment Platform.</CardDescription>
        </CardHeader>
        <CardContent><Button nativeButton={false} render={<Link href="/dashboard" />}>Open dashboard</Button></CardContent>
      </Card>
    </main>
  );
}
