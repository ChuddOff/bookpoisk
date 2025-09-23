import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";

export default function App() {
  return (
    <div className="min-h-screen w-full bg-soft">
      <div className="mx-auto max-w-[1440px] px-[12px] min-[568px]:px-[18px] tablet:px-[24px] min-[992px]:px-[16px] min-[1200px]:px-[30px] lg:px-[60px] py-8">
        <div className="mx-auto max-w-[880px] space-y-6">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Буквапоиск — v4 без var()
          </h1>

          <div className="flex items-center gap-3">
            <Input placeholder="Поиск..." className="max-w-sm" />
            <Button>Найти</Button>
            <Button variant="outline" asChild>
              <a href="/">Ссылка как кнопка</a>
            </Button>
          </div>

          <Card className="rounded-xl shadow-card border-line">
            <CardHeader>
              <CardTitle>Карточка</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Проверка rounded/border/shadow</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
