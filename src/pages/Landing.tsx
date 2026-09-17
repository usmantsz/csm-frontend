import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ServerSetting } from '../helperComponents/ServerSetting';
import IconMenu from '../components/Icon/IconMenu';
import IconX from '../components/Icon/IconX';

interface PricingRow {
    province: string;
    city: string;
    cropName: string;
    minRate: number;
    maxRate: number;
    avgRate: number;
    count: number;
}

const portalCards = [
    {
        to: '/shopowner-login',
        title: 'Shop owner',
        description: 'Dashboard, crops, customers, receipts, finance & subscriptions.',
        cta: 'Sign in',
        variant: 'primary' as const,
        icon: 'dashboard' as const,
        kicker: 'PRIMARY ROLE',
    },
    {
        to: '/customer-login',
        title: 'Customer',
        description: 'View balance, orders, and payment history with CNIC login.',
        cta: 'Customer login',
        variant: 'outline' as const,
        icon: 'user' as const,
        kicker: 'FARMER / KISAN',
    },
    {
        to: '/team-member-login',
        title: 'Team & sub-admin',
        description: 'Operate shops with role-based access for your organisation.',
        cta: 'Team login',
        variant: 'outline' as const,
        icon: 'users' as const,
        kicker: 'STAFF / MUNSHI',
    },
    {
        to: '/pos-login',
        title: 'POS',
        description: 'Pesticide / retail POS: sales, products, and shop links.',
        cta: 'POS login',
        variant: 'outline' as const,
        icon: 'pos' as const,
        kicker: 'COUNTER POS',
    },
];

const highlights = [
    {
        title: 'Mandi receipts',
        body: 'Dana Mandi and Sabzi Mandi flows with clear audit trails.',
        icon: 'receipt' as const,
    },
    {
        title: 'Customer ledger',
        body: 'Balances, returns, and credit — all tied to the shop.',
        icon: 'ledger' as const,
    },
    {
        title: 'Crop intelligence',
        body: 'Public rates by province and city with weekly and monthly views.',
        icon: 'chart' as const,
    },
    {
        title: 'POS integration',
        body: 'Retail counter connected to commission shop owners when you need it.',
        icon: 'pos' as const,
    },
    {
        title: 'Subscriptions',
        body: 'Plans and history so owners always know where they stand.',
        icon: 'calendar' as const,
    },
    {
        title: 'Built for Pakistan',
        body: 'CNIC-first sign-in and workflows that match local operations.',
        icon: 'pin' as const,
    },
];

/** Small hand-drawn icon set — no external icon dependency required. */
const MotifIcon = ({ name, className = 'h-5 w-5' }: { name: string; className?: string }) => {
    const common = {
        className,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.75,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    };
    switch (name) {
        case 'receipt':
            return (
                <svg {...common}>
                    <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3Z" />
                    <path d="M9 8h6M9 12h6M9 16h3" />
                </svg>
            );
        case 'ledger':
            return (
                <svg {...common}>
                    <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v18H7.5A2.5 2.5 0 0 0 5 22.5v-18Z" />
                    <path d="M5 4.5v16A2.5 2.5 0 0 1 7.5 18" />
                    <path d="M9 7h6M9 10.5h6" />
                </svg>
            );
        case 'chart':
            return (
                <svg {...common}>
                    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
                </svg>
            );
        case 'pos':
            return (
                <svg {...common}>
                    <rect x="3" y="5" width="18" height="12" rx="1.5" />
                    <path d="M3 9h18M8 21h8M12 17v4" />
                </svg>
            );
        case 'calendar':
            return (
                <svg {...common}>
                    <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
                    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
                    <path d="m8.5 14 2 2 4-4" />
                </svg>
            );
        case 'pin':
            return (
                <svg {...common}>
                    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
                    <circle cx="12" cy="9.5" r="2.25" />
                </svg>
            );
        case 'dashboard':
            return (
                <svg {...common}>
                    <rect x="3.5" y="3.5" width="7.5" height="8.5" rx="1.25" />
                    <rect x="13" y="3.5" width="7.5" height="5" rx="1.25" />
                    <rect x="13" y="10.5" width="7.5" height="10" rx="1.25" />
                    <rect x="3.5" y="14" width="7.5" height="6.5" rx="1.25" />
                </svg>
            );
        case 'user':
            return (
                <svg {...common}>
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M4.5 20.5c1.4-4 4-6 7.5-6s6.1 2 7.5 6" />
                </svg>
            );
        case 'users':
            return (
                <svg {...common}>
                    <circle cx="9" cy="8" r="3" />
                    <path d="M2.75 20c1.2-3.5 3.4-5.3 6.25-5.3S14.05 16.5 15.25 20" />
                    <circle cx="17" cy="8.5" r="2.4" />
                    <path d="M15.5 14.3c2.2.2 3.7 1.9 4.75 5" />
                </svg>
            );
        default:
            return null;
    }
};

