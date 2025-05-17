<script>
  import { page } from '$app/stores';
  export let data;
  
  const navItems = [
    { href: '/admin', label: 'Főoldal' },
    { href: '/admin/events', label: 'Események' },
  ];
</script>

{#if data.isLoggedIn}
  <div class="min-h-screen bg-gray-50 dark:bg-slate-900">
    <header class="bg-white shadow dark:bg-slate-800">
      <div class="mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 justify-between">
          <div class="flex">
            <div class="flex flex-shrink-0 items-center">
              <a href="/admin" class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Votebox Admin</a>
            </div>
            <nav class="ml-6 flex space-x-4 items-center">
              {#each navItems as item}
                <a 
                  href={item.href} 
                  class={`px-3 py-2 rounded-md text-sm font-medium ${
                    item.href === '/' ? '' : ($page && $page.url && $page.url.pathname.startsWith(item.href) ? 
                    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 
                    'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white')
                  }`}
                >
                  {item.label}
                </a>
              {/each}
            </nav>
          </div>
          <div class="flex items-center">
            <a href="/admin/logout" class="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white">
              Kijelentkezés
            </a>
          </div>
        </div>
      </div>
    </header>

    <main class="py-8">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
  </div>
{:else}
  <slot />
{/if} 