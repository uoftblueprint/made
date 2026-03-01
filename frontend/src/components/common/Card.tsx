import * as React from "react";

type CardBorder = "on" | "off";
type CardBg = "card" | "surface"; // card = white card surface, surface = background surface
type CardPadding = "none" | "sm" | "md" | "lg";
type CardShadow = "none" | "sm" | "md";
type CardRadius = "none" | "md" | "xl" | "2xl";

type CardProps = {
  children: React.ReactNode;
  border?: CardBorder;
  bg?: CardBg;
  padding?: CardPadding;
  shadow?: CardShadow;
  radius?: CardRadius;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

function borderClasses(border: CardBorder) {
  return border === "on" ? "border border-border" : "border-0";
}

function bgClasses(bg: CardBg) {
  // You define these tokens in your theme:
  // --card: card surface (white in light theme)
  // --surface: app/page background surface
  return bg === "card" ? "bg-white" : "bg-background";
}

function paddingClasses(p: CardPadding) {
  switch (p) {
    case "none":
      return "p-0";
    case "sm":
      return "p-3";
    case "lg":
      return "p-6";
    case "md":
    default:
      return "p-5";
  }
}

function shadowClasses(s: CardShadow) {
  switch (s) {
    case "none":
      return "shadow-none";
    case "md":
      return "shadow-md";
    case "sm":
    default:
      return "shadow-sm";
  }
}

function radiusClasses(r: CardRadius) {
  switch (r) {
    case "none":
      return "rounded-none";
    case "md":
      return "rounded-md";
    case "2xl":
      return "rounded-2xl";
    case "xl":
    default:
      return "rounded-xl";
  }
}

export function Card({
  children,
  border = "on",
  bg = "card",
  padding = "md",
  shadow = "sm",
  radius = "xl",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={[
        bgClasses(bg),
        borderClasses(border),
        paddingClasses(padding),
        shadowClasses(shadow),
        radiusClasses(radius),
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;