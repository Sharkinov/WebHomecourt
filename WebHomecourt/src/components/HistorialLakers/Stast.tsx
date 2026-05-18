import { PieChart, Pie, Cell } from 'recharts';

export interface StatCardProps {
  title: string;
  subtitle: string;
  primaryValue: number;
  secondaryValue?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  total?: number;
  size?: number;
  centerLabel?: string | number;
  className?: string;
}

// Asegura que cualquier proporción se mantenga entre 0 y 1 para evitar radios o porcentajes invalidos.
const clampRatio = (value: number) => Math.min(Math.max(value, 0), 1);

// Calcula los radios de los dos anillos del chart con proporciones fijas para que la grafica se vea consistente.
function computeRingRadii(chartSize: number) {
  const padding = 6;
  // Espacio util disponible desde el centro hacia afuera despues de restar el margen.
  const available = chartSize / 2 - padding;
  // Grosor del anillo principal: crece con el tamano del chart, pero tiene un minimo legible.
  const thickness = Math.max(Math.round(chartSize * 0.075), 10);
  // Separacion pequeña entre anillos para evitar que visualmente se fusionen.
  const gap = Math.max(Math.round(chartSize * 0.025), 3);

  return {
    // Anillo exterior: representa el valor principal.
    outer: { inner: available - thickness, outer: available },
    // Anillo interior: representa el valor secundario.
    inner: { inner: available - thickness * 2 - gap, outer: available - thickness - gap },
  };
}

function StatCard({
  title,
  subtitle,
  primaryValue,
  secondaryValue,
  primaryLabel,
  secondaryLabel,
  primaryColor,
  secondaryColor,
  total,
  size,
  centerLabel,
  className,
}: StatCardProps) {
  const hasSecondary = typeof secondaryValue === 'number';
  const fallbackTotal = hasSecondary ? primaryValue + (secondaryValue ?? 0) : primaryValue;
  const totalValue = typeof total === 'number' ? total : fallbackTotal;
  const safeTotal = totalValue > 0 ? totalValue : 1;
  const primaryRatio = clampRatio(primaryValue / safeTotal);
  const secondaryRatio = hasSecondary ? clampRatio((secondaryValue ?? 0) / safeTotal) : 0;

  const primaryData = [{ value: primaryRatio }, { value: 1 - primaryRatio }];
  const secondaryData = [{ value: secondaryRatio }, { value: 1 - secondaryRatio }];

  // Esto mantiene el tamano del chart proporcional al componente sin depender de valores fijos para cada pantalla.
  const chartSize = size ?? 130;
  const { outer, inner } = computeRingRadii(chartSize);
 


  //Tuve que poner los colores harcoded par apoder pasarlos a el reactcharts
  const secondaryFill = primaryColor ?? 'var(--color-amarillo-lakers)';
  const primaryFill = secondaryColor ?? 'var(--color-morado-lakers)';
  const trackFill = '#E7E6E8';

  const legendPrimary = primaryLabel ?? (hasSecondary ? 'Win' : 'Value');
  const legendSecondary = secondaryLabel ?? 'Lose';
  const computedCenterLabel =
    centerLabel ?? (hasSecondary ? `${primaryValue}-${secondaryValue ?? 0}` : `${primaryValue}`);

  return (
    <div
      className={`flex w-full flex-col gap-1 rounded-[14px] border border-black/10 bg-white px-5.25 pb-5.25 pt-4.25 shadow-[0_4px_8px_rgba(0,0,0,0.06)] ${className ?? ''
        }`}
    >
      <p className="text-[20px] font-bold leading-6.25 text-morado-lakers">{title}</p>

      <div className="relative flex h-33.25 w-full items-center justify-center">
        {/* La leyenda se ancla abajo a la izquierda cuando hay dos valores para imitar el card de Figma. */}
        {hasSecondary ? (
          <div className="absolute bottom-0.5 left-0 flex flex-col gap-2 text-[14px] leading-5 text-Gris-Oscuro">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: secondaryFill }} />
              {legendSecondary}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: primaryFill }} />
              {legendPrimary}
            </span>
          </div>
        ) : null}

        {/* El chart usa dos anillos: uno exterior para el valor principal y otro interior para el secundario. */}
        <div className="relative" style={{ width: chartSize, height: chartSize }}>
          <PieChart width={chartSize} height={chartSize}>
            {/* Anillo interior: representa el valor secundario (por ejemplo, Lose). */}
            {hasSecondary ? (
              <Pie
                data={secondaryData}
                cx="50%"
                cy="50%"
                innerRadius={inner.inner}
                outerRadius={inner.outer}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill={secondaryFill} />
                <Cell fill={trackFill} />
              </Pie>
            ) : null}

            {/* Anillo exterior: representa el valor principal (por ejemplo, Win). */}
            <Pie
              data={primaryData}
              cx="50%"
              cy="50%"
              innerRadius={outer.inner}
              outerRadius={outer.outer}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={primaryFill} />
              <Cell fill={trackFill} />
            </Pie>
          </PieChart>

          {/* El valor central ocupa todo el chart para asegurar un centrado exacto, tambien en valores con decimales. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className=" whitespace-nowrap text-center text-[30px] font-bold leading-none tabular-nums text-texto-oscuro">
              {computedCenterLabel}
            </span>
          </div>
        </div>
      </div>

      <p className="text-center text-[13px] leading-[19.5px] text-Gris-Oscuro">{subtitle}</p>
    </div>
  );
}

export default StatCard
