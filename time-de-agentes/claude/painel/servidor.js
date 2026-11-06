#!/usr/bin/env node
// Painel do Time: servidor local.
// Mostra o painel em http://localhost:4747, lista os projetos e deixa você
// conversar com o Gerente (ou com qualquer agente) pelo navegador.
// Só aceita conexões deste computador. Usa apenas módulos que vêm com o Node.js.

"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawn } = require("child_process");

const PORTA = Number(process.env.PAINEL_PORTA || 4747);
const PASTA_PAINEL = __dirname;
const PASTA_PROJETOS = process.env.PAINEL_PROJETOS || path.join(os.homedir(), "Projetos");
const PASTA_CONVERSAS = path.join(PASTA_PAINEL, "conversas");
const AGENTES = ["gerente", "arquiteto", "programador", "revisor-tecnico", "marketing-scout", "copy-conteudo"];
const TOKEN = crypto.randomBytes(24).toString("hex");
const WINDOWS = process.platform === "win32";

fs.mkdirSync(PASTA_PROJETOS, { recursive: true });
fs.mkdirSync(PASTA_CONVERSAS, { recursive: true });

// ---------- utilidades ----------
function nomeValido(n) { return typeof n === "string" && /^[\w][\w .-]{0,79}$/.test(n) && !n.includes("..") && n.trim() === n; }
function pastaDoProjeto(n) { return nomeValido(n) ? path.join(PASTA_PROJETOS, n) : null; }
function chave(projeto, agente) { return `${projeto}__${agente}`; }
function arquivoConversa(k) { return path.join(PASTA_CONVERSAS, k + ".json"); }

function acharClaude() {
  const candidatos = WINDOWS
    ? [path.join(os.homedir(), ".local", "bin", "claude.exe")]
    : [path.join(os.homedir(), ".local", "bin", "claude")];
  for (const c of candidatos) if (fs.existsSync(c)) return c;
  return "claude"; // usa o PATH
}
const CLAUDE = acharClaude();

function abrirNoSistema(alvo) {
  try {
    if (WINDOWS) spawn("cmd", ["/c", "start", "", alvo], { detached: true, stdio: "ignore", windowsHide: true }).unref();
    else if (process.platform === "darwin") spawn("open", [alvo], { detached: true, stdio: "ignore" }).unref();
    else spawn("xdg-open", [alvo], { detached: true, stdio: "ignore" }).on("error", () => {}).unref();
  } catch { /* sem navegador disponível */ }
}

// ---------- conversas (guardadas em disco) ----------
const conversas = new Map(); // chave -> { sessao, msgs: [], rodando: processo|null }

function conversa(k) {
  if (!conversas.has(k)) {
    let salvo = { sessao: null, msgs: [] };
    try { salvo = JSON.parse(fs.readFileSync(arquivoConversa(k), "utf8")); } catch { }
    conversas.set(k, { sessao: salvo.sessao || null, msgs: salvo.msgs || [], rodando: null });
  }
  return conversas.get(k);
}
const pendentes = new Set();
function salvar(k) {
  if (pendentes.has(k)) return;
  pendentes.add(k);
  setTimeout(() => {
    pendentes.delete(k);
    const c = conversa(k);
    fs.writeFile(arquivoConversa(k), JSON.stringify({ sessao: c.sessao, msgs: c.msgs.slice(-500) }), () => {});
  }, 300);
}
function adicionar(k, msg) {
  const c = conversa(k);
  msg.n = (c.msgs.length ? c.msgs[c.msgs.length - 1].n : 0) + 1;
  msg.t = Date.now();
  c.msgs.push(msg);
  if (c.msgs.length > 800) c.msgs.splice(0, c.msgs.length - 500);
  salvar(k);
}

