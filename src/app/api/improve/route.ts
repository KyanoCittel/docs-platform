import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Geen toestemming' }, { status: 403 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY ontbreekt' }, { status: 500 });
  }

  const { title, content } = (await request.json()) as { title?: string; content?: string };
  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Lege inhoud' }, { status: 400 });
  }

  const prompt = `Je bent een technisch redacteur. Herschrijf onderstaande ruwe tekst naar nette, goed gestructureerde Markdown.

Regels:
- Behoud de betekenis en feiten exact. Niets verzinnen of weglaten.
- Gebruik Markdown: # voor hoofdtitel (alleen als er geen titel gegeven is), ## en ### voor secties, bullet lists, genummerde lijsten, **bold** waar gepast, \`code\` voor code/commando's, code blokken met taal-tag voor langere code.
- Verbeter spelling, grammatica en zinsbouw (Nederlands).
- Splits lange alinea's in leesbare stukken.
- Antwoord ALLEEN met de Markdown, geen inleiding of uitleg, geen \`\`\`markdown\`\`\` wrapper.

${title ? `Titel van het document: "${title}"\n` : ''}Ruwe tekst:
---
${content}
---`;

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json({ error: `Gemini: ${errText}` }, { status: 502 });
  }

  const data = await res.json();
  const improved: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!improved) {
    return NextResponse.json({ error: 'Geen antwoord van Gemini' }, { status: 502 });
  }

  const cleaned = improved
    .replace(/^```(?:markdown|md)?\s*\n/i, '')
    .replace(/\n```\s*$/i, '')
    .trim();

  return NextResponse.json({ content: cleaned });
}
