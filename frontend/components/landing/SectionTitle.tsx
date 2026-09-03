type SectionTitleProps = {
  eyebrow: string;
  title: string;
  description: string;
  center?: boolean;
};

export function SectionTitle({
  eyebrow,
  title,
  description,
  center = false,
}: SectionTitleProps) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-zinc-300">{description}</p>
    </div>
  );
}
