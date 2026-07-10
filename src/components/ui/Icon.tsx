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
  saida: (
    <>
      <path d="M12 21V9" />
      <path d="m7.5 13.5 4.5-4.5 4.5 4.5" />
      <path d="M4 3h16" />
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
  chevron: <path d="m14 7-5 5 5 5" />,
  eye: (
    <>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </>
  ),
  eyeOff: (
    <>
      <path d="m3 3 18 18" />
      <path d="M10.6 5.2A10 10 0 0 1 12 5c6.4 0 10 7 10 7a18.5 18.5 0 0 1-3.16 3.94" />
      <path d="M6.6 6.6A18.2 18.2 0 0 0 2 12s3.6 6.5 10 6.5a9.8 9.8 0 0 0 4.2-.94" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
}

export type IconName =
  | 'home'
  | 'entrada'
  | 'saida'
  | 'proc'
  | 'balanco'
  | 'admin'
  | 'logout'
  | 'user'
  | 'bell'
  | 'chevron'
  | 'eye'
  | 'eyeOff'
  | 'image'

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
