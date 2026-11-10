import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-[#f2f2f2] px-4 py-16">
      <div className="max-w-xl w-full bg-white rounded-2xl border border-[#d6d6d6] p-8 md:p-10 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
          Evercare Hospital Platform • 404
        </p>
        <h1 className="mt-2 mc-serif text-3xl md:text-4xl text-[#080808]">
          Page Not Found / পৃষ্ঠাটি পাওয়া যায়নি
        </h1>
        <p className="mt-3 text-sm text-[#686868]">
          The medical resource, specialist profile, or page you requested could
          not be located or is not currently published.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="mc-btn-primary">
            Return to Evercare Home
          </Link>
          <Link href="/doctors" className="mc-btn-secondary">
            Find a Specialist
          </Link>
          <Link href="/appointments" className="mc-btn-secondary">
            Request Appointment
          </Link>
        </div>
      </div>
    </main>
  );
}

