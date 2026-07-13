"use client";

export default function RequestPageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen bg-[#fbf6ea] px-4 py-10 text-[#243232]">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#eadfc8] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b98a2f]">NestHelper request form</p>
        <h1 className="mt-3 text-3xl font-black text-[#075c58]">Let’s reload the request form.</h1>
        <p className="mt-3 text-base font-semibold leading-7 text-slate-700">
          Something did not load correctly in this browser session. Please tap reload below. If it keeps happening, text us and we can set up the request for you.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[#075c58] px-6 py-3 text-sm font-black text-white shadow-sm"
          >
            Reload request form
          </button>
          <a
            href="sms:4257901330"
            className="rounded-full border border-[#075c58] bg-white px-6 py-3 text-center text-sm font-black text-[#075c58]"
          >
            Text NestHelper
          </a>
        </div>
        <p className="mt-5 text-sm font-semibold text-slate-600">
          You can also text us at <span className="font-black text-[#075c58]">425-790-1330</span>.
        </p>
      </div>
    </main>
  );
}