const Landing = () => {
    const [pricingData, setPricingData] = useState<PricingRow[]>([]);
    const [pricingLoading, setPricingLoading] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    // This landing page (and the login/auth pages that follow it) has no
    // language switcher and is only meant to render LTR. Only pages *inside*
    // an authenticated portal read the saved Urdu/RTL preference and apply it
    // themselves. So here we just force LTR while mounted and, on unmount,
    // stop enforcing it — we deliberately do NOT restore whatever "rtl" state
    // existed before, since that stale state is exactly what was leaking onto
    // the login pages. Any portal page that actually needs RTL sets it itself
    // when it mounts.
    useEffect(() => {
        const html = document.documentElement;

        const forceLtr = () => {
            if (html.getAttribute('dir') !== 'ltr') {
                html.setAttribute('dir', 'ltr');
            }
            if (html.classList.contains('rtl')) {
                html.classList.remove('rtl');
            }
        };

        forceLtr();

        const observer = new MutationObserver(forceLtr);
        observer.observe(html, { attributes: true, attributeFilter: ['dir', 'class'] });

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        axios
            .get(`${ServerSetting.serUrl}/api/public/pricing?period=week`, { validateStatus: () => true })
            .then((res) => {
                if (res.data?.success && Array.isArray(res.data.data)) setPricingData(res.data.data);
                else setPricingData([]);
            })
            .catch(() => setPricingData([]))
            .finally(() => setPricingLoading(false));
    }, []);

    const formatRs = (n: number) =>
        'Rs ' + (n ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
        <>
            <Link
                to="/pricing"
                className="landing-nav-link lg:px-3 lg:py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                onClick={onNavigate}
            >
                Pricing & rates
            </Link>
            <Link
                to="/customer-login"
                className="landing-nav-link lg:px-3 lg:py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                onClick={onNavigate}
            >
                Customer
            </Link>
            <Link
                to="/admin-login"
                className="landing-nav-link lg:px-3 lg:py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                onClick={onNavigate}
            >
                Admin
            </Link>
            <Link
                to="/shopowner-login"
                className="landing-nav-link inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition-colors hover:bg-primary/90 lg:w-auto"
                onClick={onNavigate}
            >
                Shop owner
            </Link>
            {/* Fixed: previously used btn-outline-primary/secondary classes whose
                template CSS overrode the hover color, so the text never visibly
                turned green on hover. Now plain links with an explicit
                hover:text-primary, same as the links above — hover is guaranteed
                to show. */}
            <Link
                to="/team-member-login"
                className="landing-nav-link lg:px-3 lg:py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                onClick={onNavigate}
            >
                Team
            </Link>
            <Link
                to="/pos-login"
                className="landing-nav-link lg:px-3 lg:py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                onClick={onNavigate}
            >
                POS
            </Link>
        </>
    );

    return (
        <div className="min-h-screen bg-[#f8faf9] text-gray-800 dark:bg-[#050a0d] dark:text-slate-100 selection:bg-primary/30">
            {/* Sticky glass header */}
            <header className="sticky top-0 z-50 border-b border-black/5 dark:border-white/[0.08] bg-white/85 dark:bg-[#050a0d]/85 backdrop-blur-md transition-all">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="flex h-16 sm:h-[4.25rem] items-center justify-between gap-4">
                        <Link to="/" className="flex items-center gap-3 shrink-0 group" onClick={() => setMobileOpen(false)}>
                            <img
                                src="/assets/images/logo.svg"
                                alt="Commission Shop"
                                className="h-10 w-10 sm:h-11 sm:w-11 object-contain rounded-xl ring-1 ring-black/5 dark:ring-white/10 dark:shadow-md dark:shadow-primary/20 group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="leading-tight">
                                <span className="block text-sm sm:text-base font-bold text-primary tracking-tight">Commission Shop</span>
                                <span className="hidden sm:block text-[10px] uppercase tracking-wider text-gray-500 dark:text-primary/80 font-semibold">
                                    Operations platform
                                </span>
                            </div>
                        </Link>

                        <nav className="hidden lg:flex items-center gap-1 flex-wrap justify-end">
                            <NavLinks />
                        </nav>

                        <button
                            type="button"
                            className="lg:hidden p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                            aria-expanded={mobileOpen}
                            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                            onClick={() => setMobileOpen((o) => !o)}
                        >
                            {mobileOpen ? <IconX className="w-5 h-5" /> : <IconMenu className="w-5 h-5" />}
                        </button>
                    </div>

                    {mobileOpen && (
                        <div className="lg:hidden border-t border-black/5 dark:border-white/10 py-4 flex flex-col gap-1">
                            <NavLinks onNavigate={() => setMobileOpen(false)} />
                        </div>
                    )}
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-40 dark:opacity-70 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(900px 420px at 50% 5%, rgba(16,185,129,0.20), transparent 60%), radial-gradient(700px 380px at 95% 20%, rgba(139,105,20,0.10), transparent 50%)',
                    }}
                />
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.08] dark:opacity-[0.16]"
                    style={{
                        backgroundImage: 'radial-gradient(rgba(16,185,129,0.35) 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 20%, black, transparent)',
                    }}
                />
                <div className="container relative mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-28">
                    <div className="mx-auto flex max-w-3xl flex-col items-center text-center rounded-[2rem] border border-primary/20 bg-white/80 dark:bg-[#0c171e]/70 dark:backdrop-blur-xl p-6 shadow-sm dark:shadow-2xl dark:shadow-black/50 backdrop-blur-sm sm:p-8 lg:p-10">
                        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 dark:bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary mb-0">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            Commission · Mandi · Retail
                        </p>
                        <h1 className="mt-5 text-4xl font-extrabold leading-[1.12] tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-[3.3rem]">
                            Every maund, every rupee —{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-emerald-200">
                                accounted for.
                            </span>
                        </h1>
                        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300 sm:text-xl">
                            From mandi receipts to customer ledgers, live crop rates, and POS — Commission Shop keeps your entire operation on one clean, dependable platform.
                        </p>
                        <p className="mt-4 max-w-xl text-sm text-gray-500 dark:text-primary/85 font-medium sm:text-base bg-transparent dark:bg-[#081217]/80 rounded-full px-4 py-1.5 border border-transparent dark:border-primary/15">
                            Dana Mandi ho ya Sabzi Mandi — receipts, customer ka hisaab-kitaab, aur hafta-war crop rates, sab kuch ek hi jagah par.
                        </p>
                        <div className="mt-9 flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row sm:items-center">
                            <Link
                                to="/shopowner-login"
                                className="btn btn-primary px-6 py-2.5 text-base shadow-lg shadow-primary/25 text-center justify-center gap-2"
                            >
                                Shop owner sign in
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                                </svg>
                            </Link>
                            <Link
                                to="/customer-login"
                                className="btn btn-outline-primary px-6 py-2.5 text-base border-2 border-primary text-primary hover:bg-primary hover:text-white text-center justify-center"
                            >
                                Customer sign in
                            </Link>
                            <Link to="/pricing" className="px-2 text-sm font-semibold text-primary hover:underline underline-offset-4">
                                Browse crop rates →
                            </Link>
                        </div>
                    </div>

                    <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3.5 sm:grid-cols-3">
                        {[
                            { k: 'Receipts', v: 'Structured mandi & shop records' },
                            { k: 'Ledger', v: 'Customer balance you can trust' },
                            { k: 'Rates', v: 'Province & city crop pricing' },
                        ].map((item) => (
                            <div
                                key={item.k}
                                className="flex items-center gap-3 rounded-xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#0c171e]/70 dark:backdrop-blur-md px-4 py-3 shadow-md shadow-black/5 dark:shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/20"
                            >
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                </span>
                                <div className="text-left min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{item.k}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{item.v}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="relative overflow-hidden border-t border-black/5 dark:border-white/[0.06] bg-white dark:bg-[#081217]/60 py-16 sm:py-20">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.18]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.12) 1px, transparent 1px)',
                        backgroundSize: '22px 22px',
                    }}
                />
                <div className="container relative mx-auto px-4 sm:px-6">
                    <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-14">
                        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 dark:bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
                            Built with intent
                        </p>
                        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Built for serious operations</h2>
                        <p className="mt-3 text-gray-600 dark:text-gray-400">
                            Everything ties back to the shop — fewer spreadsheets, fewer disputes, faster decisions.
                        </p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                        {highlights.map((h, idx) => (
                            <div
                                key={h.title}
                                className="group relative flex flex-col overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-[#f8faf9] dark:bg-[#0c171e]/70 dark:backdrop-blur-md p-6 sm:p-7 shadow-md shadow-black/5 dark:shadow-none transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:bg-white dark:hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/25 dark:hover:shadow-primary/15"
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:scale-110">
                                        <MotifIcon name={h.icon} className="h-5 w-5" />
                                    </span>
                                    <span className="text-xs font-mono font-medium text-gray-400 dark:text-slate-500 bg-black/[0.03] dark:bg-white/[0.03] px-2 py-0.5 rounded border border-black/5 dark:border-white/5">
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors group-hover:text-primary">
                                    {h.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{h.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Portals */}
            <section id="portals" className="scroll-mt-20 py-16 sm:py-20 bg-[#f8faf9] dark:bg-[#050a0d]">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Choose your portal</h2>
                        <p className="mt-3 text-gray-600 dark:text-gray-400">
                            Secure entry points for every role. Use CNIC where your organisation requires it.
                        </p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                        {portalCards.map((card) => (
                            <Link
                                key={card.to}
                                to={card.to}
                                className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-6 pt-7 transition-all duration-300 no-underline sm:p-7 sm:pt-8 hover:-translate-y-1.5 ${
                                    card.variant === 'primary'
                                        ? 'border-primary/35 bg-white dark:bg-[#081217]/90 shadow-lg shadow-primary/15 dark:shadow-black/40 hover:border-primary hover:shadow-2xl hover:shadow-primary/30'
                                        : 'border-black/5 dark:border-white/10 bg-white dark:bg-[#0c171e]/70 dark:backdrop-blur-md shadow-md shadow-black/5 dark:shadow-none hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/20 dark:hover:shadow-primary/10'
                                }`}
                            >
                                {card.variant === 'primary' && (
                                    <span className="absolute inset-x-0 -top-px h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                                )}
                                <div className="flex items-center justify-between">
                                    <span
                                        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${
                                            card.variant === 'primary'
                                                ? 'bg-primary/15 border border-primary/30 text-primary'
                                                : 'bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 text-gray-600 dark:text-slate-300'
                                        } transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:scale-110`}
                                    >
                                        <MotifIcon name={card.icon} className="h-5 w-5" />
                                    </span>
                                    <span
                                        className={`text-[10px] font-bold uppercase tracking-wider ${
                                            card.variant === 'primary'
                                                ? 'rounded px-2 py-0.5 bg-primary/15 text-primary border border-primary/25'
                                                : 'font-mono font-medium text-gray-400 dark:text-slate-500'
                                        }`}
                                    >
                                        {card.kicker}
                                    </span>
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white transition-colors group-hover:text-primary">
                                    {card.title}
                                </h3>
                                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{card.description}</p>
                                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                                    {card.cta} <span aria-hidden>→</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing snapshot — kept fully dynamic, only the visual container was refreshed */}
            <section className="border-t border-black/5 dark:border-white/[0.06] bg-white dark:bg-[#081217]/60 py-16 sm:py-20">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="mb-6 flex flex-col items-center gap-6 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
                        <div className="max-w-xl">
                            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                                </span>
                                Live this week
                            </span>
                            <h2 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Crop pricing snapshot</h2>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                                This week&apos;s aggregated rates from live data. Filter by province, city, and period on the full pricing page.
                            </p>
                        </div>
                        <Link
                            to="/pricing"
                            className="btn btn-outline-primary shrink-0 border-2 border-primary text-primary hover:bg-primary hover:text-white gap-2"
                        >
                            Open full pricing index
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                            </svg>
                        </Link>
                    </div>

                    {pricingLoading ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-black/5 dark:border-white/10 dark:bg-[#0c171e]/70 dark:backdrop-blur-md p-16">
                            <span className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading rates…</p>
                        </div>
                    ) : pricingData.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 dark:bg-[#0c171e]/70 dark:backdrop-blur-md p-12 text-center text-gray-500 dark:text-gray-400">
                            No public rate rows for this week yet. Try the pricing page for other periods or filters.
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-[#f8faf9] dark:bg-[#0c171e]/70 dark:backdrop-blur-xl shadow-sm">
                            <table className="min-w-[640px] w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-primary/10 dark:bg-[#050a0d]/70 text-gray-900 dark:text-white uppercase text-[11px] tracking-wider">
                                        <th className="p-3.5 font-semibold">Province</th>
                                        <th className="p-3.5 font-semibold">City</th>
                                        <th className="p-3.5 font-semibold">Crop</th>
                                        <th className="p-3.5 font-semibold">Min</th>
                                        <th className="p-3.5 font-semibold">Max</th>
                                        <th className="p-3.5 font-semibold">Avg</th>
                                        <th className="p-3.5 font-semibold">Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pricingData.slice(0, 12).map((row, i) => (
                                        <tr
                                            key={`${row.province}-${row.city}-${row.cropName}-${i}`}
                                            className="border-t border-black/5 dark:border-white/[0.05] bg-white dark:bg-transparent hover:bg-primary/[0.03] dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="p-3.5 text-gray-700 dark:text-gray-300">{row.province}</td>
                                            <td className="p-3.5 text-gray-700 dark:text-gray-300">{row.city}</td>
                                            <td className="p-3.5 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                {row.cropName}
                                            </td>
                                            <td className="p-3.5 tabular-nums text-gray-700 dark:text-gray-300">{formatRs(row.minRate)}</td>
                                            <td className="p-3.5 tabular-nums text-gray-700 dark:text-gray-300">{formatRs(row.maxRate)}</td>
                                            <td className="p-3.5 tabular-nums font-bold text-primary">{formatRs(row.avgRate)}</td>
                                            <td className="p-3.5 tabular-nums text-gray-600 dark:text-gray-400">{row.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {pricingData.length > 12 && (
                                <p className="border-t border-black/5 dark:border-white/10 p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Showing 12 of {pricingData.length} rows.{' '}
                                    <Link to="/pricing" className="font-semibold text-primary hover:underline">
                                        View all
                                    </Link>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 sm:py-20 bg-[#f8faf9] dark:bg-[#050a0d]">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="relative overflow-hidden rounded-3xl border border-primary/20 dark:border-emerald-400/25 bg-gradient-to-br from-primary to-primary-700 text-white shadow-xl shadow-primary/25">
                        <div
                            className="absolute inset-0 pointer-events-none opacity-40"
                            style={{
                                background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.2), transparent 60%)',
                            }}
                        />
                        <div className="relative px-6 py-12 text-center max-w-2xl mx-auto sm:px-10 sm:py-14">
                            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                                Get started today
                            </p>
                            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Ready when you are</h2>
                            <p className="mt-3 text-white/85 text-sm sm:text-base">
                                Sign in as shop owner or customer, or open public crop rates — no clutter, just the tools you use every day.
                            </p>
                            <div className="mt-8 flex flex-wrap justify-center gap-3">
                                <Link
                                    to="/shopowner-login"
                                    className="btn bg-white text-primary border-0 hover:bg-white/90 px-6 py-2.5 font-semibold"
                                >
                                    Shop owner
                                </Link>
                                <Link
                                    to="/customer-login"
                                    className="btn btn-outline-white px-6 py-2.5 font-semibold border-2 border-white text-white hover:bg-white/10"
                                >
                                    Customer
                                </Link>
                                <Link
                                    to="/pricing"
                                    className="btn btn-outline-white px-6 py-2.5 font-semibold border-2 border-white/70 text-white hover:bg-white/10"
                                >
                                    Pricing
                                </Link>
                            </div>
                            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/20 pt-6 text-xs text-white/75">
                                <span className="inline-flex items-center gap-1.5">
                                    <MotifIcon name="pin" className="h-3.5 w-3.5" /> Made for Pakistan
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <MotifIcon name="user" className="h-3.5 w-3.5" /> CNIC-secure login
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <MotifIcon name="receipt" className="h-3.5 w-3.5" /> No setup clutter
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-black/5 dark:border-white/[0.08] bg-white dark:bg-[#050a0d]">
                <span className="block h-[3px] bg-gradient-to-r from-primary via-primary-700 to-primary" />
                <div className="container mx-auto px-4 py-12 sm:px-6">
                    <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
                        <div className="max-w-sm">
                            <Link to="/" className="flex items-center gap-2">
                                <img src="/assets/images/logo.svg" alt="" className="h-9 w-9 rounded-lg" />
                                <span className="font-bold text-gray-900 dark:text-white">Commission Shop</span>
                            </Link>
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                Operations software for commission shops, mandi workflows, and connected POS.
                            </p>
                            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 dark:bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                                <MotifIcon name="pin" className="h-3.5 w-3.5" /> Built for Pakistan's mandis
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white mb-3">Product</p>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                    <li>
                                        <Link to="/pricing" className="hover:text-primary transition-colors">
                                            Pricing & rates
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to={{ pathname: '/', hash: 'portals' }} className="hover:text-primary transition-colors">
                                            Portals
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white mb-3">Access</p>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                    <li>
                                        <Link to="/shopowner-login" className="hover:text-primary transition-colors">
                                            Shop owner
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/customer-login" className="hover:text-primary transition-colors">
                                            Customer
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/admin-login" className="hover:text-primary transition-colors">
                                            Admin
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white mb-3">Staff</p>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                    <li>
                                        <Link to="/team-member-login" className="hover:text-primary transition-colors">
                                            Team login
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/pos-login" className="hover:text-primary transition-colors">
                                            POS login
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <p className="mt-10 pt-8 border-t border-black/5 dark:border-white/10 text-center text-xs text-gray-500 dark:text-gray-500">
                        © {new Date().getFullYear()} Commission Shop. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;