import { db } from "./supabaseClient.js";

// --- ESTADO DA APLICAÇÃO ---
let currentUser = null;
let currentBanca = null;
let jogadas = [];
let metasDiarias = [];

// --- SELETORES ---
// Removido o seletor global, pois cada função de renderização busca seu próprio elemento.

// --- HELPERS ---
const formatCurrency = (value) =>
  (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getLocalDateString = (date) => {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

// --- FUNÇÃO PRINCIPAL ---
export async function loadDashboard(user) {
  currentUser = user;
  await loadData();
  renderAll();
  setupEvents(); // Configura os eventos DEPOIS que os elementos foram renderizados
}

// ### FUNÇÃO OTIMIZADA PARA CARREGAMENTO PARALELO ###
async function loadData() {
  // Primeiro, precisamos da banca para poder buscar o resto
  const { data: bancaData, error: bancaError } = await db
    .from("bancas")
    .select("*")
    .eq("user_id", currentUser.id)
    .single();

  if (bancaData) {
    currentBanca = bancaData;
  } else if (!bancaError || bancaError.code === "PGRST116") {
    const { data: newBanca } = await db
      .from("bancas")
      .insert({
        user_id: currentUser.id,
        nome_banca: "Banca Principal",
        valor_inicial: 100,
        meta_diaria_percentual: 25,
      })
      .select()
      .single();
    currentBanca = newBanca;
  } else {
    console.error("Erro ao carregar banca:", bancaError);
    return; // Para a execução se a banca não puder ser carregada/criada
  }

  // Agora, busca jogadas e metas em paralelo
  const [jogadasResponse, metasResponse] = await Promise.all([
    db
      .from("jogadas")
      .select("*")
      .eq("banca_id", currentBanca.id)
      .order("data_jogada", { ascending: false }),
    db
      .from("metas_diarias")
      .select("*")
      .eq("banca_id", currentBanca.id)
      .order("data", { ascending: true }),
  ]);

  jogadas = jogadasResponse.data || [];
  metasDiarias = metasResponse.data || [];
}


// --- RENDERIZAÇÃO ---
function renderAll() {
  if (!currentBanca) return;
  // O HTML do dashboard agora é inserido aqui, garantindo que os elementos existem antes de renderizar os componentes
  document.getElementById("dashboard-container").innerHTML = `
    <header class="mb-8 flex flex-wrap justify-between items-center gap-4">
        <div>
            <h1 class="text-3xl md:text-4xl font-bold text-white"><i class="fas fa-compact-disc mr-3 text-red-500"></i>Gestão de Banca</h1>
            <p id="user-email-display" class="text-gray-400 mt-2 text-sm">Logado como: ${currentUser.email}</p>
        </div>
        <button id="logout-btn" class="btn btn-red"><i class="fas fa-sign-out-alt mr-2"></i>Logout</button>
    </header>

    <section id="metrics-container" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8"></section>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div class="lg:col-span-1 space-y-8">
            <div id="settings-container" class="card"></div>
            <div id="daily-goal-container" class="card"></div>
            <div id="bet-form-container" class="card"></div>
        </div>
        <div id="bets-history-container" class="lg:col-span-2 card"></div>
    </div>

    <div id="projection-container" class="card mb-8"></div>
  `;
  
  renderMetrics();
  renderSettings();
  renderDailyGoal();
  renderBetForm();
  renderBets();
  renderProjection();
}

function renderMetrics() {
  // ... (código de renderMetrics inalterado)
}

// ... (todas as outras funções de renderização: renderSettings, renderDailyGoal, etc. permanecem as mesmas)

// --- EVENTOS ---
function setupEvents() {
  // ... (código de setupEvents inalterado)
}
