import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import type { BadgeTone } from '../components/ui/Badge'
import Placeholder from '../components/ui/Placeholder'
import Icon from '../components/ui/Icon'
import s from './page.module.css'

const COLUNAS = ['Usuário', 'Perfil', 'Situação', 'Último acesso']

interface PerfilInfo {
  nome: string
  tone: BadgeTone
  desc: string
}

const PERFIS: PerfilInfo[] = [
  {
    nome: 'Gestor',
    tone: 'blue',
    desc: 'Acesso total: entradas, procedimentos, balanço e administração de usuários.',
  },
  {
    nome: 'Operador',
    tone: 'neutral',
    desc: 'Acesso parcial: responsável pelo registro do que entra (entradas e procedimentos).',
  },
]

export default function Admin() {
  return (
    <div className={s.stack}>
      <div className={s.toolbar}>
        <div className={s.filters}>
          <input className={s.input} type="search" placeholder="Buscar usuário…" disabled />
        </div>
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} disabled title="Disponível na Etapa 2">
          <Icon name="user" size={18} /> Novo usuário
        </button>
      </div>

      <div className={s.grid2}>
        <Card title="Usuários" action={<Badge tone="neutral">0 usuários</Badge>}>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>{COLUNAS.map((c) => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={COLUNAS.length}>
                    <div className={s.empty}>
                      <span className={s.emptyTitle}>Sem usuários cadastrados</span>
                      <span className={s.emptyText}>
                        O cadastro de usuários e o login com senha protegida
                        entram na próxima etapa.
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Perfis de acesso">
          <div className={s.roleList}>
            {PERFIS.map((p) => (
              <div className={s.roleItem} key={p.nome}>
                <div>
                  <Badge tone={p.tone}>{p.nome}</Badge>
                  <p className={s.roleDesc} style={{ marginTop: '0.375rem' }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Placeholder etapa="etapa 2 — backend">
        Autenticação com senha protegida (hash), sessão segura e controle de
        acesso por perfil serão implementados no servidor. O front nunca é a
        fonte de verdade das permissões.
      </Placeholder>
    </div>
  )
}
