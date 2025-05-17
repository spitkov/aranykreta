import { redirect } from '@sveltejs/kit';

export function GET({ cookies }) {
  cookies.delete('admin_logged_in', { path: '/' });
  throw redirect(303, '/admin/login');
} 