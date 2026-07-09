import type { SVGProps } from "react";
import type { LucideProps } from "lucide-react";
import {
  Camera,
  Check,
  CreditCard,
  Delete,
  Globe,
  Hand,
  Heart,
  Home,
  ArrowBigUp,
  RotateCcw,
  User,
  Users,
  Wifi,
  ChevronLeft,
  School,
} from "lucide-react";

type IconProps = LucideProps;

export function IconBack(props: IconProps) {
  return <ChevronLeft strokeWidth={2} {...props} />;
}

export function IconCheck(props: IconProps) {
  return <Check strokeWidth={2.5} {...props} />;
}

export function IconCreditCard(props: IconProps) {
  return <CreditCard strokeWidth={2} {...props} />;
}

export function IconDelete(props: IconProps) {
  return <Delete strokeWidth={2} {...props} />;
}

export function IconGlobe(props: IconProps) {
  return <Globe strokeWidth={2} {...props} />;
}

export function IconHand(props: IconProps) {
  return <Hand strokeWidth={2} {...props} />;
}

export function IconHeart(props: IconProps) {
  return <Heart strokeWidth={2} fill="currentColor" {...props} />;
}

export function IconReset(props: IconProps) {
  return <RotateCcw strokeWidth={2} {...props} />;
}

export function IconShift(props: IconProps) {
  return <ArrowBigUp strokeWidth={2} {...props} />;
}

export function IconUser(props: IconProps) {
  return <User strokeWidth={2} {...props} />;
}

export function IconHome(props: IconProps) {
  return <Home strokeWidth={2} {...props} />;
}

export function IconLive(props: IconProps) {
  return <Wifi strokeWidth={2} {...props} />;
}

export function IconCamera(props: IconProps) {
  return <Camera strokeWidth={2} {...props} />;
}

export function IconUsers(props: IconProps) {
  return <Users strokeWidth={2} {...props} />;
}

export function IconSchool(props: IconProps) {
  return <School strokeWidth={2} {...props} />;
}

/** 홈 버튼 — 조직 primary 색 원 + 흰 집 (Figma ico_home). 어떤 테마색이든 동적 채색. */
export function IconHomeCircle({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 175.098 175.098"
      fill="none"
      aria-hidden
    >
      <circle cx="87.5489" cy="87.5489" r="87.5489" fill={color} />
      <path
        d="M132.39 81.3864L123.663 72.6803V51.3445C123.663 48.0398 120.954 45.3361 117.644 45.3361H111.625C108.314 45.3361 105.606 48.0398 105.606 51.3445V54.6671L93.5679 42.6623C91.9247 41.1122 90.4199 39.3277 87.5489 39.3277C84.6778 39.3277 83.1731 41.1122 81.5299 42.6623L42.7074 81.3864C40.8295 83.3392 39.397 84.7632 39.397 87.3948C39.397 90.7776 41.9972 93.4032 45.416 93.4032H51.435V129.454C51.435 132.758 54.1435 135.462 57.4539 135.462H69.4919C72.8161 135.462 75.5109 132.772 75.5109 129.454V105.42C75.5109 102.115 78.2194 99.4116 81.5299 99.4116H93.5679C96.8783 99.4116 99.5868 102.115 99.5868 105.42V129.454C99.5868 132.772 99.2721 135.462 102.596 135.462H117.644C120.954 135.462 123.663 132.758 123.663 129.454V93.4032H129.682C133.101 93.4032 135.701 90.7776 135.701 87.3948C135.701 84.7632 134.268 83.3392 132.39 81.3864Z"
        stroke="white"
        strokeWidth="6.43855"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 뒤로 버튼 — 조직 primary 색 원 테두리 + ‹ 셰브론 (Figma Group 310). 동적 채색. */
export function IconBackCircle({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 175.098 175.098"
      fill="none"
      aria-hidden
    >
      <circle
        cx="87.5489"
        cy="87.5489"
        r="84.3296"
        stroke={color}
        strokeWidth="6.43855"
      />
      <path
        d="M100.285 49.5616L63.0768 86.0467L100.285 122.532"
        stroke={color}
        strokeWidth="10.7309"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 77"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M60.8219 58.9L75.5 72.5M70.7667 36.2333C70.7667 53.7592 55.9324 67.9667 37.6333 67.9667C19.3343 67.9667 4.5 53.7592 4.5 36.2333C4.5 18.7075 19.3343 4.5 37.6333 4.5C55.9324 4.5 70.7667 18.7075 70.7667 36.2333Z"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
    </svg>
  );
}
