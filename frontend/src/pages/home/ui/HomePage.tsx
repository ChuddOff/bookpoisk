import { Container } from "@/shared/ui/container";
import { SectionFeed } from "@/widgets/categories/SectionFeed";

export function HomePage() {
  return (
    <Container>
      <div className="space-y-10">
        {["Фэнтези", "Любовный роман", "Фантастика"].map((t) => (
          <SectionFeed key={t} title={t} params={{ genres: [t] }} />
        ))}
      </div>
    </Container>
  );
}
