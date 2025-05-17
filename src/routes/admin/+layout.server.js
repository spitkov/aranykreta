import { redirect } from '@sveltejs/kit';

export function load({ cookies, url }) {
  const isLoggedIn = cookies.get('admin_logged_in') === 'true';
  
  // If not logged in and not trying to log in, redirect to login
  if (!isLoggedIn && !url.pathname.includes('/admin/login')) {
    throw redirect(303, '/admin/login');
  }
  
  return {
    isLoggedIn
  };
} 