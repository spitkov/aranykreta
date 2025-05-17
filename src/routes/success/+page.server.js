export function load({ url }) {
  const status = url.searchParams.get('status');
  const code = url.searchParams.get('code');

  let message = "Köszönjük a részvételt!";
  let title = "Sikeres Szavazás!";
  let isError = false;

  if (status === 'already_submitted') {
    title = "Kód már felhasználva";
    message = `A(z) ${code || ''} kódot már korábban felhasználták szavazásra.`;
    isError = true;
  } else if (status === 'submitted') {
    // Standard success, default messages are fine
    // message = `A szavazatod a ${code || ''} kóddal sikeresen rögzítve.`;
  }

  return {
    title,
    message,
    isError
  };
} 