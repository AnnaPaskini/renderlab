import { redirect } from 'next/navigation';

export default function CollectionsPage() {
  redirect('/custom?tab=collections');
}
