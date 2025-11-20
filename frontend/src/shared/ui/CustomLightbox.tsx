import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

export type CustomLightboxProps = {
  src: string;
  alt?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

/**
 * Обёртка над yet-another-react-lightbox:
 * - один слайд (обложка книги)
 * - закрытие по клику на фон и по Esc
 * - зум по колесу/клику (плагин Zoom)
 * - скрываем стрелки навигации (они не нужны при одном слайде)
 */
export function CustomLightbox({
  src,
  alt,
  open,
  onOpenChange,
}: CustomLightboxProps) {
  return (
    <Lightbox
      open={open}
      close={() => onOpenChange(false)}
      slides={[{ src, alt }]}
      plugins={[Zoom]}
      controller={{
        closeOnBackdropClick: true,
      }}
      carousel={{
        finite: true, // нет бесконечной прокрутки (и так один слайд)
        padding: 0,
      }}
      animation={{
        fade: 250,
        swipe: 0, // свайп не нужен при 1 слайде
      }}
      zoom={{
        scrollToZoom: true,
        maxZoomPixelRatio: 3,
        doubleTapDelay: 200,
        doubleClickDelay: 200,
      }}
      styles={{
        container: { backgroundColor: "rgba(0,0,0,0.8)", zIndex: 100 },
      }}
      // скрываем кнопки "вперёд/назад", т.к. один слайд
      render={{
        buttonPrev: () => null,
        buttonNext: () => null,
      }}
    />
  );
}
