import Link from "next/link"
import Image from "next/image"

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      {/* Nav Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-16 py-4 border-b border-orange-900/50 backdrop-blur-sm bg-black/60">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Night Vision"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <div className="h-px w-12 bg-gradient-to-r from-white to-transparent" />
        </div>
        <Link
          href="/"
          className="text-xs tracking-[0.3em] uppercase text-neutral-500 hover:text-orange-400 transition-colors duration-300"
        >
          ← Back
        </Link>
      </nav>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col px-6 md:px-16 pt-28 pb-12">
        {/* Main Content */}
        <div className="max-w-3xl mx-auto w-full flex-1">
          {/* Header */}
          <div className="mb-12 space-y-4">
            <h1 className="no-arcade text-5xl md:text-7xl font-light tracking-tight">
              <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                Datenschutz
              </span>
            </h1>
            <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
              Datenschutzerklärung — Night Vision Visuals
            </p>
            <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
          </div>

          {/* Content Sections */}
          <div className="space-y-10 text-neutral-300 font-light leading-relaxed">

            <section>
              <h2 className="no-arcade text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                1. Verantwortlicher
              </h2>
              <p className="text-sm">
                Verantwortlicher im Sinne der Datenschutzgrundverordnung (DSGVO) ist Night Vision Visuals.
                Bei Fragen zum Datenschutz kannst du uns unter <a href="mailto:info@nightvision-events.com" className="hover:text-orange-400 transition-colors duration-300">info@nightvision-events.com</a> kontaktieren.
              </p>
            </section>

            <section>
              <h2 className="no-arcade text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                2. Erhobene Daten
              </h2>
              <p className="text-sm mb-3">
                Im Rahmen des Bewerbungsprozesses erheben wir folgende personenbezogene Daten:
              </p>
              <ul className="text-sm space-y-2 list-disc list-inside text-neutral-400">
                <li>Vorname und Nachname</li>
                <li>Geburtsdatum</li>
                <li>E-Mail-Adresse</li>
                <li>Instagram-Handle (optional)</li>
                <li>Geschlecht</li>
                <li>Wie du von der Veranstaltung erfahren hast</li>
                <li>Kurzvorstellung (optional)</li>
              </ul>
            </section>

            <section>
              <h2 className="no-arcade text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                3. Zweck der Datenverarbeitung
              </h2>
              <p className="text-sm">
                Die erhobenen Daten werden ausschließlich zur Bearbeitung deiner Bewerbung für unsere
                Veranstaltungen verwendet. Sie dienen der Überprüfung der Teilnahmevoraussetzungen
                (Mindestalter 18 Jahre) sowie der Organisation und Durchführung der Veranstaltung.
                Deine Daten werden nicht an Dritte weitergegeben oder für Werbezwecke genutzt.
              </p>
            </section>

            <section>
              <h2 className="no-arcade text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                4. Speicherdauer
              </h2>
              <p className="text-sm">
                Deine Daten werden nach Abschluss der jeweiligen Veranstaltung gelöscht, spätestens
                jedoch 6 Monate nach Einreichung deiner Bewerbung, sofern keine gesetzlichen
                Aufbewahrungspflichten bestehen.
              </p>
            </section>

            <section>
              <h2 className="no-arcade text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                5. Deine Rechte
              </h2>
              <p className="text-sm mb-3">
                Gemäß DSGVO stehen dir folgende Rechte zu:
              </p>
              <ul className="text-sm space-y-2 list-disc list-inside text-neutral-400">
                <li>Recht auf Auskunft über deine gespeicherten Daten (Art. 15 DSGVO)</li>
                <li>Recht auf Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
                <li>Recht auf Löschung deiner Daten (Art. 17 DSGVO)</li>
                <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
              </ul>
              <p className="text-sm mt-3">
                Zur Ausübung dieser Rechte wende dich bitte an <a href="mailto:info@nightvision-events.com" className="hover:text-orange-400 transition-colors duration-300">info@nightvision-events.com</a>.
              </p>
            </section>

            <section>
              <h2 className="no-arcade text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                6. Datensicherheit
              </h2>
              <p className="text-sm">
                Wir setzen technische und organisatorische Maßnahmen ein, um deine Daten vor
                unbefugtem Zugriff, Verlust oder Missbrauch zu schützen. Die Übertragung deiner
                Daten erfolgt verschlüsselt über HTTPS.
              </p>
            </section>

            <section>
              <h2 className="no-arcade text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                7. Einwilligung
              </h2>
              <p className="text-sm">
                Mit dem Absenden deiner Bewerbung erklärst du dich ausdrücklich damit einverstanden,
                dass wir deine oben genannten Daten zum Zweck der Bewerbungsbearbeitung verarbeiten.
                Du kannst diese Einwilligung jederzeit widerrufen.
              </p>
            </section>

            <section>
              <h2 className="no-arcade text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
                8. Beschwerderecht
              </h2>
              <p className="text-sm">
                Du hast das Recht, dich bei einer Datenschutzaufsichtsbehörde zu beschweren.
                In Österreich ist dies die Datenschutzbehörde (DSB), Barichgasse 40-42, 1030 Wien.
              </p>
            </section>

            <div className="h-px bg-gradient-to-r from-neutral-800 via-neutral-800 to-transparent" />

            <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-600">
              Stand: {new Date().getFullYear()} — Night Vision Visuals, Wien
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-16 pt-8 border-t border-orange-900">
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
