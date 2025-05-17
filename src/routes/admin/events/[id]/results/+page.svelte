<script>
  export let data;

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

  // The getPercentage function is no longer needed here as percentage is pre-calculated in load
</script>

<div class="space-y-6">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Eredmények: {data.event.name}
        {#if data.event.category && data.event.category !== 'Minden Osztály'}
          <span class="ml-2 text-base font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">({data.event.category})</span>
        {/if}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Létrehozva: {formatDate(data.event.created_at)}
      </p>
    </div>
    <div class="mt-4 md:mt-0">
      <a href="/admin/events/{data.event.id}" class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-slate-600">
        Vissza az eseményhez
      </a>
    </div>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          {data.event.category && data.event.category !== 'Minden Osztály' ? data.event.category + " osztályok" : "Összes osztály"}
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

  <!-- Overall Results by Percentage -->
  <div class="bg-white shadow overflow-hidden sm:rounded-lg dark:bg-slate-800">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
        Összesített eredmények (Százalékos arány alapján)
      </h3>
      <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
        A tanárok eredménye a megadott diáklétszámukhoz viszonyított szavazatok alapján.
        {#if data.event.category && data.event.category !== 'Minden Osztály'}
          <span class="block font-semibold">Kategória: {data.event.category}</span>
        {/if}
      </p>
    </div>
    <div class="border-t border-gray-200 dark:border-gray-700">
      {#if !data.overallResults || data.overallResults.length === 0}
        <div class="px-4 py-5 sm:px-6 text-center text-gray-500 dark:text-gray-400">
          Még nincsenek feldolgozható eredmények vagy nincsenek tanárok az eseményhez rendelve.
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Helyezés</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Tanár</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Kapott szavazatok</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Tanított diákok (eseményben)</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Eredmény (%)</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-gray-700">
              {#each data.overallResults as result, i}
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{i + 1}.</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{result.name}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right dark:text-gray-300">{result.vote_count}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right dark:text-gray-300">
                    {result.students_taught_count}
                    {#if result.students_taught_count === 0 && result.vote_count > 0}
                      <span class="ml-1 text-xs text-amber-600 dark:text-amber-400">(Figyelem: 0 tanított diák!)</span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="flex items-center justify-end">
                      <span class="text-sm text-gray-900 dark:text-white font-semibold">{result.percentage}%</span>
                      <div class="ml-3 w-32 bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                        <div 
                          class="bg-indigo-600 h-4 rounded-full dark:bg-indigo-500 text-xs font-medium text-blue-100 text-center p-0.5 leading-none"
                          style="width: {result.percentage}%; min-width: {result.percentage > 0 ? '20px' : '0'};"
                        >
                          {#if result.percentage > 5}{result.percentage}%{/if}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>

  <!-- Class by Class Results (Commented out as per server-side changes) -->
  <!--
  <div class="bg-white shadow overflow-hidden sm:rounded-lg dark:bg-slate-800">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
        Eredmények osztályonként
      </h3>
      <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
        Az eredmények osztályokra lebontva.
      </p>
    </div>
    <div class="border-t border-gray-200 dark:border-gray-700">
      {#if !data.classByClass || data.classByClass.length === 0}
        <div class="px-4 py-5 sm:px-6 text-center text-gray-500 dark:text-gray-400">
          Még nincsenek osztályokra lebontott eredmények.
        </div>
      {:else}
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each data.classByClass as classData}
            <div class="px-4 py-4 sm:px-6">
              <h4 class="text-md font-semibold text-gray-900 dark:text-white">
                {classData.grade}.{classData.section} osztály
              </h4>
              
              <div class="mt-3 overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Tanár
                      </th>
                      <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Szavazatok
                      </th>
                      <th scope="col" class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Százalék
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-gray-700">
                    {#each classData.results as result}
                      <tr>
                        <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {result.name}
                        </td>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right dark:text-gray-300">
                          {result.vote_count} szavazat
                        </td>
                        <td class="px-3 py-2 whitespace-nowrap text-right">
                          <div class="flex items-center justify-end">
                            <span class="text-sm text-gray-900 dark:text-white font-medium">
                              {getPercentage(result.vote_count, result.total_class_votes)}%
                            </span>
                            <div class="ml-3 w-24 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div class="bg-indigo-600 h-2.5 rounded-full dark:bg-indigo-500" style="width: {getPercentage(result.vote_count, result.total_class_votes)}%"></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  -->
</div> 