// Resume uma chamada de ferramenta em português simples
function resumirFerramenta(nome, ent = {}) {
  const arq = p => path.basename(String(p || ""));
  switch (nome) {
    case "Agent": case "Task": return `➡️ Passou tarefa para ${ent.subagent_type || "um agente"}: ${ent.description || ""}`;
    case "Read": return `📖 Lendo ${arq(ent.file_path)}`;
    case "Write": return `📝 Criando ${arq(ent.file_path)}`;
    case "Edit": case "NotebookEdit": return `✏️ Editando ${arq(ent.file_path)}`;
    case "Bash": case "PowerShell": return `⚙️ ${ent.description || String(ent.command || "").slice(0, 120)}`;
    case "Glob": case "Grep": return `🔎 Procurando ${ent.pattern || ""}`;
    case "WebSearch": return `🌐 Pesquisando: ${ent.query || ""}`;
    case "WebFetch": return `🌐 Abrindo ${ent.url || ""}`;
    case "Skill": return `📚 Consultando a skill ${ent.skill || ""}`;
    case "TaskCreate": return `🗂️ Nova tarefa: ${ent.subject || ""}`;
    default: return `🛠️ ${nome}`;
  }
}

function enviar(projeto, agente, texto) {
  const k = chave(projeto, agente);
  const c = conversa(k);
  if (c.rodando) return { erro: "Ainda estou trabalhando no pedido anterior. Espere terminar ou clique em Parar." };
  const cwd = pastaDoProjeto(projeto);
  if (!cwd || !fs.existsSync(cwd)) return { erro: "Projeto não encontrado." };

  adicionar(k, { de: "voce", texto });
  const args = ["-p", "--agent", agente, "--permission-mode", "auto", "--output-format", "stream-json", "--verbose"];
  if (c.sessao) args.push("--resume", c.sessao);

  let proc;
  try {
    proc = spawn(CLAUDE, args, { cwd, env: process.env, windowsHide: true });
  } catch (e) {
    adicionar(k, { de: "erro", texto: "Não consegui iniciar o Claude Code: " + e.message });
    return { ok: true };
  }
  c.rodando = proc;
  proc.stdin.end(texto, "utf8");

  let resto = "", erroTxt = "", teveResultado = false;
  proc.stdout.setEncoding("utf8");
  proc.stdout.on("data", parte => {
    resto += parte;
    let i;
    while ((i = resto.indexOf("\n")) >= 0) {
      const linha = resto.slice(0, i).trim(); resto = resto.slice(i + 1);
      if (!linha) continue;
      let o; try { o = JSON.parse(linha); } catch { continue; }
      if (o.session_id && !c.sessao) { c.sessao = o.session_id; salvar(k); }
      if (o.type === "assistant" && o.message && Array.isArray(o.message.content)) {
        // Mensagens de subagentes (parent_tool_use_id) viram só atividade
        const deSub = !!o.parent_tool_use_id;
        for (const b of o.message.content) {
          if (b.type === "text" && b.text && b.text.trim() && !deSub) adicionar(k, { de: "agente", agente, texto: b.text });
          else if (b.type === "tool_use") adicionar(k, { de: "atividade", texto: resumirFerramenta(b.name, b.input) });
        }
      } else if (o.type === "result") {
        teveResultado = true;
        if (o.is_error) adicionar(k, { de: "erro", texto: o.result || "O Claude terminou com erro." });
      }
    }
  });
  proc.stderr.setEncoding("utf8");
  proc.stderr.on("data", d => { erroTxt += d; if (erroTxt.length > 4000) erroTxt = erroTxt.slice(-4000); });
  proc.on("error", e => {
    adicionar(k, { de: "erro", texto: e.code === "ENOENT"
      ? "Não encontrei o Claude Code neste computador. Instale com: irm https://claude.ai/install.ps1 | iex"
      : "Erro ao rodar o Claude Code: " + e.message });
  });
  proc.on("close", (codigo, sinal) => {
    c.rodando = null;
    if (sinal || c.parado) { adicionar(k, { de: "sistema", texto: "⏹️ Parado por você." }); c.parado = false; }
    else if (!teveResultado && codigo !== 0) {
      const detalhe = erroTxt.trim().split("\n").slice(-6).join("\n");
      adicionar(k, { de: "erro", texto: "O Claude Code parou com erro." + (detalhe ? "\n" + detalhe : "") });
    }
    adicionar(k, { de: "fim" });
  });
  return { ok: true };
}

