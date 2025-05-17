<script>
  export let data;

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Események</h1>
    <a href="/admin/events/new" class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-600">
      Új esemény
    </a>
  </div>

  {#if data.events.length === 0}
    <div class="bg-white shadow overflow-hidden sm:rounded-md dark:bg-slate-800 p-6 text-center">
      <p class="text-gray-500 dark:text-gray-300">Nincsenek még események. Hozzon létre egy újat a fenti gombbal.</p>
    </div>
  {:else}
    <div class="bg-white shadow overflow-hidden sm:rounded-md dark:bg-slate-800">
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        {#each data.events as event}
          <li>
            <a href="/admin/events/{event.id}" class="block hover:bg-gray-50 dark:hover:bg-slate-700">
              <div class="px-4 py-4 sm:px-6">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-indigo-600 truncate dark:text-indigo-400">
                    {event.name}
                  </p>
                  <div class="ml-2 flex-shrink-0 flex">
                    <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                      {event.vote_count} szavazat
                    </p>
                  </div>
                </div>
                <div class="mt-2 sm:flex sm:justify-between">
                  <div class="sm:flex">
                    <p class="flex items-center text-sm text-gray-500 dark:text-gray-300">
                      {event.description || 'Nincs leírás'}
                    </p>
                  </div>
                  <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 dark:text-gray-300">
                    <p>
                      Létrehozva: {formatDate(event.created_at)}
                    </p>
                  </div>
                </div>
                <div class="mt-2 flex justify-between text-sm">
                  <div class="flex space-x-4">
                    <span class="text-gray-500 dark:text-gray-300">{event.teacher_count} tanár</span>
                    <span class="text-gray-500 dark:text-gray-300">{event.class_count} osztály</span>
                    <span class="text-gray-500 dark:text-gray-300">{event.code_count} kód</span>
                  </div>
                </div>
              </div>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div> 