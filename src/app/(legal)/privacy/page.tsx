import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'
import { APP_IDENTITY } from '@/lib/app-identity'

export const metadata: Metadata = {
  title: `Política de Privacidade | ${APP_IDENTITY.name}`,
  description: `Política de privacidade do ${APP_IDENTITY.name}.`,
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title='Política de Privacidade'
      description={`Como as informações são coletadas, utilizadas e protegidas no ${APP_IDENTITY.name}.`}
      updatedDate='Última atualização: 13 de agosto de 2026'
    >
      <section>
        <h2>1. Sobre esta política</h2>
        <p>
          Esta política descreve o tratamento de dados pessoais realizado pelo
          {APP_IDENTITY.name}, uma ferramenta interna de acompanhamento de
          projetos e requisitos de software. Ao utilizar a plataforma, você
          reconhece as práticas descritas neste documento.
        </p>
      </section>
      <section>
        <h2>2. Informações tratadas</h2>
        <p>
          Podemos tratar dados de identificação e acesso, como nome, e-mail
          corporativo, imagem de perfil, provedor de autenticação, função no
          sistema, situação da conta e vínculo com equipes.
        </p>
        <p>
          Também registramos informações produzidas durante o uso, incluindo
          projetos, requisitos, atribuições, alterações de status, notas de
          desenvolvimento e teste, datas, histórico de ações e dados técnicos
          necessários à segurança da sessão.
        </p>
      </section>
      <section>
        <h2>3. Finalidades</h2>
        <p>
          As informações são utilizadas para autenticar usuários, controlar
          permissões, organizar equipes, acompanhar projetos, atribuir
          responsabilidades, preservar o histórico operacional, proteger a
          plataforma e prestar suporte.
        </p>
      </section>
      <section>
        <h2>4. Compartilhamento</h2>
        <p>
          Os dados ficam disponíveis aos usuários autorizados da organização
          conforme suas responsabilidades. Informações poderão ser processadas
          por fornecedores essenciais de infraestrutura, hospedagem, banco de
          dados e autenticação, dentro do necessário para operar o serviço.
        </p>
      </section>
      <section>
        <h2>5. Retenção e histórico</h2>
        <p>
          Os dados são mantidos pelo período necessário às finalidades da
          plataforma e às políticas da organização. Registros de auditoria podem
          ser preservados após mudanças de função, suspensão ou saída de um
          membro para manter a atribuição histórica correta das ações.
        </p>
      </section>
      <section>
        <h2>6. Segurança</h2>
        <p>
          Adotamos controles técnicos e organizacionais proporcionais ao uso da
          plataforma, incluindo controle de acesso, proteção de credenciais,
          validação no servidor e registro de ações relevantes. Nenhum método de
          armazenamento ou transmissão oferece segurança absoluta.
        </p>
      </section>
      <section>
        <h2>7. Seus dados</h2>
        <p>
          Solicitações relacionadas a acesso, correção, atualização ou
          eliminação de dados devem ser encaminhadas ao administrador
          responsável pelo {APP_IDENTITY.name} na sua organização. Algumas
          informações podem precisar ser preservadas para segurança, auditoria e
          integridade dos registros.
        </p>
      </section>
      <section>
        <h2>8. Alterações</h2>
        <p>
          Esta política poderá ser atualizada para refletir mudanças no serviço
          ou nas práticas internas. A data da versão mais recente será indicada
          no início da página.
        </p>
      </section>
      <section>
        <h2>9. Contato</h2>
        <p>
          Para dúvidas sobre privacidade, entre em contato com o administrador
          do {APP_IDENTITY.name} ou com o canal de privacidade definido pela sua
          organização.
        </p>
      </section>
    </LegalPage>
  )
}
