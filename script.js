// ============================================================
// Consumo da Rick and Morty API (https://rickandmortyapi.com/)
// Os cards são criados 100% via JavaScript (createElement + appendChild).
// ============================================================

const API_URL = "https://rickandmortyapi.com/api/character";

const traducoes = {
  status: { Alive: "Vivo", Dead: "Morto", unknown: "Desconhecido" },
  species: { Human: "Humano", Alien: "Alienígena", Robot: "Robô", Animal: "Animal", Humanoid: "Humanoide",
             Cronenberg: "Cronenberg", Disease: "Doença", Poopybutthole: "Poopybutthole", Mythological: "Mitológico",
             "Mythological Creature": "Criatura mitológica", unknown: "Desconhecida" },
  gender: { Male: "Masculino", Female: "Feminino", Genderless: "Sem gênero", unknown: "Desconhecido" },
};
const traduz = (grupo, valor) => traducoes[grupo][valor] || valor;

// Elementos da página
const container = document.getElementById("cards");
const mensagem = document.getElementById("mensagem");
const inputBusca = document.getElementById("busca");
const selectStatus = document.getElementById("status");
const btnFavoritos = document.getElementById("btn-favoritos");
const btnAnterior = document.getElementById("anterior");
const btnProxima = document.getElementById("proxima");
const paginaInfo = document.getElementById("pagina-info");

// Estado da aplicação
let paginaAtual = 1;
let totalPaginas = 1;
let personagensAtuais = [];
let somenteFavoritos = false;
let favoritos = lerFavoritos();

function lerFavoritos() {
  try { return JSON.parse(localStorage.getItem("favoritos")) || {}; }
  catch { return {}; }
}
function salvarFavoritos() {
  try { localStorage.setItem("favoritos", JSON.stringify(favoritos)); } catch { /* ignora */ }
}

// ---------- Consumo da API ----------
async function buscarPersonagens() {
  const params = new URLSearchParams({ page: paginaAtual });
  if (inputBusca.value.trim()) params.set("name", inputBusca.value.trim());
  if (selectStatus.value) params.set("status", selectStatus.value);

  mostrarMensagem("Carregando personagens…");
  try {
    const resposta = await fetch(`${API_URL}?${params}`);
    if (resposta.status === 404) {          // a API devolve 404 quando não há resultados
      personagensAtuais = [];
      totalPaginas = 1;
      mostrarMensagem("Nenhum personagem encontrado com esses filtros.");
    } else if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    } else {
      const dados = await resposta.json();
      personagensAtuais = dados.results;
      totalPaginas = dados.info.pages;
      mostrarMensagem("");
    }
  } catch (erro) {
    console.error(erro);
    personagensAtuais = [];
    mostrarMensagem("Não foi possível carregar os dados da API. Verifique sua conexão e tente de novo.", true);
  }
  renderizar();
}

// ---------- Criação dinâmica dos cards (DOM) ----------
function criarCard(p) {
  const card = document.createElement("article");
  card.className = "card";

  const titulo = document.createElement("h3");
  titulo.textContent = p.name;

  const imagem = document.createElement("img");
  imagem.src = p.image;
  imagem.alt = `Foto de ${p.name}`;
  imagem.loading = "lazy";

  const lista = document.createElement("ul");
  const badge = document.createElement("span");
  badge.className = `badge ${p.status.toLowerCase()}`;
  badge.textContent = traduz("status", p.status);

  const itens = [
    ["Status", badge],
    ["Espécie", traduz("species", p.species)],
    ["Gênero", traduz("gender", p.gender)],
    ["Origem", p.origin.name],
    ["Episódios", String(p.episode.length)],
  ];
  for (const [rotulo, valor] of itens) {
    const li = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = `${rotulo}: `;
    li.appendChild(strong);
    li.append(valor);
    lista.appendChild(li);
  }

  card.append(titulo, criarBotaoFavorito(p), imagem, lista);
  return card;
}

function criarBotaoFavorito(p) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "fav";
  const ativo = Boolean(favoritos[p.id]);
  botao.setAttribute("aria-pressed", String(ativo));
  botao.setAttribute("aria-label", `Favoritar ${p.name}`);
  botao.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.4C1 8.3 3 5 6.3 5c2 0 3.7 1.1 4.7 2.8h2C14 6.1 15.7 5 17.7 5 21 5 23 8.3 21.6 11.6 19.500 16.400 12 21 12 21z"/></svg>';
  botao.addEventListener("click", () => {
    if (favoritos[p.id]) delete favoritos[p.id]; else favoritos[p.id] = p;
    salvarFavoritos();
    renderizar();
  });
  return botao;
}

function renderizar() {
  container.replaceChildren();                       // limpa a grade
  const lista = somenteFavoritos ? Object.values(favoritos) : personagensAtuais;
  if (somenteFavoritos && lista.length === 0) mostrarMensagem("Você ainda não favoritou ninguém.");
  for (const p of lista) container.appendChild(criarCard(p));

  paginaInfo.textContent = somenteFavoritos ? "Favoritos" : `Página ${paginaAtual} de ${totalPaginas}`;
  btnAnterior.disabled = somenteFavoritos || paginaAtual <= 1;
  btnProxima.disabled = somenteFavoritos || paginaAtual >= totalPaginas;
}

function mostrarMensagem(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.classList.toggle("erro", erro);
}

// ---------- Eventos ----------
let temporizador;
inputBusca.addEventListener("input", () => {        // debounce: espera o usuário parar de digitar
  clearTimeout(temporizador);
  temporizador = setTimeout(() => { paginaAtual = 1; buscarPersonagens(); }, 400);
});
selectStatus.addEventListener("change", () => { paginaAtual = 1; buscarPersonagens(); });
btnAnterior.addEventListener("click", () => { paginaAtual--; buscarPersonagens(); window.scrollTo({ top: 0, behavior: "smooth" }); });
btnProxima.addEventListener("click", () => { paginaAtual++; buscarPersonagens(); window.scrollTo({ top: 0, behavior: "smooth" }); });
btnFavoritos.addEventListener("click", () => {
  somenteFavoritos = !somenteFavoritos;
  btnFavoritos.setAttribute("aria-pressed", String(somenteFavoritos));
  mostrarMensagem("");
  renderizar();
});

buscarPersonagens();
