import { svgPaths } from "./laterar";

export function Frame12() {
  return (
    <div className="h-[668px] relative w-[279px]">
      <div className="absolute inset-[-6.38%_0_-16.32%_-7.71%]">
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 300.5 819.612"
        >
          <g id="Frame 196">
            <path d={svgPaths.p2c5902a0} fill="#FCB136" id="Rectangle 83" />
            <path d={svgPaths.p307fbe00} fill="#542581" id="Rectangle 82" />
          </g>
        </svg>
      </div>
    </div>
  )
}

export function LeftSide() {
  return (
    <div className="h-[1024px] overflow-clip relative w-[480px]">
      <div className="absolute flex h-[39px] items-center justify-center left-[60px] top-0 w-[420px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="h-[39px] w-[420px]" />
        </div>
      </div>
      <div className="absolute flex h-[668px] items-center justify-center left-[201px] top-0 w-[279px]">
        <div className="flex-none rotate-180">
          <Frame12 />
        </div>
      </div>
    </div>
  )
}

export function RightSide() {
  return (
    // overflow-hidden recorta el inset negativo para que no se salga del contenedor
    <div className="h-screen relative w-[279px] overflow-hidden">
      <div className="absolute inset-[-5.38%_0_0_-7.71%]">
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 300.5 818.765"
        >
          <g id="Frame 197">
            <path d={svgPaths.pfa8cc80} fill="#FCB136" id="Rectangle 83" />
            <path d={svgPaths.p199700} fill="#542581" id="Rectangle 82" />
          </g>
        </svg>
      </div>
    </div>
  )
}