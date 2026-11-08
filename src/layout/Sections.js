/**
 * Registre central de seccions de la barra lateral.
 * Per afegir una secció nova:
 *   1. Afegeix l'entrada aquí (label, path, icon).
 *   2. Registra la ruta a src/main.jsx.
 *   3. Crea la pàgina a src/pages/.
 */
export const SECTIONS = [
  {
    label: 'Inici',
    path: '/',
    icon: '🏠',
  },
  {
    label: 'Estadístiques de SP',
    path: '/stats/sp',
    icon: '📊',
    // Aquesta secció en tindrà més en el futur (per això és un grup)
    children: [
      { label: 'Corba de SP', path: '/stats/sp' },
    ],
  },
];

export function findSection(path) {
  const flat = SECTIONS.flatMap((s) => s.children ? s.children : [s])
  return flat.find((s) => s.path === path)
}