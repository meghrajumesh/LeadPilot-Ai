import Link from "next/link";

const avatars = [
  { src: "https://i.pravatar.cc/40?img=1", alt: "User 1" },
  { src: "https://i.pravatar.cc/40?img=2", alt: "User 2" },
  { src: "https://i.pravatar.cc/40?img=3", alt: "User 3" },
  { src: "https://i.pravatar.cc/40?img=4", alt: "User 4" },
];

export function LandingPageContent() {
  return (
    <div className="min-h-[520px]">
      <header className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2 text-lg font-bold text-text-primary">
          <svg className="h-6 w-6" viewBox="0 0 36 36" fill="none">
            <defs>
              <linearGradient id="logoSm" x1="0" y1="0" x2="36" y2="36">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
            <rect width="36" height="36" rx="8" fill="url(#logoSm)" />
            <path d="M10 24V12l8 6-8 6Zm16-6-8 6V12l8 6Z" fill="#fff" />
          </svg>
          Your Business
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-text-secondary sm:flex">
          <a className="text-text-primary" href="#">Home</a>
          <a href="#">Features</a>
          <a href="#">Pricing</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </nav>
        <Link className="inline-flex items-center justify-center rounded-pill bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-hover" href="#">
          Get Started
        </Link>
      </header>

      <section className="flex flex-col items-start gap-6 px-8 py-12 md:flex-row md:items-center md:py-16">
        <div className="flex-1">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
            Grow Your Business
            <br />
            <span className="text-brand">With Smart Solutions</span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-text-secondary">
            We help you convert more leads, book meetings, and close more deals with AI.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="inline-flex items-center justify-center rounded-pill bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" href="#">
              Get Started
            </Link>
            <Link className="inline-flex items-center justify-center rounded-pill border border-border px-6 py-2.5 text-sm font-semibold text-text-primary hover:bg-[#F6F7FB]" href="#">
              Book a Demo
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex">
              {avatars.map((avatar, i) => (
                <img
                  alt={avatar.alt}
                  className="-ml-2 h-8 w-8 rounded-full border-2 border-surface first:ml-0"
                  key={avatar.alt}
                  src={avatar.src}
                  style={{ zIndex: avatars.length - i }}
                />
              ))}
            </div>
            <p className="text-sm text-text-secondary">
              Trusted by <span className="font-semibold text-text-primary">1,000+ businesses</span>
            </p>
          </div>
        </div>
        <div className="hidden flex-1 md:block" />
      </section>
    </div>
  );
}
