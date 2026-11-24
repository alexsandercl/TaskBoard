const form = document.getElementById("form");
const texto = document.getElementById("texto");
const lista = document.getElementById("lista");
const contador = document.getElementById("contador");
const limpar = document.getElementById("limpar");

let tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];

function salvar() {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
}

function mostrar() {
  lista.innerHTML = "";

  if (tarefas.length === 0) {
    lista.innerHTML = '<li class="list-group-item text-muted">Nenhuma tarefa ainda.</li>';
  }

  tarefas.forEach((t, i) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center" + (t.feita ? " concluida" : "");
    li.innerHTML = `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" ${t.feita ? "checked" : ""} onchange="alternar(${i})">
        <span class="ms-2"></span>
      </div>
      <button class="btn btn-sm btn-outline-secondary" onclick="remover(${i})">Excluir</button>
    `;
    li.querySelector("span").textContent = t.texto;
    lista.appendChild(li);
  });

  const pendentes = tarefas.filter(t => !t.feita).length;
  contador.textContent = pendentes + " pendente(s) de " + tarefas.length;
}

function alternar(i) {
  tarefas[i].feita = !tarefas[i].feita;
  salvar();
  mostrar();
}

function remover(i) {
  tarefas.splice(i, 1);
  salvar();
  mostrar();
}

form.addEventListener("submit", e => {
  e.preventDefault();
  tarefas.push({ texto: texto.value.trim(), feita: false });
  texto.value = "";
  salvar();
  mostrar();
});

limpar.addEventListener("click", () => {
  tarefas = tarefas.filter(t => !t.feita);
  salvar();
  mostrar();
});

mostrar();
