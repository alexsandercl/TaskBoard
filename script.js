
const CATEGORIAS = ["Estudos", "Trabalho", "Pessoal"];
const NOMES_PRIORIDADE = { 1: "Baixa", 2: "Média", 3: "Alta" };

let tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];


tarefas.forEach(t => {
  t.obs = t.obs || "";
  t.subtarefas = t.subtarefas || [];
  t.criadaEm = t.criadaEm || t.id;
});

const abertas = new Set(); 
let ultimaAcao = null;     

// ---------- Elementos ----------
const formTarefa = document.getElementById("form-tarefa");
const formEditar = document.getElementById("form-editar");
const lista = document.getElementById("lista");
const busca = document.getElementById("busca");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroStatus = document.getElementById("filtro-status");
const ordenarSel = document.getElementById("ordenar");
const modalEditar = new bootstrap.Modal(document.getElementById("modal-editar"));
const toast = new bootstrap.Toast(document.getElementById("toast"));


function salvar() {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
}


function esc(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function estaAtrasada(t) {
  return !t.feita && t.prazo && t.prazo < hoje();
}

function formatarData(data) {
  const [a, m, d] = data.split("-");
  return `${d}/${m}/${a}`;
}

function filtrar() {
  const texto = busca.value.toLowerCase();
  const modo = ordenarSel.value;

  return tarefas
    .filter(t => t.titulo.toLowerCase().includes(texto))
    .filter(t => !filtroCategoria.value || t.categoria === filtroCategoria.value)
    .filter(t => {
      if (filtroStatus.value === "pendentes") return !t.feita;
      if (filtroStatus.value === "concluidas") return t.feita;
      return true;
    })
    .sort((a, b) => {
      if (a.feita !== b.feita) return a.feita - b.feita; // pendentes primeiro
      if (modo === "prazo") return (a.prazo || "9999-99-99").localeCompare(b.prazo || "9999-99-99");
      if (modo === "recentes") return b.criadaEm - a.criadaEm;
      return b.prioridade - a.prioridade;
    });
}

function atualizarResumo() {
  const total = tarefas.length;
  const feitas = tarefas.filter(t => t.feita).length;
  const pct = total ? Math.round((feitas / total) * 100) : 0;

  document.getElementById("total").textContent = total;
  document.getElementById("pendentes").textContent = total - feitas;
  document.getElementById("atrasadas").textContent = tarefas.filter(estaAtrasada).length;

  const barra = document.getElementById("progresso");
  barra.style.width = pct + "%";
  barra.textContent = pct + "%";


  document.getElementById("por-categoria").innerHTML = CATEGORIAS.map(c => {
    const n = tarefas.filter(t => t.categoria === c && !t.feita).length;
    return `<span class="badge etiqueta">${c}: ${n} pendente(s)</span>`;
  }).join("");
}

function htmlDetalhes(t) {
  const subtarefas = t.subtarefas.map(s => `
    <li class="d-flex align-items-center gap-2 mb-1 ${s.feita ? "sub-feita" : ""}">
      <input class="form-check-input m-0" type="checkbox" data-acao="alternar-sub"
             data-id="${t.id}" data-sub="${s.id}" ${s.feita ? "checked" : ""}>
      <span class="sub-texto">${esc(s.texto)}</span>
      <button class="btn btn-sm btn-link text-danger p-0 ms-auto"
              data-acao="excluir-sub" data-id="${t.id}" data-sub="${s.id}">Remover</button>
    </li>`).join("");

  return `
    <div class="detalhes">
      ${t.obs
        ? `<p class="obs small mb-2">${esc(t.obs)}</p>`
        : `<p class="small text-muted mb-2">Sem observações.</p>`}
      <ul class="list-unstyled mb-2">${subtarefas}</ul>
      <form data-form="sub" data-id="${t.id}" class="input-group input-group-sm">
        <input type="text" class="form-control" placeholder="Nova subtarefa" maxlength="60" required>
        <button class="btn btn-outline-primary" type="submit">Adicionar</button>
      </form>
    </div>`;
}

function mostrar() {
  lista.innerHTML = "";
  const visiveis = filtrar();

  if (visiveis.length === 0) {
    const msg = tarefas.length === 0
      ? "Nenhuma tarefa ainda. Cadastre a primeira no formulário."
      : "Nenhuma tarefa encontrada com esses filtros.";
    lista.innerHTML = `<li class="list-group-item text-muted">${msg}</li>`;
  }

  visiveis.forEach(t => {
    const aberta = abertas.has(t.id);
    const subFeitas = t.subtarefas.filter(s => s.feita).length;

    const li = document.createElement("li");
    li.className = `list-group-item borda-${t.prioridade}` + (t.feita ? " tarefa-concluida" : "");
    li.innerHTML = `
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" data-acao="alternar" data-id="${t.id}" ${t.feita ? "checked" : ""}>
          <span class="titulo fw-semibold">${esc(t.titulo)}</span>
          <div class="mt-1">
            <span class="badge etiqueta">${t.categoria}</span>
            <span class="badge etiqueta">Prioridade ${NOMES_PRIORIDADE[t.prioridade]}</span>
            ${t.prazo ? `<span class="badge ${estaAtrasada(t) ? "text-bg-danger" : "etiqueta"}">${estaAtrasada(t) ? "Atrasada: " : "Prazo: "}${formatarData(t.prazo)}</span>` : ""}
            ${t.subtarefas.length ? `<span class="badge etiqueta">Subtarefas ${subFeitas}/${t.subtarefas.length}</span>` : ""}
          </div>
        </div>
        <div class="btn-group btn-group-sm flex-shrink-0">
          <button class="btn btn-outline-secondary" data-acao="detalhes" data-id="${t.id}">${aberta ? "Ocultar" : "Detalhes"}</button>
          <button class="btn btn-outline-secondary" data-acao="editar" data-id="${t.id}">Editar</button>
          <button class="btn btn-outline-danger" data-acao="excluir" data-id="${t.id}">Excluir</button>
        </div>
      </div>
      ${aberta ? htmlDetalhes(t) : ""}
    `;
    lista.appendChild(li);
  });

  atualizarResumo();
}


function removerTarefas(ids, mensagem) {
  const removidas = [];
  tarefas.forEach((t, i) => {
    if (ids.includes(t.id)) removidas.push({ tarefa: t, indice: i });
  });
  tarefas = tarefas.filter(t => !ids.includes(t.id));
  ultimaAcao = removidas;

  salvar();
  mostrar();
  document.getElementById("toast-msg").textContent = mensagem;
  toast.show();
}


formTarefa.addEventListener("submit", e => {
  e.preventDefault();
  const titulo = document.getElementById("titulo").value.trim();
  if (!titulo) return;

  const agora = Date.now();
  tarefas.push({
    id: agora,
    criadaEm: agora,
    titulo: titulo,
    categoria: document.getElementById("categoria").value,
    prioridade: Number(document.getElementById("prioridade").value),
    prazo: document.getElementById("prazo").value,
    obs: document.getElementById("obs").value.trim(),
    subtarefas: [],
    feita: false
  });
  formTarefa.reset();
  salvar();
  mostrar();
});

lista.addEventListener("click", e => {
  const botao = e.target.closest("[data-acao]");
  if (!botao) return;

  const acao = botao.dataset.acao;
  const id = Number(botao.dataset.id);
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;

  if (acao === "alternar") {
    tarefa.feita = !tarefa.feita;
    salvar();
    mostrar();
  }

  if (acao === "detalhes") {
    abertas.has(id) ? abertas.delete(id) : abertas.add(id);
    mostrar();
  }

  if (acao === "alternar-sub") {
    const sub = tarefa.subtarefas.find(s => s.id === Number(botao.dataset.sub));
    sub.feita = !sub.feita;
    salvar();
    mostrar();
  }

  if (acao === "excluir-sub") {
    tarefa.subtarefas = tarefa.subtarefas.filter(s => s.id !== Number(botao.dataset.sub));
    salvar();
    mostrar();
  }

  if (acao === "excluir") {
    removerTarefas([id], "Tarefa excluída.");
  }

  if (acao === "editar") {
    document.getElementById("edit-id").value = tarefa.id;
    document.getElementById("edit-titulo").value = tarefa.titulo;
    document.getElementById("edit-categoria").value = tarefa.categoria;
    document.getElementById("edit-prioridade").value = tarefa.prioridade;
    document.getElementById("edit-prazo").value = tarefa.prazo;
    document.getElementById("edit-obs").value = tarefa.obs;
    modalEditar.show();
  }
});


lista.addEventListener("submit", e => {
  const form = e.target.closest("[data-form='sub']");
  if (!form) return;
  e.preventDefault();

  const id = Number(form.dataset.id);
  const texto = form.querySelector("input").value.trim();
  const tarefa = tarefas.find(t => t.id === id);
  if (!texto || !tarefa) return;

  tarefa.subtarefas.push({ id: Date.now(), texto: texto, feita: false });
  salvar();
  mostrar();


  const campo = document.querySelector(`form[data-form="sub"][data-id="${id}"] input`);
  if (campo) campo.focus();
});

formEditar.addEventListener("submit", e => {
  e.preventDefault();
  const id = Number(document.getElementById("edit-id").value);
  const tarefa = tarefas.find(t => t.id === id);
  const titulo = document.getElementById("edit-titulo").value.trim();
  if (!tarefa || !titulo) return;

  tarefa.titulo = titulo;
  tarefa.categoria = document.getElementById("edit-categoria").value;
  tarefa.prioridade = Number(document.getElementById("edit-prioridade").value);
  tarefa.prazo = document.getElementById("edit-prazo").value;
  tarefa.obs = document.getElementById("edit-obs").value.trim();
  salvar();
  mostrar();
  modalEditar.hide();
});

[busca, filtroCategoria, filtroStatus, ordenarSel].forEach(el => el.addEventListener("input", mostrar));

document.getElementById("btn-limpar").addEventListener("click", () => {
  const ids = tarefas.filter(t => t.feita).map(t => t.id);
  if (ids.length === 0) return;
  removerTarefas(ids, ids.length + " tarefa(s) concluída(s) removida(s).");
});

document.getElementById("btn-desfazer").addEventListener("click", () => {
  if (!ultimaAcao) return;
  ultimaAcao.forEach(item => tarefas.splice(item.indice, 0, item.tarefa));
  ultimaAcao = null;
  salvar();
  mostrar();
  toast.hide();
});

// Modo escuro (salvo no navegador)
const btnTema = document.getElementById("btn-tema");
function aplicarTema(tema) {
  document.documentElement.setAttribute("data-bs-theme", tema);
  btnTema.textContent = tema === "dark" ? "Modo claro" : "Modo escuro";
  localStorage.setItem("tema", tema);
}
btnTema.addEventListener("click", () => {
  const atual = document.documentElement.getAttribute("data-bs-theme");
  aplicarTema(atual === "dark" ? "light" : "dark");
});
aplicarTema(localStorage.getItem("tema") || "light");

mostrar();
