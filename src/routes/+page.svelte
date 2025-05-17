<script>
  import { enhance } from '$app/forms';
  export let form;

  // Step logic and selectedTeacher are removed
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
  <div class="max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg p-8">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Aranykréta
      </h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Szavazás valami
      </p>
    </div>

    {#if form?.error}
      <div class="mt-4 bg-red-100 dark:bg-red-800 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded-md" role="alert">
        <strong class="font-bold">Hiba!</strong>
        <span class="block sm:inline">{form.message}</span>
      </div>
    {/if}

    <div class="mt-8">
      <form method="POST" action="?/checkCode" use:enhance>
        <label for="code" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Szavazókód
        </label>
        <div class="mt-1">
          <input
            type="text"
            id="code"
            name="code"
            required
            placeholder="pl. 5A-1234"
            value={form?.codeValue || ''}
            class="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white"
          />
        </div>
        <div class="mt-4">
          <button
            type="submit"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Tovább
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
