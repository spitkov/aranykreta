<script>
  import { enhance } from '$app/forms';
  import { slide } from 'svelte/transition';
  export let data;
  export let form;

  let showCodesForClass = {}; // Object to track visibility for each class

  function toggleShowCodes(classId) {
    showCodesForClass[classId] = !showCodesForClass[classId];
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Calculate class participation percentage
  function getParticipationPercent(classData) {
    if (!classData.student_count || classData.student_count === 0) return 0;
    if (!classData.code_count) return 0;
    
    const usedCount = classData.used_count || 0;
    return Math.round((usedCount / classData.student_count) * 100);
  }
</script>

<div class="space-y-6">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {data.event.name}
        {#if data.event.category && data.event.category !== 'Minden Osztály'}
          <span class="ml-2 text-base font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">{data.event.category}</span>
        {/if}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Létrehozva: {formatDate(data.event.created_at)}
      </p>
    </div>
    <div class="mt-4 md:mt-0 flex space-x-2">
      <a href="/admin/events/{data.event.id}/results" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600">
        Eredmények
      </a>
      <a href="/admin/events/{data.event.id}/pdf" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-500 dark:hover:bg-purple-600">
        PDF Generálása
      </a>
      <a href="/admin/events/{data.event.id}/export/votes.json" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:bg-teal-500 dark:hover:bg-teal-600" download>
        Szavazatok Exportálása (JSON)
      </a>
      <a href="/admin/events/{data.event.id}/edit" class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-slate-600">
        Szerkesztés
      </a>
    </div>
  </div>

  {#if data.event.description}
    <div class="bg-white shadow sm:rounded-lg dark:bg-slate-800">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Leírás</h3>
        <div class="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-300">
          <p>{data.event.description}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Stats -->
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
    <div class="bg-white overflow-hidden shadow rounded-lg dark:bg-slate-800">
      <div class="px-4 py-5 sm:p-6">
        <dt class="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
          Engedélyezett szavazatok / kód
        </dt>
        <dd class="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
          {data.event.max_votes_per_code}
        </dd>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg dark:bg-slate-800">
      <div class="px-4 py-5 sm:p-6">
        <dt class="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
          Összes tanár
        </dt>
        <dd class="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
          {data.stats.teacher_count}
        </dd>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg dark:bg-slate-800">
      <div class="px-4 py-5 sm:p-6">
        <dt class="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
          Osztályok
        </dt>
        <dd class="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
          {data.stats.class_count}
        </dd>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg dark:bg-slate-800">
      <div class="px-4 py-5 sm:p-6">
        <dt class="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
          Generált kódok
        </dt>
        <dd class="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
          {data.stats.code_count}
        </dd>
      </div>
    </div>

    <div class="bg-white overflow-hidden shadow rounded-lg dark:bg-slate-800">
      <div class="px-4 py-5 sm:p-6">
        <dt class="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
          Leadott szavazatok
        </dt>
        <dd class="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
          {data.stats.vote_count}
        </dd>
      </div>
    </div>
  </div>

  <!-- Sections -->
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <!-- Teachers -->
    <div class="bg-white shadow sm:rounded-lg dark:bg-slate-800">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          Tanárok ({data.teachers.length})
        </h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Az eseményhez rendelt tanárok listája. Add meg, hogy az adott tanár hány diákot tanít ebben az eseménykategóriában.
        </p>
        {#if form?.formName === 'teacherStudentCounts' && form?.message}
          <div class="mt-2 text-sm {form.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
            {form.message}
          </div>
        {/if}
      </div>
      <div class="border-t border-gray-200 dark:border-gray-700">
        {#if data.teachers.length === 0}
          <div class="px-4 py-5 sm:px-6 text-center text-gray-500 dark:text-gray-400">
            Nincsenek tanárok rendelve ehhez az eseményhez.
          </div>
        {:else}
          <form method="POST" action="?/updateAllTeacherStudentCounts" use:enhance>
            <input type="hidden" name="eventId" value={data.event.id} />
            <ul class="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {#each data.teachers as teacher (teacher.id)}
                <li class="px-4 py-3 sm:px-6">
                  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                    <p class="text-sm font-medium text-gray-900 dark:text-white flex-grow mb-2 sm:mb-0">
                      {teacher.name}
                    </p>
                    <div class="flex items-center space-x-2">
                      <input type="hidden" name="teacherIds" value={teacher.id} />
                      <label for="studentsTaughtCount-{teacher.id}" class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Tanított diákok:</label>
                      <input 
                        type="number" 
                        name="studentsTaughtCounts" 
                        id="studentsTaughtCount-{teacher.id}"
                        value={teacher.students_taught_count} 
                        min="0"
                        required
                        class="w-20 py-1 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
            <div class="px-4 py-3 sm:px-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button 
                type="submit" 
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600"
              >
                Tanított diáklétszámok mentése
              </button>
            </div>
          </form>
        {/if}
      </div>
    </div>

    <!-- Classes -->
    <div class="bg-white shadow sm:rounded-lg dark:bg-slate-800">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          Osztályok ({data.classes.length})
        </h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Állítsa be az osztályok létszámát és generáljon kódokat.
        </p>
      </div>
      
      <div class="px-4 py-3 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <form method="POST" action="?/setAllDefaults" use:enhance class="flex justify-end">
          <input type="hidden" name="eventId" value={data.event.id} />
          <button 
            type="submit" 
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:bg-sky-500 dark:hover:bg-sky-600"
          >
            Beállítások Alaphelyzetbe (30 fő/osztály & Kódgenerálás)
          </button>
        </form>
      </div>

      {#if form?.message && form?.formName !== 'teacherStudentCounts' && !form?.generatedClass && form?.formName !== 'updateClass'}
        <div class="mx-4 my-2 {form?.success ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100' : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100'} p-3 rounded-md text-sm">
          {form.message}
        </div>
      {/if}

      <div class="border-t border-gray-200 dark:border-gray-700">
        {#if data.classes.length === 0}
          <div class="px-4 py-5 sm:px-6 text-center text-gray-500 dark:text-gray-400">
            Nincsenek osztályok.
          </div>
        {:else}
          <ul class="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
            {#each data.classes as classData}
              <li class="px-4 py-4 sm:px-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex-1">
                    <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                      {classData.grade}.{classData.section} osztály
                      {#if classData.category}
                        <span class="text-xs ml-2 px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300">{classData.category}</span>
                      {/if}
                    </h4>
                    
                    <!-- Progress bar for participation -->
                    <div class="mt-2">
                      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-300">
                        <div>
                          {#if classData.used_count}
                            <span class="font-medium text-indigo-600 dark:text-indigo-400">{classData.used_count}</span> /{' '}
                          {/if}
                          {classData.student_count || 0} tanuló
                        </div>
                        <div>
                          <span class="{getParticipationPercent(classData) > 50 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'} font-medium">
                            {getParticipationPercent(classData)}%
                          </span>
                        </div>
                      </div>
                      <div class="mt-1 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div class="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full" style="width: {getParticipationPercent(classData)}%"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="mt-4 flex flex-col sm:flex-row sm:space-x-2">
                  <!-- Student count form -->
                  <form 
                    method="POST" 
                    action="?/updateClass" 
                    use:enhance 
                    class="mt-2 sm:mt-0 flex space-x-2"
                  >
                    <input type="hidden" name="eventId" value={data.event.id} />
                    <input type="hidden" name="classId" value={classData.id} />
                    <input 
                      type="number" 
                      name="studentCount" 
                      value={classData.student_count} 
                      min="0" 
                      class="w-20 py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                    />
                    <button 
                      type="submit" 
                      class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                      Mentés
                    </button>
                  </form>
                  
                  <!-- Code generation form -->
                  <form 
                    method="POST" 
                    action="?/generateCodes" 
                    use:enhance 
                    class="mt-2 sm:mt-0"
                  >
                    <input type="hidden" name="eventId" value={data.event.id} />
                    <input type="hidden" name="classId" value={classData.id} />
                    <button 
                      type="submit" 
                      class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600"
                      disabled={classData.student_count <= 0 || classData.student_count <= classData.code_count}
                    >
                      {#if classData.student_count <= 0}
                        Adj meg létszámot
                      {:else if classData.student_count <= classData.code_count}
                        Elegendő kód
                      {:else if classData.code_count > 0 && classData.student_count > classData.code_count}
                        További kódok ({classData.student_count - classData.code_count} db)
                      {:else}
                        Kódok generálása ({classData.student_count} db)
                      {/if}
                    </button>
                  </form>
                </div>

                <div class="mt-4">
                  <button 
                    type="button"
                    on:click={() => toggleShowCodes(classData.id)}
                    class="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    {showCodesForClass[classData.id] ? 'Kódok elrejtése' : `Kódok (${classData.codes.length}) megjelenítése`}
                    <span aria-hidden="true">{showCodesForClass[classData.id] ? ' ▲' : ' ▼'}</span>
                  </button>
                </div>

                {#if showCodesForClass[classData.id] && classData.codes.length > 0}
                  <div transition:slide={{duration: 200}} class="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <h5 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Kódok</h5>
                    <ul class="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {#each classData.codes as codeItem}
                        <li class="p-2 border rounded-md dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50">
                          <div class="flex justify-between items-center">
                            <span class="font-mono text-sm text-gray-800 dark:text-gray-200">{codeItem.code}</span>
                            {#if codeItem.used}
                              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                                Leadva
                              </span>
                            {:else}
                              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                Elérhető
                              </span>
                            {/if}
                          </div>
                          {#if codeItem.used && codeItem.voted_teachers_names}
                            <div class="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              Szavazat(ok): <span class="font-medium">{codeItem.voted_teachers_names}</span>
                            </div>
                          {/if}
                        </li>
                      {/each}
                    </ul>
                  </div>
                {:else if showCodesForClass[classData.id] && classData.codes.length === 0}
                    <div transition:slide={{duration: 200}} class="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                        <p class="text-sm text-gray-500 dark:text-gray-400">Nincsenek generált kódok ehhez az osztályhoz.</p>
                    </div>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </div>
</div> 