import Link from "next/link";
import Image from "next/image";

type Props = {
  /** 링크 없이 로고+텍스트만 표시 */
  noLink?: boolean;
  /** 로고 크기 (모바일에서 더 작게 쓰려면 small) */
  size?: "default" | "small";
};

export function AppLogo({ noLink = false, size = "default" }: Props) {
  const sizeClass = size === "small" ? "h-9 w-9 sm:h-10 sm:w-10" : "h-10 w-10 sm:h-12 sm:w-12";
  const textClass = size === "small" ? "text-lg sm:text-xl" : "text-xl sm:text-2xl";

  const content = (
    <>
      <Image
        src="/logo.png"
        alt="AITE"
        width={48}
        height={48}
        className={`${sizeClass} shrink-0 object-contain`}
        priority
      />
      <span className={`font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 ${textClass}`}>
        AITE
      </span>
    </>
  );

  if (noLink) {
    return <div className="flex items-center gap-2">{content}</div>;
  }

  return (
    <Link
      href="/"
      className="flex items-center gap-2 transition opacity-90 hover:opacity-100"
      aria-label="AITE 홈"
    >
      {content}
    </Link>
  );
}
