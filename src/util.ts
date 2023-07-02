export function normalizeQueryParam(queryParam: string | string[] | undefined) {
  return Array.isArray(queryParam) ? queryParam[0] : queryParam;
}