function parar(projeto, agente) {
  const c = conversa(chave(projeto, agente));
  if (!c.rodando) return { ok: true };
  c.parado = true;
  if (WINDOWS) spawn("taskkill", ["/pid", String(c.rodando.pid), "/t", "/f"], { windowsHide: true });
  else c.rodando.kill("SIGTERM");
  return { ok: true };
}

function listarProjetos() {
  let itens = [];
  try { itens = fs.readdirSync(PASTA_PROJETOS, { withFileTypes: true }); } catch { }
  return itens
    .filter(d => d.isDirectory() && nomeValido(d.name) && !d.name.startsWith("."))
    .map(d => {
      const p = path.join(PASTA_PROJETOS, d.name);
      let mod = 0; try { mod = fs.statSync(p).mtimeMs; } catch { }
      const ocupado = AGENTES.some(a => conversas.get(chave(d.name, a))?.rodando);
      return { nome: d.name, caminho: p, modificado: mod, ocupado,
               temSite: ["index.html", "dist/index.html", "public/index.html"].some(f => fs.existsSync(path.join(p, f))),
               temGit: fs.existsSync(path.join(p, ".git")) };
    })
    .sort((a, b) => b.modificado - a.modificado);
}

function criarProjeto(nome) {
  const p = pastaDoProjeto(nome);
  if (!p) return { erro: "Nome inválido. Use letras, números, espaço, ponto, - ou _." };
  if (fs.existsSync(p)) return { erro: "Já existe um projeto com esse nome." };
  fs.mkdirSync(p, { recursive: true });
  return { ok: true, nome };
}

function clonarProjeto(url, cb) {
  const m = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(\.git)?\/?$/.exec(String(url || "").trim());
  if (!m) return cb({ erro: "Cole um endereço do GitHub, por exemplo https://github.com/usuario/projeto" });
  const nome = m[2];
  const destino = pastaDoProjeto(nome);
  if (!destino) return cb({ erro: "Nome de repositório inválido." });
  if (fs.existsSync(destino)) return cb({ erro: `Já existe a pasta ${nome} em Projetos.` });
  const proc = spawn("git", ["clone", `https://github.com/${m[1]}/${nome}.git`, destino], { windowsHide: true });
  let erro = "";
  proc.stderr.on("data", d => { erro += d; });
  proc.on("error", () => cb({ erro: "Git não encontrado. Instale em git-scm.com/download/win" }));
  proc.on("close", c => cb(c === 0 ? { ok: true, nome } : { erro: "Não consegui baixar: " + erro.trim().split("\n").pop() }));
}

function abrirProjeto(nome, oque) {
  const p = pastaDoProjeto(nome);
  if (!p || !fs.existsSync(p)) return { erro: "Projeto não encontrado." };
  if (oque === "site") {
    const f = ["index.html", "dist/index.html", "public/index.html"].map(x => path.join(p, x)).find(x => fs.existsSync(x));
    if (!f) return { erro: "Não achei um index.html. Peça ao Gerente: \"abra o site no navegador para mim\"." };
    abrirNoSistema(f);
  } else abrirNoSistema(p);
  return { ok: true };
}

// ---------- servidor HTTP ----------
function json(res, codigo, dados) {
  res.writeHead(codigo, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(dados));
}
function lerCorpo(req, cb) {
  let corpo = "";
  req.setEncoding("utf8");
  req.on("data", d => { corpo += d; if (corpo.length > 200000) req.destroy(); });
  req.on("end", () => { try { cb(JSON.parse(corpo || "{}")); } catch { cb(null); } });
}

