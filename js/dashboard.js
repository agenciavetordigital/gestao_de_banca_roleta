import { db } from "./supabaseClient.js";
import { logout } from "./auth.js";

// --- ESTADO ---
let currentUser = null;
let currentBanca = null;
let jogadas = [];
let metasDiarias = [];

// --- FUNÇÕES AUXILIARES ---
const formatCurrency = (value) => (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const getLocalDateString = (date) => {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// --- FUNÇÃO PRINCIPAL ---
export async function loadDashboard(user) {
  currentUser = user;
  await loadData();
  renderAll();
  setupEvents();
}

// --- LÓGICA DE DADOS OTIMIZADA ---
async function loadData() {
  const { data: bancaData, error: bancaError } = await db.from("bancas").select("*").eq("user_id", currentUser.id).single();
  if (bancaData) {
    currentBanca = bancaData;
  } else if (!bancaError || bancaError.code === "PGRST116") {
    const { data: newBanca } = await db.from("bancas").insert({ user_id: currentUser.id, nome_banca: "Banca Principal", valor_inicial: 100, meta_diaria_percentual: 25 }).select().single();
    currentBanca = newBanca;
  } else { console.error("Erro ao carregar banca:", bancaError); return; }

  const [jogadasResponse, metasResponse] = await Promise.all([
    db.from("jogadas").select("*").eq("banca_id", currentBanca.id).order("data_jogada", { ascending: false }),
    db.from("metas_diarias").select("*").eq("banca_id", currentBanca.id).order("data", { ascending: true }),
  ]);
  jogadas = jogadasResponse.data || [];
  metasDiarias = metasResponse.data || [];
}

// --- LÓGICA DE RENDERIZAÇÃO ---
function renderAll() {
  if (!currentBanca) return;
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
  renderMetrics(); renderSettings(); renderDailyGoal(); renderBetForm(); renderBets(); renderProjection();
}

function renderMetrics() {
    const cycleProfit = jogadas.reduce((acc, j) => acc + (j.retorno - j.valor_apostado), 0);
    const totalStaked = jogadas.reduce((acc, j) => acc + j.valor_apostado, 0);
    const wonPlays = jogadas.filter(j => j.retorno > j.valor_apostado).length;
    const currentBankroll = currentBanca.valor_inicial + cycleProfit;
    let totalProfitAllTime = cycleProfit;
    metasDiarias.forEach(meta => { totalProfitAllTime += meta.lucro_final; });
    const roi = totalStaked > 0 ? (cycleProfit / totalStaked) * 100 : 0;
    const winRate = jogadas.length > 0 ? (wonPlays / jogadas.length) * 100 : 0;
    document.getElementById('metrics-container').innerHTML = `
        <div class="card"><h3 class="text-sm font-medium text-gray-400">BANCA INICIAL</h3><p class="text-2xl font-semibold mt-2">${formatCurrency(currentBanca.valor_inicial)}</p></div>
        <div class="card"><h3 class="text-sm font-medium text-gray-400">BANCA ATUAL</h3><p class="text-2xl font-semibold mt-2">${formatCurrency(currentBankroll)}</p></div>
        <div class="card"><h3 class="text-sm font-medium text-gray-400">LUCRO TOTAL</h3><p class="text-2xl font-semibold mt-2">${formatCurrency(totalProfitAllTime)}</p></div>
        <div class="card"><h3 class="text-sm font-medium text-gray-400">ROI DO CICLO</h3><p class="text-2xl font-semibold mt-2">${roi.toFixed(2)}%</p></div>
        <div class="card"><h3 class="text-sm font-medium text-gray-400">WIN RATE DO CICLO</h3><p class="text-2xl font-semibold mt-2">${winRate.toFixed(2)}%</p></div>
    `;
}

function renderSettings() {
    document.getElementById('settings-container').innerHTML = `
        <h2 class="text-xl font-bold mb-4">Configurações</h2>
        <div class="space-y-4">
            <div><label for="bankroll-input" class="block text-sm font-medium text-gray-300 mb-2">Banca Inicial (R$)</label><input type="number" id="bankroll-input" value="${currentBanca.valor_inicial}" class="input-field"></div>
            <div><label for="daily-goal-input" class="block text-sm font-medium text-gray-300 mb-2">Meta de Lucro Diário (%)</label><input type="number" id="daily-goal-input" value="${currentBanca.meta_diaria_percentual}" class="input-field"></div>
            <button id="save-bankroll-btn" class="btn btn-primary w-full"><i class="fas fa-save mr-2"></i>Salvar Configurações</button>
        </div>
    `;
}

function renderDailyGoal() {
    // ... (código inalterado)
}

function renderBetForm() {
    // ... (código inalterado)
}

function renderBets() {
    // ... (código inalterado)
}

function renderProjection() {
    // ... (código inalterado)
}

// --- CONFIGURAÇÃO DOS EVENTOS ---
function setupEvents() {
    // Logout
    document.getElementById("logout-btn")?.addEventListener("click", async () => {
        await logout();
        location.reload();
    });

    // Salvar Configurações
    document.getElementById("save-bankroll-btn")?.addEventListener("click", async () => {
        const newBankroll = parseFloat(document.getElementById('bankroll-input').value);
        const newGoal = parseFloat(document.getElementById('daily-goal-input').value);
        if (isNaN(newBankroll) || isNaN(newGoal)) { return alert('Valores inválidos.'); }
        const { data, error } = await db.from('bancas').update({ valor_inicial: newBankroll, meta_diaria_percentual: newGoal }).eq('id', currentBanca.id).select().single();
        if (error) { alert('Erro ao salvar: ' + error.message); } 
        else { currentBanca = data; alert('Configurações salvas!'); renderAll(); setupEvents(); }
    });

    // Adicionar Jogada
    document.getElementById("add-bet-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const outcome = e.submitter.name;
        const chipValue = parseFloat(document.getElementById('chip-value').value) || 0;
        const numbersCovered = parseInt(document.getElementById('numbers-covered').value) || 0;
        const zeroStake = parseFloat(document.getElementById('zero-stake').value) || 0;
        if (outcome === 'win_number' && (chipValue <= 0 || numbersCovered <= 0)) { return alert('Preencha os campos corretamente.'); }
        const totalStake = (chipValue * numbersCovered) + zeroStake;
        let result = 0, status = '';
        if (outcome === 'win_number') { result = chipValue * 36; status = 'win'; }
        else if (outcome === 'win_zero') { result = zeroStake * 36; status = 'win_zero'; }
        else if (outcome === 'loss') { result = 0; status = 'loss'; }
        
        if (totalStake <= 0) return alert("Valor apostado inválido.");

        const { data: newBet, error } = await db.from('jogadas').insert({ banca_id: currentBanca.id, valor_apostado: totalStake, retorno: result, status: status, estrategia: 'Jogada Manual' }).select().single();
        if (error) { alert("Erro ao registrar jogada."); }
        else { jogadas.unshift(newBet); document.getElementById('add-bet-form').reset(); renderAll(); setupEvents(); }
    });

    // Limpar Jogadas
    document.getElementById("clear-data-btn")?.addEventListener("click", async () => {
        if (!confirm("Tem certeza?")) return;
        await db.from("jogadas").delete().eq("banca_id", currentBanca.id);
        jogadas = [];
        renderAll();
        setupEvents();
    });

    // Fechar Ciclo (Meta Batida)
    document.getElementById("goal-met-btn")?.addEventListener("click", async () => {
        const todayStr = getLocalDateString();
        const cycleProfit = jogadas.reduce((acc, j) => acc + (j.retorno - j.valor_apostado), 0);
        const finalBankroll = currentBanca.valor_inicial + cycleProfit;
        const { data: newMeta, error } = await db.from('metas_diarias').upsert({ user_id: currentUser.id, banca_id: currentBanca.id, data: todayStr, status: 'concluida', lucro_final: cycleProfit, banca_final: finalBankroll }, { onConflict: 'banca_id, data' }).select().single();
        if (!error) {
            const index = metasDiarias.findIndex(m => m.data === todayStr);
            if (index > -1) metasDiarias[index] = newMeta; else metasDiarias.push(newMeta);
            renderAll();
            setupEvents();
        }
    });

    // Começar Novo Ciclo
    document.getElementById("new-day-btn")?.addEventListener("click", async () => {
        const btn = document.getElementById("new-day-btn");
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Iniciando...';
        try {
            const finalBankroll = currentBanca.valor_inicial + jogadas.reduce((acc, j) => acc + (j.retorno - j.valor_apostado), 0);
            await db.from('bancas').update({ valor_inicial: finalBankroll }).eq('id', currentBanca.id);
            await db.from('jogadas').delete().eq('banca_id', currentBanca.id);
            location.reload();
        } catch (error) {
            alert('Ocorreu um erro: ' + error.message);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-redo-alt mr-2"></i>Começar Novo Ciclo';
        }
    });

    // Deletar Jogada Individual
    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", async (e) => {
            const idToDelete = e.currentTarget.getAttribute('data-id');
            if(confirm('Apagar esta jogada?')){
                await db.from('jogadas').delete().eq('id', idToDelete);
                jogadas = jogadas.filter(j => j.id != idToDelete);
                renderAll();
                setupEvents();
            }
        });
    });
}
