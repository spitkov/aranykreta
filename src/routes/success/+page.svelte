<script>
  export let data; // { title, message, isError }
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 text-center">
  <div class="max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg p-8">
    {#if !data.isError}
      <svg class="mx-auto h-16 w-16 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    {:else}
      <svg class="mx-auto h-16 w-16 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    {/if}

    <h1 class="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{data.title}</h1>
    <p class="mt-2 text-base text-gray-600 dark:text-gray-400">{data.message}</p>

    <div class="mt-8">
      <a 
        href="/"
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
      >
        Vissza a főoldalra
      </a>
    </div>
  </div>
</div> 