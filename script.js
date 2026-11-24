// ---------- Estado ----------
let tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];

const NOMES_PRIORIDADE = { 1: "Baixa", 2: "Média", 3: "Alta" };

// ---------- Elementos ----------
const formTarefa = document.getElementById("form-tarefa");
const formEditar = document.getElementById("form-editar");
const lista = document.getElementById("lista");
const modalEditar = new bootstrap.Modal(document.getElementById("modal-editar"));

// ---------- Funções ----------
function salvar() {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
}

function formatarData(data) {
  const [a, m, d] = data.split("-");
  return `${d}/${m}/${a}`;
}

function mostrar() {
  lista.innerHTML = "";

  if (tarefas.length === 0) {
    lista.innerHTML = '<li class="list-group-item text-muted">Nenhuma tarefa encontrada.</li>';
  }

  // pendentes primeiro, depois maior prioridade
  const ordenadas = [...tarefas].sort((a, b) => a.feita - b.feita || b.prioridade - a.prioridade);

  ordenadas.forEach(t => {
    const li = document.createElement("li");
    li.className = `list-group-item borda-${t.prioridade}` + (t.feita ? " tarefa-concluida" : "");
    li.innerHTML = `
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" data-acao="alternar" data-id="${t.id}" ${t.feita ? "checked" : ""}>
          <span class="titulo fw-semibold"></span>
          <div class="mt-1">
            <span class="badge text-bg-secondary">${t.categoria}</span>
            <span class="badge text-bg-light border">Prioridade ${NOMES_PRIORIDADE[t.prioridade]}</span>
            ${t.prazo ? `<span class="badge text-bg-info">Prazo: ${formatarData(t.prazo)}</span>` : ""}
          </div>
        </div>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" data-acao="editar" data-id="${t.id}">Editar</button>
          <button class="btn btn-outline-danger" data-acao="excluir" data-id="${t.id}">Excluir</button>
        </div>
      </div>
    `;
    li.querySelector(".titulo").textContent = t.titulo;
    lista.appendChild(li);
  });
}

// ---------- Eventos ----------
formTarefa.addEventListener("submit", e => {
  e.preventDefault();
  tarefas.push({
    id: Date.now(),
    titulo: document.getElementById("titulo").value.trim(),
    categoria: document.getElementById("categoria").value,
    prioridade: Number(document.getElementById("prioridade").value),
    prazo: document.getElementById("prazo").value,
    feita: false
  });
  formTarefa.reset();
  salvar();
  mostrar();
});

lista.addEventListener("click", e => {
  const botao = e.target.closest("[data-acao]");
  if (!botao) return;
  const id = Number(botao.dataset.id);
  const tarefa = tarefas.find(t => t.id === id);

  if (botao.dataset.acao === "alternar") {
    tarefa.feita = !tarefa.feita;
    salvar();
    mostrar();
  }

  if (botao.dataset.acao === "excluir") {
    if (confirm("Excluir esta tarefa?")) {
      tarefas = tarefas.filter(t => t.id !== id);
      salvar();
      mostrar();
    }
  }

  if (botao.dataset.acao === "editar") {
    document.getElementById("edit-id").value = tarefa.id;
    document.getElementById("edit-titulo").value = tarefa.titulo;
    document.getElementById("edit-categoria").value = tarefa.categoria;
    document.getElementById("edit-prioridade").value = tarefa.prioridade;
    document.getElementById("edit-prazo").value = tarefa.prazo;
    modalEditar.show();
  }
});

formEditar.addEventListener("submit", e => {
  e.preventDefault();
  const id = Number(document.getElementById("edit-id").value);
  const tarefa = tarefas.find(t => t.id === id);
  tarefa.titulo = document.getElementById("edit-titulo").value.trim();
  tarefa.categoria = document.getElementById("edit-categoria").value;
  tarefa.prioridade = Number(document.getElementById("edit-prioridade").value);
  tarefa.prazo = document.getElementById("edit-prazo").value;
  salvar();
  mostrar();
  modalEditar.hide();
});

document.getElementById("btn-limpar").addEventListener("click", () => {
  if (tarefas.some(t => t.feita) && confirm("Remover todas as tarefas concluídas?")) {
    tarefas = tarefas.filter(t => !t.feita);
    salvar();
    mostrar();
  }
});

mostrar();
