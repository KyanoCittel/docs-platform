'use client';

import { useActionState } from 'react';
import DocEditor from '@/components/DocEditor';
import SubmitButton from '@/components/SubmitButton';
import { updateDoc, type ActionState } from '@/app/admin/actions';
import { useToastOnAction } from '@/components/Toast';

type Category = { id: string; name: string };
type Doc = {
  id: string;
  title: string;
  content: string;
  category_id: string | null;
  published: boolean;
};

export default function EditDocForm({
  doc,
  categories,
}: {
  doc: Doc;
  categories: Category[];
}) {
  const action = updateDoc.bind(null, doc.id);
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);
  useToastOnAction(state);

  return (
    <form action={formAction} className="space-y-4">
      <DocEditor categories={categories} doc={doc} />
      <div className="flex items-center justify-end gap-3">
        {state && (
          <span
            className={`text-sm ${state.ok ? 'text-green-600' : 'text-red-600'}`}
            role="status"
            aria-live="polite"
          >
            {state.ok ? '✓ ' : '✗ '}
            {state.message}
          </span>
        )}
        <SubmitButton pendingLabel="Opslaan...">Opslaan</SubmitButton>
      </div>
    </form>
  );
}
