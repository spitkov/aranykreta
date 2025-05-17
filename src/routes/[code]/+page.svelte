<script>
  import { enhance } from '$app/forms';
  export let data; // Loaded by +page.server.js: { code, event: {..., max_votes_per_code}, teachers }
  export let form; // For form action errors

  let selectedTeachers = []; 
  let maxVotes;
  $: maxVotes = data.event?.max_votes_per_code || 1;
  $: isSubmitDisabled = (maxVotes === 1 ? selectedTeachers.length !== 1 : selectedTeachers.length !== maxVotes);

  function handleSelection(event) {
    const value = event.target.value; // teacher.id as a string
    const isChecked = event.target.checked;

    if (maxVotes === 1) { 
        selectedTeachers = [value];
        return;
    }
    // Checkbox logic for maxVotes > 1
    if (isChecked) {
      if (selectedTeachers.length < maxVotes) {
        selectedTeachers = [...selectedTeachers, value];
      } else {
        event.target.checked = false; // Prevent checking more than allowed
        alert(`Legfeljebb ${maxVotes} tanárt választhat.`); // Corrected alert message
      }
    } else {
      selectedTeachers = selectedTeachers.filter(id => id !== value);
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
  <div class="max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg p-8">
    {#if data.event}
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{data.event.name}</h1>
        {#if data.event.description}
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{data.event.description}</p>
        {/if}
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-500">Szavazókód: {data.code}</p>
        {#if maxVotes > 1}
          <p class="mt-1 text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
            <!-- Válasszon pontosan {maxVotes} tanárt. Jelenleg kiválasztva: {selectedTeachers.length} -->
            {maxVotes === 1 ? 'Válasszon egy tanárt' : `Válasszon ${maxVotes} tanárt.`} Jelenleg: {selectedTeachers.length}
          </p>
        {/if}
      </div>

      {#if form?.error}
        <div class="mb-4 bg-red-100 dark:bg-red-800 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded-md" role="alert">
          <strong class="font-bold">Hiba!</strong>
          <span class="block sm:inline">{form.message}</span>
        </div>
      {/if}

      <form method="POST" use:enhance>
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Válassz tanárt</h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {maxVotes === 1 ? 'Kérjük, válassza ki azt a tanárt, akire szavazni szeretne.' : `Kérjük, válasszon ${maxVotes} tanárt.`}
          </p>
        </div>
        
        {#if data.teachers && data.teachers.length > 0}
          <div class="space-y-2">
            {#each data.teachers as teacher}
              <div class="relative">
                <input
                  type={maxVotes > 1 ? "checkbox" : "radio"} 
                  id="teacher-{teacher.id}"
                  name="teacherId"
                  value={teacher.id} 
                  class="hidden peer"
                  required={maxVotes === 1 && selectedTeachers.length === 0}
                  checked={selectedTeachers.includes(teacher.id.toString())}
                  on:change={handleSelection}
                />
                <label
                  for="teacher-{teacher.id}"
                  class="flex p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 dark:peer-checked:bg-indigo-900 peer-checked:border-2 transition-colors duration-150"
                >
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{teacher.name}</span>
                </label>
              </div>
            {/each}
          </div>
          
          <div class="mt-6">
            <button
              type="submit"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              disabled={isSubmitDisabled}
            >
              Szavazás leadása
            </button>
          </div>
        {:else}
          <p class="text-center text-gray-500 dark:text-gray-400">Nincsenek tanárok rendelve ehhez az eseményhez.</p>
        {/if}
      </form>
    {:else}
      <p class="text-center text-red-500 dark:text-red-400">Hiba: Az esemény adatai nem töltődtek be.</p>
    {/if}
  </div>
</div> 