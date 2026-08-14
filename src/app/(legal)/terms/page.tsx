import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Termos de Serviço | Dev Track',
  description: 'Termos de serviço do Dev Track.',
}

export default function TermsPage() {
  return (
    <LegalPage
      title='Termos de Serviço'
      description='Condições para acesso e utilização responsável do Dev Track.'
      updatedDate='Última atualização: 13 de agosto de 2026'
    >
      <section>
        <h2>1. Aceitação</h2>
        <p>
          Estes termos regem o uso do Dev Track. Ao acessar a plataforma com uma
          conta aprovada, você concorda em utilizá-la de acordo com estas
          condições e com as políticas internas da sua organização.
        </p>
      </section>
      <section>
        <h2>2. Finalidade do serviço</h2>
        <p>
          O Dev Track é uma ferramenta interna para cadastrar equipes e
          projetos, acompanhar requisitos pelas etapas de desenvolvimento e
          teste e manter um histórico das ações relevantes. A plataforma não
          substitui sistemas especializados de gestão financeira, jurídica ou de
          recursos humanos.
        </p>
      </section>
      <section>
        <h2>3. Conta e acesso</h2>
        <p>
          O acesso depende de autenticação e aprovação administrativa. Você deve
          fornecer informações corretas, proteger suas credenciais e comunicar
          imediatamente qualquer suspeita de acesso indevido. Contas pendentes
          ou suspensas não podem acessar as funcionalidades protegidas.
        </p>
      </section>
      <section>
        <h2>4. Uso permitido</h2>
        <p>
          Você deve utilizar o serviço somente para atividades profissionais
          autorizadas, respeitar os limites do seu papel e manter a precisão das
          informações inseridas. É proibido tentar contornar controles de
          acesso, comprometer a disponibilidade do sistema, acessar dados sem
          autorização ou utilizar a plataforma para fins ilícitos.
        </p>
      </section>
      <section>
        <h2>5. Conteúdo e registros</h2>
        <p>
          Você é responsável pelo conteúdo que registra. Alterações de
          responsáveis, funções e estados importantes podem gerar registros de
          auditoria permanentes. A atribuição histórica de uma ação permanece
          associada à pessoa que a realizou, mesmo após mudanças posteriores de
          equipe ou função.
        </p>
      </section>
      <section>
        <h2>6. Disponibilidade e mudanças</h2>
        <p>
          A plataforma pode passar por manutenção, correções e melhorias.
          Funcionalidades poderão ser modificadas quando necessário,
          preservando-se, na medida aplicável, a integridade dos dados e das
          regras essenciais do produto.
        </p>
      </section>
      <section>
        <h2>7. Suspensão e encerramento</h2>
        <p>
          Administradores autorizados podem suspender ou encerrar acessos em
          caso de desligamento, risco de segurança, descumprimento destes termos
          ou necessidade operacional. O encerramento do acesso não implica a
          exclusão automática dos registros históricos.
        </p>
      </section>
      <section>
        <h2>8. Responsabilidades</h2>
        <p>
          Decisões de projeto continuam sob responsabilidade dos usuários e
          gestores autorizados. O serviço apresenta informações cadastradas e
          cálculos de acompanhamento, mas não garante que projetos serão
          concluídos dentro de prazo, custo ou escopo determinados.
        </p>
      </section>
      <section>
        <h2>9. Alterações destes termos</h2>
        <p>
          Estes termos poderão ser atualizados. O uso continuado após a
          publicação de uma nova versão estará sujeito às condições atualizadas
          e às políticas de comunicação da organização.
        </p>
      </section>
      <section>
        <h2>10. Contato</h2>
        <p>
          Dúvidas sobre estes termos devem ser encaminhadas ao administrador
          responsável pelo Dev Track na sua organização.
        </p>
      </section>
    </LegalPage>
  )
}
