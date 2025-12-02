interface PricingCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    price: string;
}

export function PricingCard({ icon, title, subtitle, price }: PricingCardProps) {
    return (
        <div className="rl-panel-sidebar rl-glow-purple p-5 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-white text-base font-medium">
                {icon}
                {title}
            </div>
            <p className="text-sm text-[var(--rl-text-secondary)]">
                {subtitle}
            </p>

            <div className="mt-2 text-xl font-semibold text-white">
                {price}
                <span className="text-sm text-[var(--rl-text-secondary)] font-normal">
                    {" "}/ image
                </span>
            </div>
        </div>
    );
}
