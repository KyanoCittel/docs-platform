import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { deleteDoc } from '../../actions';
import EditDocForm from '@/components/EditDocForm';
import DeleteDocButton from '@/components/DeleteDocButton';

type Params = Promise<{ id: string }>;

export default async function EditDocPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: doc }, { data: categories }] = await Promise.all([
    supabase.from('docs').select('id, title, content, category_id, published, slug').eq('id', id).maybeSingle(),
    supabase.from('categories').select('id, name').order('name'),
  ]);

  if (!doc) notFound();

  const remove = deleteDoc.bind(null, doc.id);

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-gray-600 hover:text-black">← Terug</Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bewerken</h1>
        <Link href={`/docs/${doc.slug}`} className="text-sm text-gray-600 hover:text-black">
          Bekijk live →
        </Link>
      </div>

      <EditDocForm doc={doc} categories={categories ?? []} />

      <div className="border-t pt-4">
        <DeleteDocButton action={remove} />
      </div>
    </div>
  );
}
