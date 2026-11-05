# 🏢 Time de Agentes de IA

Um time fixo de **5 funcionários virtuais** para o Claude Code. É o **mesmo time em todos os projetos**: cada projeto entrega o próprio contexto pelo seu `CLAUDE.md`.

```
Você (dono)
   └── 👔 Gerente  ← fala com você, aprova tudo
         ├── 🏗️ Arquiteto / Programador
         ├── 🔭 Marketing Scout
         ├── ✍️ Copy & Conteúdo
         └── 🔍 Revisor Técnico
```

## O time e as skills de cada um

| Agente | Função | Skills instaladas (origem) |
|---|---|---|
| 👔 **Gerente** (`gerente`) | Coordena o time, distribui tarefas, manda todo código para revisão e só libera o que está aprovado. Atende você quando algo dá errado. | `task-coordination-strategies` (wshobson) · `requesting-code-review` (superpowers) · `verification-before-completion` (superpowers) · `architecture-decision-records` (wshobson) |
| 🏗️ **Arquiteto** (`arquiteto`) | Cria, modela e adapta sites e sistemas: arquitetura, APIs, banco, front-end e back-end. | `architecture-patterns` · `api-design-principles` · `postgresql-table-design` · `nodejs-backend-patterns` · `responsive-design` (wshobson) · `frontend-design` (**Anthropic**) · `systematic-debugging` · `test-driven-development` · `receiving-code-review` · `verification-before-completion` (superpowers) |
| 🔭 **Marketing Scout** (`marketing-scout`) | Pesquisa concorrentes, tendências e oportunidades e traz ideias com fontes. | `competitive-landscape` · `market-sizing-analysis` · `startup-metrics-framework` · `social-evidence-research` (wshobson) |
| ✍️ **Copy & Conteúdo** (`copy-conteudo`) | Escreve textos, landing pages e CTAs persuasivos, fiéis à marca e sem cara de IA. | `brand-landingpage` · `avoid-ai-writing` · `accessibility-compliance` (wshobson) |
| 🔍 **Revisor Técnico** (`revisor-tecnico`) | Revisa correção, segurança, performance e qualidade. Aponta problemas com severidade e veredito, mas não edita código. | `code-review-excellence` · `multi-reviewer-patterns` · `stride-analysis-patterns` · `auth-implementation-patterns` · `sql-optimization-patterns` (wshobson) · `webapp-testing` (**Anthropic**) · `verification-before-completion` (superpowers) |

**Origem das skills** (26 no total, todas de código aberto, licenças em `licencas/`):
- **Anthropic oficial:** [anthropics/skills](https://github.com/anthropics/skills) (Apache 2.0)
- **Superpowers:** [obra/superpowers](https://github.com/obra/superpowers) (MIT)
- **wshobson/agents:** [wshobson/agents](https://github.com/wshobson/agents) (MIT)

As skills de cada agente ficam no campo `skills:` do arquivo dele e são carregadas quando ele começa a trabalhar. Assim cada um recebe só o conhecimento da própria função.

## Instalação (uma vez só, no seu computador)

**Mac / Linux / WSL:**
```bash
git clone -b claude/awesome-meitner-k6vmym https://github.com/2025foi/teste.git
cd teste/time-de-agentes
./instalar.sh
```

**Windows (PowerShell):**
```powershell
git clone -b claude/awesome-meitner-k6vmym https://github.com/2025foi/teste.git
cd teste\time-de-agentes
powershell -ExecutionPolicy Bypass -File .\instalar.ps1
```

O instalador copia tudo para `~/.claude/agents/` e `~/.claude/skills/`. Se já existir um arquivo com o mesmo nome, ele guarda o antigo numa pasta `backup-time-de-agentes-...`.

Resultado:
```
~/.claude/
├── agents/   gerente.md · arquiteto.md · marketing-scout.md · copy-conteudo.md · revisor-tecnico.md
└── skills/   26 skills
```

## Preparar cada projeto (uma vez por projeto)

Copie `modelos/CLAUDE.md` para a raiz de cada projeto e preencha os `[COLCHETES]`:
```
meus-projetos/
├── projeto-a/CLAUDE.md   ← contexto do Projeto A
├── projeto-b/CLAUDE.md
└── ...
```

## Uso no dia a dia

1. **Abra o terminal na pasta do projeto**
   ```bash
   cd ~/meus-projetos/projeto-a
   ```
2. **Chame o Gerente**
   ```bash
   claude --agent gerente
   ```
   (ou `equipe`, se você criou o atalho que o instalador sugere)
3. **Peça o que precisa, como pediria a um gerente de verdade:**
   > "Quero uma seção de depoimentos na home e um texto novo para o topo. Veja também o que os concorrentes estão fazendo."

   O Gerente monta o plano, chama o Scout, o Copy e o Arquiteto, manda o código para o Revisor, devolve o que estiver errado e só então te entrega o **Relatório do Gerente** com o status ✅.
4. **Trocou de projeto?** Saia (`/exit`), entre na outra pasta e rode `claude --agent gerente` de novo. O mesmo time passa a trabalhar com o `CLAUDE.md` do novo projeto.
5. **Deu problema?** Fale com o Gerente: *"O formulário de contato parou de enviar."* Ele investiga, descobre quem errou, manda corrigir, passa pela revisão de novo e te explica o que mudou.

**Atalho:** você também pode chamar um especialista direto numa sessão normal do `claude`, por exemplo *"use o marketing-scout para analisar os concorrentes"*. Nesse caso o trabalho **não** passa pela aprovação do Gerente.

## Dicas
- **Quanto melhor o `CLAUDE.md`, melhor o time.** Atualize a seção "Momento atual" sempre que as prioridades mudarem.
- Para mudar o comportamento de um agente, edite o arquivo dele em `~/.claude/agents/`.
- Para dar outra skill a um agente, coloque a pasta da skill em `~/.claude/skills/` e acrescente o nome no `skills:` do agente.
- Para atualizar o time, rode `git pull` e o instalador de novo.
