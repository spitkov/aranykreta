<script>
  import { enhance } from '$app/forms';
  export let data; // Loaded by +page.server.js: { event, teacherNames }
  export let form; // For form action errors

  // Form variables, initialized from `data` or `form` (if validation failed)
  let eventName = form?.data?.name || data.event.name || '';
  let eventDescription = form?.data?.description || data.event.description || '';
  let teacherNames = form?.data?.teacherNames || data.teacherNames || '';
  let maxVotesPerCode = form?.data?.max_votes_per_code || data.event.max_votes_per_code || 1;
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Esemény Szerkesztése: {data.event.name}</h1>
  </div>
  
  {#if form?.error}
    <div class="bg-red-100 dark:bg-red-800 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded" role="alert">
      <strong class="font-bold">Hiba!</strong>
      <span class="block sm:inline">{form.message}</span>
      {#if form.errors}
        <ul class="list-disc list-inside mt-2">
          {#each Object.entries(form.errors) as [field, messages]}
            {#each messages as message}
              <li class="text-sm">{field}: {message}</li>
            {/each}
          {/each}
        </ul>
      {/if}
    </div>
  {/if}

  <div class="bg-white shadow overflow-hidden sm:rounded-lg dark:bg-slate-800">
    <form method="POST" use:enhance class="space-y-6 p-6">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Esemény neve</label>
        <input 
          type="text" 
          name="name" 
          id="name" 
          required 
          class="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white" 
          bind:value={eventName}
        />
      </div>
      
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Leírás (opcionális)</label>
        <textarea 
          name="description" 
          id="description" 
          rows="3" 
          class="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white" 
          bind:value={eventDescription}
        ></textarea>
      </div>
      
      <div>
        <label for="teacherNames" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tanárok (minden tanár új sorban)
        </label>
        <textarea 
          name="teacherNames" 
          id="teacherNames" 
          rows="10" 
          required 
          class="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono dark:text-white" 
          placeholder="Példa Tanár 1\nPélda Tanár 2\nPélda Tanár 3" 
          bind:value={teacherNames}
        ></textarea>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Minden tanár nevét külön sorba írja. Csak ezek a tanárok lesznek elérhetőek szavazáskor.
        </p>
      </div>

      <div>
        <label for="max_votes_per_code" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Engedélyezett szavazatok száma kódonként</label>
        <input 
          type="number" 
          name="max_votes_per_code" 
          id="max_votes_per_code" 
          min="1" 
          required 
          class="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white"
          bind:value={maxVotesPerCode}
        />
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Meghatározza, hány tanárra szavazhat egy felhasználó egyetlen kóddal (pl. 1 vagy 2).
        </p>
      </div>
      
      <div class="flex justify-end">
        <a 
          href="/admin/events/{data.event.id}" 
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-slate-600"
        >
          Mégse
        </a>
        <button 
          type="submit" 
          class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          Mentés
        </button>
      </div>
    </form>
  </div>
</div> 