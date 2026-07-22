import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main
      className="fixed inset-0 z-[100] isolate flex min-h-screen items-center justify-center overflow-hidden bg-black bg-cover bg-center px-5 py-16 text-white"
      style={{
        backgroundImage:
          "url('https://cdn.pixabay.com/photo/2024/12/28/01/27/ai-generated-9295105_1280.jpg')",
      }}
    >
      <div className="absolute inset-0 -z-10 bg-black/60" aria-hidden="true" />
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(0_0_0_/_0.7),transparent_50%,rgb(0_0_0_/_0.25))]"
        aria-hidden="true"
      />

      <section className="relative z-10 flex w-full max-w-3xl flex-col items-center px-7 py-14 text-center sm:px-14 sm:py-20">
        <p className="quiz-reveal mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-white/65 [animation-delay:100ms]">
          Welcome to
        </p>

        <h1 className="quiz-reveal text-6xl font-bold tracking-[-0.05em] drop-shadow-2xl sm:text-8xl [animation-delay:220ms]">
          QMaster
        </h1>

        <p className="quiz-reveal mt-5 max-w-lg text-balance text-base font-medium leading-7 text-white/75 sm:text-xl [animation-delay:340ms]">
          The Smart Assessment Platform.
        </p>

        <div className="quiz-reveal mt-9 [animation-delay:460ms]">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/dashboard" />}
            className="h-12 min-w-36 rounded-full bg-white px-9 text-base font-semibold text-black shadow-xl shadow-black/25 hover:bg-white/85"
          >
            Start
          </Button>
        </div>
      </section>
    </main>
  );
}
