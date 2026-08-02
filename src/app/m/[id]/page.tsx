import fs from "fs";
import path from "path";
import MachineView from "@/app/components/MachineView";
import index from "@/data/index.json";

export function generateStaticParams() {
  return (index as { id: string }[]).map((m) => ({ id: m.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = path.join(process.cwd(), "src", "data", "machines", id + ".json");
  const machine = JSON.parse(fs.readFileSync(file, "utf-8"));
  return <MachineView machine={machine} />;
}
