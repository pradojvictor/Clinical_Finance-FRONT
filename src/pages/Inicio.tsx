import logo from '../assets/logo.jpeg'
import s from './Inicio.module.css'

export default function Inicio() {
  return (
    <div className={s.wrap}>
      <img src={logo} alt="Clinleste" className={s.logo} />
    </div>
  )
}
