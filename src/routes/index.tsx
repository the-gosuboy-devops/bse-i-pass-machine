import { createFileRoute } from "@tanstack/react-router";
import { PassMachine } from "@/components/pass-machine";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PassMachine />;
}
