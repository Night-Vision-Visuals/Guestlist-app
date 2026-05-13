import Link from "next/link"

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col px-6 md:px-16 py-12">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-16">
          <div className="space-y-1">
            <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">
              Night Vision
            </div>
            <div className="h-px w-12 bg-gradient-to-r from-white to-transparent" />
          </div>
          <Link
            href="/login"
            className="text-xs tracking-[0.3em] uppercase text-neutral-500 hover:text-white transition-colors duration-300"
          >
            ← Zurück
          </Link>
        </div>

        {/* Main Content */}
        <div className="max-w-3xl mx-auto w-full flex-1">
          {/* Header */}
          <div className="mb-12 space-y-4">
            <h1 className="text-5xl md:text-7xl font-light tracking-tight">
              <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                Impressum
              </span>
            </h1>
            <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
              Angaben gemäß § 5 ECG
            </p>
            <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
          </div>

          {/* Content Sections */}
          <div className="space-y-10 text-neutral-300 font-light leading-relaxed">

            <section>
              <h2 className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                Betreiber
              </h2>
              <p className="text-sm">
                [Vor- und Nachname / Unternehmensname]
              </p>
            </section>

            <section>
              <h2 className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                Adresse
              </h2>
              <p className="text-sm">
                [Straße und Hausnummer]<br />
                [PLZ] [Ort]<br />
                Österreich
              </p>
            </section>

            <section>
              <h2 className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                Kontakt
              </h2>
              <p className="text-sm">
                E-Mail: [email@example.com]<br />
                Instagram: [@nightvisionvisuals]
              </p>
            </section>

            <section>
              <h2 className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                Unternehmensgegenstand
              </h2>
              <p className="text-sm">
                Veranstaltungsorganisation und Eventmanagement
              </p>
            </section>

            <section>
              <h2 className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                Haftungsausschluss
              </h2>
              <p className="text-sm">
                Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt.
                Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernehmen
                wir jedoch keine Gewähr. Als Diensteanbieter sind wir für eigene Inhalte
                auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
              </p>
            </section>

            <section>
              <h2 className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                Urheberrecht
              </h2>
              <p className="text-sm">
                Die durch den Betreiber erstellten Inhalte und Werke auf dieser Website
                unterliegen dem österreichischen Urheberrecht. Die Vervielfältigung,
                Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen
                des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen
                Autors bzw. Erstellers.
              </p>
            </section>

            <div className="h-px bg-gradient-to-r from-neutral-800 via-neutral-800 to-transparent" />

            <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-600">
              Stand: {new Date().getFullYear()} — Night Vision Visuals, Wien
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-16 pt-8 border-t border-neutral-800">
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
            Night Vision Visuals
          </div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
            © 2026
          </div>
        </div>
      </div>
    </div>
  )
}
