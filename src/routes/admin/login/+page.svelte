<script>
  import { enhance } from '$app/forms';
  export let form;
</script>

<div class="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-900">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Admin belépés</h2>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {#if form?.error}
        <div class="bg-red-100 dark:bg-red-800 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded mb-4" role="alert">
          <strong class="font-bold">Hiba!</strong>
          <span class="block sm:inline">{form.message}</span>
        </div>
      {/if}
      
      <form class="space-y-6" method="POST" use:enhance>
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Felhasználónév</label>
          <div class="mt-1">
            <input id="username" name="username" type="text" required class="block w-full appearance-none rounded-md border border-gray-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white">
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Jelszó</label>
          <div class="mt-1">
            <input id="password" name="password" type="password" required class="block w-full appearance-none rounded-md border border-gray-300 dark:border-slate-600 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white">
          </div>
        </div>

        <div>
          <button type="submit" class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-600">
            Belépés
          </button>
        </div>
      </form>
    </div>
  </div>
</div> 