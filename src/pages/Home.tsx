import Navbar from '../components/Navbar'
import styles from './Home.module.css'

/** Home pública do site — sem conteúdo por enquanto (só a navbar + Admin). */
export default function Home() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Conteúdo do site (hero, serviços, sobre, contato…) entra depois. */}
      </main>
    </>
  )
}
