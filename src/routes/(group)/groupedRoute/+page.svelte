<script module lang="ts">
  import type { PageData } from "./$types";

  // You can set the page title with a function that will be given
  // data from the component in the layout
  export function getPageTitle(pageData: PageData) {
    return "Grouped Page";
  }
</script>

Pages within grouped routes can set a page title.
