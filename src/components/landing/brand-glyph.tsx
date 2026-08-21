import { cn } from "@/lib/utils";
import { BRAND_ICONS, type BrandIcon } from "./brand-icons";

type BrandGlyphProps = {
	icon: BrandIcon;
	className?: string;
};

/** Decorative by design — every call site puts the product name in adjacent text. */
export function BrandGlyph({ icon, className }: BrandGlyphProps) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			className={cn("shrink-0 fill-current", className)}
		>
			<path d={BRAND_ICONS[icon]} />
		</svg>
	);
}
