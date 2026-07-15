import Image from "next/image";
import Link from "next/link";
export default function Home() {
  return (
  <div className="flex flex-col items-center justify-center min-h-screen">
  <div className="text-xl px-10 py-5 ">
    Welcome
  </div>

    <Link href={`/questions`} className="bg-gray-400 w-fit px-5 py-2 rounded-4xl">quesions</Link>
  </div>


  );
}
