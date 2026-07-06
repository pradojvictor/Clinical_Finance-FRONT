/* Conjunto de ícones em SVG (stroke), sem dependências externas.
   Uso: <Icon name="home" /> — herda a cor via currentColor. */
import type { ReactNode, SVGProps } from 'react'

const paths: Record<string, ReactNode> = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  entrada: (
    <>
      <path d="M12 3v12" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4 21h16" />
    </>
  ),
  proc: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </>
  ),
  balanco: (
    <>
      <path d="M12 3v18" />
      <path d="M7 21h10" />
      <path d="m5 8 7-3 7 3" />
      <path d="M5 8 3 13a3 3 0 0 0 4 0Z" />
      <path d="m19 8-2 5a3 3 0 0 0 4 0Z" />
    </>
  ),
  admin: (
    <>
      <path d="M12 3 4 6v5c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6Z" />
      <path d="m9.5 12 1.8 1.8L15 10" />
    </>
  ),
  logout: (
    <>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 12H3" />
      <path d="m6 8-4 4 4 4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.5 21a1.8 1.8 0 0 1-3 0" />
    </>
  ),
}

export type IconName =
  | 'home'
  | 'entrada'
  | 'proc'
  | 'balanco'
  | 'admin'
  | 'logout'
  | 'user'
  | 'bell'

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  strokeWidth?: number
}

export default function Icon({ name, size = 20, strokeWidth = 1.8, ...rest }: IconProps) {
  const s = `${size / 16}rem`
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name] ?? null}
    </svg>
  )
}
