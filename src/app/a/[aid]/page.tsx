import fs from "fs";
import path from "path";
import ArticleView from "@/app/components/ArticleView";
import articles from "@/data/articles.json";

export function generateStaticParams() {
  return (articles as { aid: string }[]).map((a) => ({ aid: a.aid }));
}

export default async function Page({ params }: { params: Promise<{ aid: string }> }) {
  const { aid } = await params;
  const file = path.join(process.cwd(), "src", "data", "articles", aid + ".json");
  const article = JSON.parse(fs.readFileSync(file, "utf-8"));
  return <ArticleView article={article} />;
}
