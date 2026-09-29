import { PAPER } from "@/i18n/paper";
import type { Locale } from "@/i18n/copy";

export function Paper({ locale }: { locale: Locale }) {
  const doc = PAPER[locale];
  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <p className="font-mono text-xs tracking-widest text-copper">{doc.kicker}</p>
      <h2 className="mt-2 text-3xl leading-tight">{doc.title}</h2>
      <p className="mt-2 font-mono text-xs text-muted">{doc.date}</p>
      <p className="mt-6 text-lg leading-relaxed">{doc.lede}</p>
      {doc.sections.map((section) => (
        <section key={section.heading} className="mt-10">
          <h3 className="text-xl">{section.heading}</h3>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-sm leading-7 text-fg/90">
              {paragraph}
            </p>
          ))}
          {section.formula ? (
            <pre className="mt-4 overflow-x-auto rounded-panel border border-line bg-surface p-4 font-mono text-xs leading-6 text-phosphor">
              {section.formula.join("\n")}
            </pre>
          ) : null}
          {section.table ? (
            <div className="mt-4 overflow-x-auto rounded-panel border border-line">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-surface font-mono text-xs text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">{section.table.headers[0]}</th>
                    <th className="px-3 py-2 font-medium">{section.table.headers[1]}</th>
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map(([left, right]) => (
                    <tr key={left} className="border-t border-line align-top">
                      <td className="px-3 py-2 font-mono text-xs text-copper">{left}</td>
                      <td className="px-3 py-2 leading-6">{right}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ))}
    </article>
  );
}
