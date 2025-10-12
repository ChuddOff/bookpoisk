import { SectionFeed } from "@/widgets/categories";

export function TmaHomePage() {
  return (
    <div className="px-4 space-y-8">
      <h1 className="text-lg font-semibold">Буквапоиск — Mini App</h1>
      <SectionFeed
        title="Новинки"
        params={{ genres: ["new"] }}
        moreHref="/tma/catalog"
      />
    </div>
  );
}
