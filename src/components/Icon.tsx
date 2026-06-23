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

export function IconSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 71 68"
      fill="none"
      aria-hidden
      {...props}
    >
      <circle cx="29" cy="29" r="17.5" stroke="currentColor" strokeWidth="9" />
      <path
        d="M42.5 42.5L61 61"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
    </svg>
  );
}
