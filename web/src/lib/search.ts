/** Limpia texto de búsqueda para usarlo dentro de filtros PostgREST (.or / ilike). */
export function safeTerm(raw: string | undefined | null): string {
  return (raw ?? '').replace(/[%*,()\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}
