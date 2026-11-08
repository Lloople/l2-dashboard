/**
 * Pàgina d'estadístiques de SP.
 * De moment només conté el gràfic de la corva de SP, però l'estructura
 * està preparada per afegir-hi més panells en el futur (per això cada
 * gràfic viu al seu propi component).
 */
import SpCurveChart from './SpCurveChart.jsx'

export default function SpStatsPage() {
  return (
    <div className="page-sp-stats">
      <h1 className="page-title">Estadístiques de SP</h1>
      <div className="panel">
        <SpCurveChart />
      </div>
      {/* En el futur: més panells aquí, cadascun en el seu component */}
    </div>
  );
}