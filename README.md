# Svelte-Breadcrumbs

- [Usage](#usage)
  - [Install](#install)
  - [Setting up the `Breadcrumb` component](#setting-up-the-breadcrumb-component)
  - [Customizing route titles](#customizing-route-titles)
- [Component Docs](#full-component-docs)

Svelte-Breadcrumbs makes it easy to generate meaningful breadcrumbs by leveraging Svelte's directory structure and [Module Context Exports](https://learn.svelte.dev/tutorial/module-exports).

For example, when navigating to a route such as `/todos/[id]/edit` with the URL Pathname being `/todos/1/edit` you can immediately generate the breadcrumb `todos > 1 > edit`.

Replacing the id `1` with meaningful data such as the todo's `name` proves to be slightly more difficulty. The crux of this issue lies in the fact that we are currently on the `/todos/[id]/edit`page, so any breadcrumb ui elements generated in`/todos/[id]/+page.svelte`or breadcrumb data returned in`/todos/[id]/+page.server.ts` will not be immediately available.

With Svelte-Breadcrumbs, the route id is first split (e.g. `/todos/[id]/edit` -> `['todos', '[id]', 'edit']`) giving us the directory for each route. We then import the `+page.svelte` file from the corresponding directory and access a constant string `pageTitle` or getter function `getPageTitle` that was exported. The getter function is called with the current page's data passed in as a parameter.

The title is then generated with the following priority, each one acting as a fallback for it's greater:

1. Page data `crumbs` property which overrides the entire `crumbs` array
2. `pageTitle: string` variable in the svelte page's module context
3. `getPageTitle(data: PageData) => string` function in the svelte page's module context
4. The value in the original URL route path

Breadcrumb title definition can now exist within the view itself!

One drawback I see is that the glob import in `Breadcrumbs.svelte` may be inefficient, specifically may be storing extra data in memory. This hasn't proven to be an issue for my project, but I'm not completely sure how it would fare in larger projects with more Svelte files...

## Usage

### Install

```bash
$ npm i svelte-breadcrumbs
```

### Setting up the Breadcrumb component

In `+layout.svelte`:

```svelte
<!--
Add the `Breadcrumbs` component and feed in the current page url
and the route id via `page` imported from `$app/state`.
-->
<Breadcrumbs url={$page.url} routeId={$page.route.id}>
  {#snippet children({ crumbs })}
    <div>
      <span><a href="/">Home</a></span>
      <!--
      Loop over the generated crumbs array
      -->
      {#each crumbs as c}
        <span>/</span>
        <span>
          <a href={c.url}>
            {c.title}
          </a>
        </span>
      {/each}
    </div>
  {/snippet}
</Breadcrumbs>
```

In the example above, `Breadcrumbs.svelte` will handle grabbing all of the modules itself under the assumption that all Svelte files exist in `/src/routes/`. If your directory structure is different, you can implement this yourself. If you pass a value in the `routeModules` prop the `Breadcrumbs` component will not try to populate it. You will also need to update the path prefix for your Svelte directory.

```svelte
<script lang="ts">
  let routeModules = $state({} as Record<string, ModuleData<PageData>>);

  onMount(async () => {
    // Note: that the path prefix here is now /src/svelte/
    // Note: eager is required
    routeModules = import.meta.glob("/src/svelte/**/*.svelte", {eager: true});
  })
</script>

<!-- Note: routeModules and globImportPrefix passed through -->
<Breadcrumbs
  url={$page.url}
  routeId={$page.route.id}
  {routeModules}
  globImportPrefix={'/src/svelte/'}
  let:crumbs
>
  <!-- ...-->
</Breadcrumbs>
```

### Customizing route titles

The `Breadcrumbs` component will have access to your Svelte components based on the route id and will be looking for the following exported variables in the [Module Context](https://learn.svelte.dev/tutorial/module-exports):

- `pageTitle: string`
- `getPageTitle: (data: PageData) => string`

`getPageTitle` will receive the value of `$page.data` passed through in the `Breadcrumbs` prop. (see the `Breadcrumbs` usage above).

Here is an example:

```svelte
<script module lang="ts">
  import type { PageData } from "./$types";

  // Getter function
  export function getPageTitle(data: PageData) {
    // When this is undefined it will fall back to the value in the route (in this case the todo id for the route /todos/1/edit)
    return data.todo?.name;
  }
  // Or a constant
  export const pageTitle = 'Random Todo';
</script>
```

## Types

```ts
// The generic type `Metadata` can be specified by the user.
// If unspecified it is expected to never exist on the type.
export type Crumb<Metadata = never> = {
  title?: string; // The default title being the sanitized page inferred from the URL (e.g. Edit)
  url?: string; // The URL of this page (e.g. /todos/1/edit)
  metadata?: Metadata; // Any metadata you want passed through to the Breadcrumbs component
};

// The data we will be grabbing from each +page.svelte file
// The generic type `PageData` is expected to be the `PageData` type passed through from the `+page.svelte` where `getPageTitle` is used (see example above).
export type ModuleData<PageData = unknown> = {
  pageTitle?: string;
  getPageTitle?: (data: PageData) => string;
};
```

## Full Component Docs

## Breadcrumbs

This component will provide an array of `Crumb`s to a single slot. The final `Crumb` will never have a URL as it is the current page.

### Props

#### `routeModules: Record<string, ModuleData<PageData>>`

> Optional

The exported data for each module. If not provided it will be populated on mount with an eager glob import of `"/src/routes/**/*.svelte"` which is SvelteKit specific.

If manually providing this value you should import and then explicitly pass through `PageData` from within your `+page.svelte` or `+layout.svelte` file

Completely disable this feature by passing in an empty value as shown below.

```svelte
<Breadcrumbs routeModules={{}}>
  <!-- ...-->
</Breadcrumbs>
```

#### `relPathToRoutes: string`

> Optional

> Default Value: `'/src/routes/'`

The path to the directory where your Svelte files live. In SvelteKit, if we are on a route `/todo/[id]/` and we have imported the svelte files like so:

`import.meta.glob("/src/routes/**/*.svelte")`

it will produce an object with the following:

```js
{
  '/src/routes/todo/[id]/+page.svelte': ...Promise obj...
}
```

Thus in order to match that file we need to specify the prefix `/src/routes/`. `Breadcrumbs.svelte` will essentially do the following to generate a path to the `+page.svelte` file:

```js
relPathToRoutes + routeId + "/+page.svelte";
```

#### `routeId: string | null | undefined`

> Optional

Route id for the current page. In Sveltekit this is `$page.route.id`.

#### `url: string`

> Required

URL for the current page. Used to generate the url that each breadcrumb should link to when clicked on. In SvelteKit this is `$page.url`.

#### `pageData: PageData`

> Optional

Page Data to pass through to the `getPageTitle` function living in a route's `+page.svelte` file/

The `PageData` type should be imported and then explicitly passed through from within the `+page.svelte` file, as it gets auto-generated by the Svelte compiler. If `PageData` is unspecified it defaults to `unknown`:

```ts
import type { PageData } from "./$types";

export function getPageTitle(pageData: PageData) {
  ...
};
```

#### `crumbs: Crumb<T>[]`

> Optional

A list of `Crumb`s that will override/bypass any breadcrumb generation via routes. In SvelteKit if you pass `$page.data.crumbs` or something similar you will be able to override any bread crumbs via page loads.

#### `skipRoutesWithNoPage: bool`

> Optional

When set to true, it will completely skip rendering breadcrumbs if there is no page for the route.

#### `titleSanitizer: (title: string) => string`

> Optional

> Default Value: `(title) => title.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());`

Each title of the generated `Crumb` items will pass through this function. By default it will add spaces and capitalize (e.g. `myTodos` -> `My Todos`).
