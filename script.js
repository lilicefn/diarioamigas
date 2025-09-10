// IMPORTS FIREBASE
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  push
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const db = window.db;

/* ========= AUTENTICAÇÃO ========= */
async function criarConta() {
  const username = document.getElementById("cadastro-username").value;
  const password = document.getElementById("cadastro-password").value;

  if (!username || !password) {
    alert("Preencha usuário e senha!");
    return;
  }

  const usuarioRef = ref(db, "usuarios/" + username);

  try {
    await set(usuarioRef, {
      senha: password,
      nome: "",
      bio: "",
      foto: "",
      corTema: "#4CAF50",
      amigos: [],
      bests: [],
      diarios: {}
    });

    alert("Conta criada com sucesso!");
  } catch (err) {
    alert("Erro ao criar conta: " + err.message);
  }
}

async function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const usuarioRef = ref(db, "usuarios/" + username);
  const snap = await get(usuarioRef);

  if (!snap.exists()) {
    alert("Usuário não encontrado!");
    return;
  }

  const dados = snap.val();
  if (dados.senha !== password) {
    alert("Senha incorreta!");
    return;
  }

  sessionStorage.setItem("usuarioLogado", username);
  window.location.href = "2-home.html";
}

function logout() {
  sessionStorage.removeItem("usuarioLogado");
}

/* ========= BLOQUEIO ========= */
function protegerPaginas() {
  const usuario = sessionStorage.getItem("usuarioLogado");
  const pagina = window.location.pathname.split("/").pop();
  if (!usuario && pagina !== "1-index.html") {
    window.location.href = "1-index.html";
  }
}

/* ========= PERFIL ========= */
async function salvarPerfil() {
  const usuario = sessionStorage.getItem("usuarioLogado");
  if (!usuario) return;

  const usuarioRef = ref(db, "usuarios/" + usuario);

  const dados = {
    nome: document.getElementById("nome").value,
    bio: document.getElementById("bio").value,
    foto: document.getElementById("foto").value,
    corTema: document.getElementById("corTema").value
  };

  await update(usuarioRef, dados);
  alert("Perfil salvo!");
  aplicarCorTema();
}

async function carregarPerfil() {
  const usuario = sessionStorage.getItem("usuarioLogado");
  if (!usuario) return;

  const snap = await get(ref(db, "usuarios/" + usuario));
  if (!snap.exists()) return;
  const dados = snap.val();

  document.getElementById("nome").value = dados.nome || "";
  document.getElementById("bio").value = dados.bio || "";
  document.getElementById("foto").value = dados.foto || "";
  document.getElementById("foto-preview").src = dados.foto || "https://via.placeholder.com/150";
  document.getElementById("corTema").value = dados.corTema || "#4CAF50";
  document.getElementById("nome-usuario").textContent = dados.nome || usuario;
  document.getElementById("username").textContent = usuario;
}

/* ========= DIÁRIOS ========= */
async function salvarDiario() {
  const usuario = sessionStorage.getItem("usuarioLogado");
  if (!usuario) return;

  const diariosRef = ref(db, "usuarios/" + usuario + "/diarios");

  const novoDiario = {
    titulo: document.getElementById("titulo").value,
    texto: document.getElementById("texto").value,
    foto: document.getElementById("foto-diario").value,
    data: new Date().toLocaleString(),
    visibilidade: document.getElementById("visibilidade")?.value || "amigos",
    likes: []
  };

  await push(diariosRef, novoDiario);
  alert("Diário salvo!");
  window.location.href = "4-diarios.html";
}

