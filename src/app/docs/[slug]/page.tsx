import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/lib/supabase/server';

type Params = Promise<{ slug: string }>;

export default async function DocPage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from('docs')
    .select('id, title, content, updated_at, categories(name, slug)')
    .eq('slug', slug)
    .maybeSingle();

  if (!doc) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const cat = Array.isArray(doc.categories) ? doc.categories[0] : doc.categories;

  return (
    <article className="bg-white border rounded-md p-8 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-gray-500">
            {cat?.name ?? 'Zonder categorie'} · bijgewerkt {new Date(doc.updated_at).toLocaleDateString('nl-BE')}
          </div>
          <h1 className="text-3xl font-bold mt-1">{doc.title}</h1>
        </div>
        {user && (
          <Link
            href={`/admin/edit/${doc.id}`}
            className="shrink-0 text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50"
          >
            Bewerken
          </Link>
        )}
      </div>

      <div className="prose max-w-none prose-headings:font-semibold prose-a:text-blue-600">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
      </div>
    </article>
  );
}
