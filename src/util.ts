export function normalizeQueryParam(queryParam: string | string[] | undefined) {
  return Array.isArray(queryParam) ? queryParam[0] : queryParam;
}

export function getBaseURI() {
  const baseURI = document.body.baseURI;
  const href = location.href;
  if (baseURI == href) {
    return "/admin";
  } else {
    return baseURI;
  }
}