async function carregarDiarios() {
  const usuario = sessionStorage.getItem("usuarioLogado");
  if (!usuario) return;

  const container = document.getElementById("lista-diarios") || document.getElementById("feed-diarios");
  if (!container) return;
  container.innerHTML = "";

  const usuariosSnap = await get(ref(db, "usuarios"));
  if (!usuariosSnap.exists()) return;
  const usuarios = usuariosSnap.val();

  const meusAmigos = usuarios[usuario]?.amigos || [];
  const meusBests = usuarios[usuario]?.bests || [];

  Object.keys(usuarios).forEach(u => {
    const diarios = usuarios[u].diarios || {};
    Object.keys(diarios).forEach(key => {
      const diario = diarios[key];

      // checa visibilidade
      let podeVer = false;
      if (u === usuario) podeVer = true;
      else if (diario.visibilidade === "amigos" && meusAmigos.includes(u)) podeVer = true;
      else if (diario.visibilidade === "bests" && meusBests.includes(u)) podeVer = true;
      if (!podeVer) return;

      // cria card
      let div = document.createElement("div");
      div.classList.add("card");

      let autor = usuarios[u].nome ? `${usuarios[u].nome} (${u})` : u;

      div.innerHTML = `
        <h3>${diario.titulo}</h3>
        <small>${diario.data} - por <a href="6-ver-perfil.html?user=${u}">${autor}</a></small>
        <p>${diario.texto}</p>
        ${diario.foto ? `<img src="${diario.foto}" style="max-width:200px;">` : ""}
      `;

      // botões editar/excluir
      if (u === usuario) {
        let botoes = document.createElement("div");
        botoes.classList.add("botoes-diario");

        let btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.onclick = () => editarDiario(u, key, diario);

        let btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.onclick = () => excluirDiario(u, key);

        botoes.appendChild(btnEditar);
        botoes.appendChild(btnExcluir);
        div.appendChild(botoes);
      }

      // curtidas
      const curtidas = diario.likes ? diario.likes.length : 0;
      const jaCurtiu = diario.likes ? diario.likes.includes(usuario) : false;

      let divCurtidas = document.createElement("div");
      divCurtidas.classList.add("curtidas");
      divCurtidas.innerHTML = `
        <button onclick="toggleCurtir('${u}', '${key}')">${jaCurtiu ? "💔" : "❤️"}</button>
        <span>${curtidas} curtida${curtidas !== 1 ? "s" : ""}</span>
      `;

      div.appendChild(divCurtidas);
      container.appendChild(div);
    });
  });
}

async function editarDiario(usuario, key, diario) {
  const novoTitulo = prompt("Novo título:", diario.titulo);
  const novoTexto = prompt("Novo texto:", diario.texto);
  const novaFoto = prompt("Nova URL da foto:", diario.foto);

  const diarioRef = ref(db, "usuarios/" + usuario + "/diarios/" + key);
  await update(diarioRef, {
    titulo: novoTitulo ?? diario.titulo,
    texto: novoTexto ?? diario.texto,
    foto: novaFoto ?? diario.foto
  });
  alert("Diário atualizado!");
  window.location.reload();
}

async function excluirDiario(usuario, key) {
  if (!confirm("Tem certeza que deseja excluir este diário?")) return;
  await remove(ref(db, "usuarios/" + usuario + "/diarios/" + key));
  alert("Diário excluído!");
  window.location.reload();
}

/* ========= CURTIR ========= */
async function toggleCurtir(usuarioAlvo, key) {
  const usuario = sessionStorage.getItem("usuarioLogado");
  if (!usuario) return;

  const diarioRef = ref(db, `usuarios/${usuarioAlvo}/diarios/${key}`);
  const snap = await get(diarioRef);
  if (!snap.exists()) return;
  const diario = snap.val();
  let likes = diario.likes || [];

  if (likes.includes(usuario)) likes = likes.filter(u => u !== usuario);
  else likes.push(usuario);

  await update(diarioRef, { likes });
  carregarDiarios();
}

