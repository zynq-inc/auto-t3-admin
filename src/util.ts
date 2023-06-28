export const normalizeQueryParam = (
  queryParam: string | string[] | undefined
) => (Array.isArray(queryParam) ? queryParam[0] : queryParam);
