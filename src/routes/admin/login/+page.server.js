import { ADMIN_USERNAME, ADMIN_PASSWORD } from '$env/static/private';
import { fail, redirect } from '@sveltejs/kit';

export function load({ cookies }) {
  // If already logged in, redirect to admin home
  if (cookies.get('admin_logged_in') === 'true') {
    throw redirect(303, '/admin');
  }
}

export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username');
    const password = data.get('password');

    if (!username || !password) {
      return fail(400, {
        error: true,
        message: 'Felhasználónév és jelszó megadása kötelező'
      });
    }

    // Compare with environment variables
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Set cookie for authentication
      cookies.set('admin_logged_in', 'true', {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 // 1 day
      });

      throw redirect(303, '/admin');
    } else {
      return fail(400, {
        error: true,
        message: 'Hibás felhasználónév vagy jelszó'
      });
    }

    // In a real app, you would properly hash and compare the password
    // const admin = db.prepare(
    //   'SELECT * FROM admins WHERE username = ? AND password_hash = ?'
    // ).get(username, password);

    // if (!admin) {
    //   return fail(400, {
    //     error: true,
    //     message: 'Hibás felhasználónév vagy jelszó'
    //   });
    // }

    // Set cookie for authentication
    // cookies.set('admin_logged_in', 'true', {
    //   path: '/',
    //   httpOnly: true,
    //   sameSite: 'strict',
    //   secure: process.env.NODE_ENV === 'production',
    //   maxAge: 60 * 60 * 24 // 1 day
    // });

    // throw redirect(303, '/admin');
  }
}; 