/* ========= AMIGOS ========= */
async function adicionarAmigo() {
  const usuario = sessionStorage.getItem("usuarioLogado");
  const novoAmigo = document.getElementById("novo-amigo").value.trim();

  if (!novoAmigo) return;

  const amigoSnap = await get(ref(db, "usuarios/" + novoAmigo));
  if (!amigoSnap.exists()) {
    alert("Usuário não existe!");
    return;
  }

  const usuarioSnap = await get(ref(db, "usuarios/" + usuario));
  const dados = usuarioSnap.val();
  const lista = dados.amigos || [];

  if (!lista.includes(novoAmigo)) {
    lista.push(novoAmigo);
    await update(ref(db, "usuarios/" + usuario), { amigos: lista });
  }
  carregarAmigos();
}

async function carregarAmigos() {
  const usuario = sessionStorage.getItem("usuarioLogado");
  const container = document.getElementById("lista-amigos");
  if (!container) return;
  container.innerHTML = "";

  const snap = await get(ref(db, "usuarios/" + usuario));
  if (!snap.exists()) return;
  const lista = snap.val().amigos || [];

  for (let amigo of lista) {
    const amigoSnap = await get(ref(db, "usuarios/" + amigo));
    const dadosAmigo = amigoSnap.exists() ? amigoSnap.val() : {};

    const li = document.createElement("li");
    const nomeAmigo = dadosAmigo.nome ? `${dadosAmigo.nome} (${amigo})` : amigo;
    li.innerHTML = `<a href="6-ver-perfil.html?user=${amigo}">${nomeAmigo}</a>`;
    container.appendChild(li);
  }
}

/* ========= BESTS ========= */
async function adicionarBest() {
  const usuario = sessionStorage.getItem("usuarioLogado");
  const novoBest = document.getElementById("novo-best").value.trim();

  if (!novoBest) return;

  const bestSnap = await get(ref(db, "usuarios/" + novoBest));
  if (!bestSnap.exists()) {
    alert("Usuário não existe!");
    return;
  }

  const usuarioSnap = await get(ref(db, "usuarios/" + usuario));
  const dados = usuarioSnap.val();
  const lista = dados.bests || [];

  if (!lista.includes(novoBest)) {
    lista.push(novoBest);
    await update(ref(db, "usuarios/" + usuario), { bests: lista });
  }
  carregarBests();
}

async function carregarBests() {
  const usuario = sessionStorage.getItem("usuarioLogado");
  const container = document.getElementById("lista-bests");
  if (!container) return;
  container.innerHTML = "";

  const snap = await get(ref(db, "usuarios/" + usuario));
  if (!snap.exists()) return;
  const lista = snap.val().bests || [];

  for (let best of lista) {
    const bestSnap = await get(ref(db, "usuarios/" + best));
    const dadosBest = bestSnap.exists() ? bestSnap.val() : {};

    const li = document.createElement("li");
    const nomeBest = dadosBest.nome ? `${dadosBest.nome} (${best})` : best;
    li.innerHTML = `<a href="6-ver-perfil.html?user=${best}">${nomeBest}</a>`;
    container.appendChild(li);
  }
}

/* ========= TEMA ========= */
async function aplicarCorTema(usuarioAlvo = null) {
  const usuario = usuarioAlvo || sessionStorage.getItem("usuarioLogado");
  if (!usuario) return;

  const snap = await get(ref(db, "usuarios/" + usuario));
  if (!snap.exists()) return;
  const dados = snap.val();
  const cor = dados.corTema || "#4CAF50";

  document.querySelectorAll(".menu").forEach(menu => menu.style.backgroundColor = cor);
  document.querySelectorAll(".card, input, textarea, button").forEach(el => el.style.borderColor = cor);
}

/* ========= EXPOR ========= */
Object.assign(window, {
  criarConta,
  login,
  logout,
  salvarPerfil,
  carregarPerfil,
  salvarDiario,
  carregarDiarios,
  editarDiario,
  excluirDiario,
  toggleCurtir,
  adicionarAmigo,
  carregarAmigos,
  adicionarBest,
  carregarBests,
  aplicarCorTema
});

window.addEventListener("load", protegerPaginas);
window.addEventListener("load", () => aplicarCorTema());
