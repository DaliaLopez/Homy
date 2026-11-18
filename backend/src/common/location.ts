/** "Cali, Valle del Cauca" → "cali, valle del cauca" (sin tildes ni espacios de más) para comparar ubicaciones. */
export function normalizeLocation(location?: string | null): string {
  return (location ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cliente y trabajador están en la misma ciudad. Se compara la ubicación completa
 * ("Ciudad, Departamento") porque hay ciudades con el mismo nombre en departamentos distintos.
 */
export function sameCity(a?: string | null, b?: string | null): boolean {
  const first = normalizeLocation(a);
  return first !== '' && first === normalizeLocation(b);
}
