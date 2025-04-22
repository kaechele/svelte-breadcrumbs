export type Crumb<Metadata = never> = {
  title?: string;
  url?: string;
  metadata?: Metadata;
};
export type ModuleData<PageData = unknown> = {
  pageTitle?: string;
  getPageTitle?: (pageData: PageData) => string;
};
