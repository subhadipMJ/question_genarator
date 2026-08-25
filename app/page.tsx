import Link from "next/link";

import { Button } from "@/components/ui/button";
import logo from "../public/logos/safalya-logo-new-1.png";
import Loader from "@/components/loader";
export default function Home() {
  return (
    <main
      className="fixed inset-0 z-[100] isolate flex min-h-screen items-center justify-center overflow-hidden bg-black bg-cover bg-center  py-16 text-white"
      style={{
        backgroundImage:
          "url('https://cdn.pixabay.com/photo/2024/12/28/01/27/ai-generated-9295105_1280.jpg')",
      }}
    >
      <section className="text-center h-screen w-screen bg-black/60 flex flex-col items-center justify-center">
        <img src={logo.src} alt="Safalya Logo" className=" brightness-0 invert h-72"/>

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