const servidor = http.createServer((req, res) => {
  // Proteção: só atende este computador e só páginas do próprio painel
  const host = String(req.headers.host || "");
  if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) { res.writeHead(403); return res.end(); }
  const url = new URL(req.url, "http://localhost");

  if (url.pathname.startsWith("/api/")) {
    if (req.headers["x-painel"] !== TOKEN) return json(res, 403, { erro: "Acesso negado." });
    const q = url.searchParams;
    if (req.method === "GET" && url.pathname === "/api/projetos") return json(res, 200, { pasta: PASTA_PROJETOS, projetos: listarProjetos() });
    if (req.method === "GET" && url.pathname === "/api/conversa") {
      const projeto = q.get("projeto"), agente = q.get("agente") || "gerente";
      if (!nomeValido(projeto) || !AGENTES.includes(agente)) return json(res, 400, { erro: "Pedido inválido." });
      const c = conversa(chave(projeto, agente)), desde = Number(q.get("desde") || 0);
      return json(res, 200, { rodando: !!c.rodando, msgs: c.msgs.filter(m => m.n > desde) });
    }
    if (req.method === "POST") return lerCorpo(req, b => {
      if (!b) return json(res, 400, { erro: "Pedido inválido." });
      const agente = b.agente || "gerente";
      if (b.projeto !== undefined && !nomeValido(b.projeto)) return json(res, 400, { erro: "Projeto inválido." });
      if (!AGENTES.includes(agente)) return json(res, 400, { erro: "Agente inválido." });
      switch (url.pathname) {
        case "/api/enviar":
          if (!b.texto || !String(b.texto).trim()) return json(res, 400, { erro: "Mensagem vazia." });
          return json(res, 200, enviar(b.projeto, agente, String(b.texto)));
        case "/api/parar": return json(res, 200, parar(b.projeto, agente));
        case "/api/novo-projeto": return json(res, 200, criarProjeto(b.nome));
        case "/api/clonar": return clonarProjeto(b.url, r => json(res, 200, r));
        case "/api/abrir": return json(res, 200, abrirProjeto(b.projeto, b.oque));
        case "/api/limpar-conversa": {
          const k = chave(b.projeto, agente), c = conversa(k);
          if (c.rodando) return json(res, 200, { erro: "Espere terminar antes de limpar." });
          c.msgs = []; c.sessao = null; salvar(k);
          return json(res, 200, { ok: true });
        }
      }
      return json(res, 404, { erro: "Não encontrado." });
    });
    return json(res, 404, { erro: "Não encontrado." });
  }

  if (url.pathname === "/" || url.pathname === "/painel.html") {
    let html;
    try { html = fs.readFileSync(path.join(PASTA_PAINEL, "painel.html"), "utf8"); }
    catch { res.writeHead(500); return res.end("painel.html não encontrado"); }
    html = html.replace("<head>", `<head>\n<script>window.PAINEL_TOKEN=${JSON.stringify(TOKEN)};</script>`);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "DENY" });
    return res.end(html);
  }
  if (url.pathname === "/eventos.js") {
    res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" });
    const s = fs.createReadStream(path.join(PASTA_PAINEL, "eventos.js"));
    s.on("error", () => res.end(""));
    return s.pipe(res);
  }
  res.writeHead(404); res.end();
});

servidor.on("error", e => {
  if (e.code === "EADDRINUSE") {
    console.log("O Painel do Time já está aberto. Abrindo no navegador...");
    abrirNoSistema(`http://localhost:${PORTA}/`);
    setTimeout(() => process.exit(0), 500);
  } else { console.error(e); process.exit(1); }
});

servidor.listen(PORTA, "127.0.0.1", () => {
  const endereco = `http://localhost:${PORTA}/`;
  console.log("==============================================");
  console.log(" Painel do Time rodando em " + endereco);
  console.log(" Projetos em: " + PASTA_PROJETOS);
  console.log(" Deixe esta janela aberta. Fechar = desligar o painel.");
  console.log("==============================================");
  if (!process.env.PAINEL_SEM_NAVEGADOR) abrirNoSistema(endereco);
});

process.on("SIGINT", () => {
  for (const c of conversas.values()) if (c.rodando) try { c.rodando.kill(); } catch { }
  process.exit(0);
});
