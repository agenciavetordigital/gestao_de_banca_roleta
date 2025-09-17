import { db } from "./supabaseClient.js";

let currentUser = null, currentBanca = null, jogadas = [], metasDiarias = [];

const formatCurrency = (v) => (v||0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const getLocalDateString = (d) => {
    const date = d ? new Date(d) : new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export async function loadDashboard(user, logoutFunction) {
    currentUser = user;
    await loadData();
    renderAll();
    setupEvents(logoutFunction);
}

async function loadData() {
    const { data: bancaData, error: bancaError } = await db.from("bancas").select("*").eq("user_id", currentUser.id).single();
    if(bancaData) currentBanca = bancaData;
    else if (!bancaError || bancaError.code === 'PGRST116') {
        const { data: newBanca } = await db.from("bancas").insert({ user_id: currentUser.id, nome_banca: "Banca Principal", valor_inicial: 100, meta_diaria_percentual: 25 }).select().single();
        currentBanca = newBanca;
    } else console.error("Erro ao carregar banca:", bancaError);
    
    if (!currentBanca) return;

    const [jogadasRes, metasRes] = await Promise.all([
        db.from("jogadas").select("*").eq("banca_id", currentBanca.id).order("data_jogada", { ascending: false }),
        db.from("metas_diarias").select("*").eq("banca_id", currentBanca.id).order("data", { ascending: true })
    ]);
    jogadas = jogadasRes.data || [];
    metasDiarias = metasRes.data || [];
}

function renderAll() {
    if (!currentBanca) return;
    const dashboardContainer = document.getElementById("dashboard-container");
    dashboardContainer.innerHTML = `
        <header class="mb-8 flex flex-wrap justify-between items-center gap-4">
            <div><h1 class="text-3xl md:text-4xl font-bold text-white"><i class="fas fa-compact-disc mr-3 text-red-500"></i>Gestão de Banca</h1><p class="text-gray-400 mt-2 text-sm">Logado como: ${currentUser.email}</p></div>
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

function renderMetrics() { /* ... código ... */ }
function renderSettings() { /* ... código ... */ }
function renderDailyGoal() { /* ... código ... */ }
function renderBetForm() { /* ... código ... */ }
function renderBets() { /* ... código ... */ }
function renderProjection() { /* ... código ... */ }

// ... Colando as funções de renderização completas abaixo ...
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
    const todayStr = getLocalDateString();
    const todayMeta = metasDiarias.find(m => m.data === todayStr);
    const cycleProfit = jogadas.reduce((acc, j) => acc + (j.retorno - j.valor_apostado), 0);
    const startOfCycleBankroll = currentBanca.valor_inicial;
    const targetProfit = currentBanca.meta_diaria_percentual > 0 ? startOfCycleBankroll * (currentBanca.meta_diaria_percentual / 100) : 0;
    const dayIsClosed = todayMeta && todayMeta.status === 'concluida';

    let content = `
        <h2 class="text-xl font-bold mb-4">Meta Diária</h2>
        <div class="space-y-4">
            <div class="flex justify-between text-sm"><span class="text-gray-400">Lucro do Ciclo:</span><span class="font-semibold">${formatCurrency(cycleProfit)}</span></div>
            <div class="flex justify-between text-sm"><span class="text-gray-400">Meta do Ciclo:</span><span class="font-semibold">${formatCurrency(targetProfit)}</span></div>
            <div id="goal-met-container" class="hidden mt-4 space-y-2 text-center">
                <h3 id="goal-title" class="text-lg font-bold status-green">Parabéns, meta batida!</h3>
                <button id="goal-met-btn" class="btn btn-green w-full"><i class="fas fa-flag-checkered mr-2"></i>Meta Atingida! Fechar Ciclo</button>
                <button id="new-day-btn" class="btn btn-primary w-full hidden"><i class="fas fa-redo-alt mr-2"></i>Começar Novo Ciclo</button>
                <p id="goal-met-message" class="text-sm text-gray-300 font-medium"></p>
            </div>
        </div>
    `;
    document.getElementById('daily-goal-container').innerHTML = content;

    if (dayIsClosed) {
        const goalMetContainer = document.getElementById('goal-met-container');
        goalMetContainer.classList.remove('hidden');
        document.getElementById('goal-title').textContent = "Ciclo Concluído!";
        document.getElementById('goal-met-message').textContent = `O ciclo do dia ${new Date(todayStr + 'T00:00:00').toLocaleDateString('pt-BR')} foi fechado.`;
        document.getElementById('goal-met-btn').classList.add('hidden');
        document.getElementById('new-day-btn').classList.remove('hidden');
    } else if (cycleProfit >= targetProfit && targetProfit > 0) {
        document.getElementById('goal-met-container').classList.remove('hidden');
    }
}
function renderBetForm() {
    document.getElementById('bet-form-container').innerHTML = `
        <h2 class="text-xl font-bold mb-4">Registrar Jogada</h2>
        <form id="add-bet-form" class="space-y-4">
            <div><label for="chip-value" class="block text-sm font-medium text-gray-300 mb-2">Valor da Ficha (R$)</label><input type="number" id="chip-value" placeholder="Ex: 1.00" step="0.01" class="input-field"></div>
            <div><label for="numbers-covered" class="block text-sm font-medium text-gray-300 mb-2">Qtd. Números Cobertos</label><input type="number" id="numbers-covered" placeholder="Ex: 10" class="input-field"></div>
            <div><label for="zero-stake" class="block text-sm font-medium text-gray-300 mb-2">Proteção no Zero (R$)</label><input type="number" id="zero-stake" placeholder="Deixe em branco" step="0.01" class="input-field"></div>
            <div class="grid grid-cols-1 gap-3 pt-2">
                <button type="submit" name="win_number" class="btn btn-green"><i class="fas fa-check-circle mr-2"></i>Vitória em Número</button>
                <button type="submit" name="win_zero" class="btn btn-blue"><i class="fas fa-star mr-2"></i>Vitória no Zero</button>
                <button type="submit" name="loss" class="btn btn-red"><i class="fas fa-times-circle mr-2"></i>Derrota</button>
            </div>
        </form>
    `;
    const todayStr = getLocalDateString();
    const todayMeta = metasDiarias.find(m => m.data === todayStr);
    if (todayMeta && todayMeta.status === 'concluida') {
        document.getElementById('add-bet-form').querySelectorAll('input, button').forEach(el => el.disabled = true);
    }
}
function renderBets() {
    let rows = "";
    jogadas.forEach(bet => {
        const profit = bet.retorno - bet.valor_apostado;
        rows += `
            <tr class="border-b border-gray-800 hover:bg-gray-700/50">
                <td class="p-3 text-sm text-gray-400">${new Date(bet.data_jogada).toLocaleTimeString('pt-BR')}</td>
                <td class="p-3 text-right">${formatCurrency(bet.valor_apostado)}</td>
                <td class="p-3 text-right">${formatCurrency(bet.retorno)}</td>
                <td class="p-3 text-right ${profit > 0 ? 'status-green' : 'status-red'}">${formatCurrency(profit)}</td>
                <td class="p-3 text-center">${bet.status.startsWith('win') ? '<span class="status-green">Ganha</span>' : '<span class="status-red">Perdida</span>'}</td>
                <td class="p-3 text-center"><button class="text-red-500 hover:text-red-400 delete-btn" data-id="${bet.id}"><i class="fas fa-trash-alt"></i></button></td>
            </tr>
        `;
    });
    document.getElementById('bets-history-container').innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Histórico de Jogadas do Ciclo</h2>
            <button id="clear-data-btn" class="text-sm text-red-500 hover:text-red-400 font-semibold"><i class="fas fa-trash-alt mr-1"></i> Limpar Jogadas do Ciclo</button>
        </div>
        <div class="overflow-x-auto"><table class="w-full text-left">
            <thead class="border-b border-gray-700 text-sm text-gray-400">
                <tr><th class="p-3">Data/Hora</th><th class="p-3 text-right">Apostado</th><th class="p-3 text-right">Retorno</th><th class="p-3 text-right">Lucro/Prejuízo</th><th class="p-3 text-center">Status</th><th class="p-3 text-center">Ações</th></tr>
            </thead>
            <tbody>${rows || `<tr><td colspan="6" class="text-center text-gray-500 py-8">Nenhuma jogada registrada neste ciclo.</td></tr>`}</tbody>
        </table></div>
    `;
}
function renderProjection() {
    let rows = "";
    let bankrollForProjection = metasDiarias[0]?.banca_inicial || currentBanca.valor_inicial;
    metasDiarias.forEach(meta => {
        rows += `
            <tr class="bg-green-900/50">
                <td class="p-3 text-sm text-gray-400">${new Date(meta.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td class="p-3 text-right">${formatCurrency(bankrollForProjection)}</td>
                <td class="p-3 text-right status-green">${formatCurrency(meta.lucro_final)}</td>
                <td class="p-3 text-right font-semibold">${formatCurrency(meta.banca_final)}</td>
                <td class="p-3 text-center"><span class="status-green font-semibold">Alcançado ✅</span></td>
            </tr>
        `;
        bankrollForProjection = meta.banca_final;
    });
    const cycleProfit = jogadas.reduce((acc, j) => acc + (j.retorno - j.valor_apostado), 0);
    bankrollForProjection += cycleProfit;
    for (let i = 0; i < 15; i++) {
        const lastDate = metasDiarias.length > 0 ? new Date(metasDiarias[metasDiarias.length - 1].data + 'T00:00:00') : new Date(new Date().setDate(new Date().getDate() - 1));
        const date = new Date(lastDate);
        date.setDate(lastDate.getDate() + i + 1);
        const initialProjected = bankrollForProjection;
        const goal = currentBanca.meta_diaria_percentual > 0 ? initialProjected * (currentBanca.meta_diaria_percentual / 100) : 0;
        const finalProjected = initialProjected + goal;
        rows += `
            <tr>
                <td class="p-3 text-sm text-gray-400">${date.toLocaleDateString('pt-BR')}</td>
                <td class="p-3 text-right">${formatCurrency(initialProjected)}</td>
                <td class="p-3 text-right status-green">${formatCurrency(goal)}</td>
                <td class="p-3 text-right font-semibold">${formatCurrency(finalProjected)}</td>
                <td class="p-3 text-center">Pendente</td>
            </tr>
        `;
        bankrollForProjection = finalProjected;
    }
    document.getElementById('projection-container').innerHTML = `
        <h2 class="text-xl font-bold mb-4">Histórico de Metas e Projeção Futura</h2>
        <div class="overflow-x-auto"><table class="w-full text-left">
            <thead class="border-b border-gray-700 text-sm text-gray-400">
                <tr><th class="p-3">Data</th><th class="p-3 text-right">Banca Inicial do Ciclo</th><th class="p-3 text-right">Lucro do Ciclo (R$)</th><th class="p-3 text-right">Banca Final do Ciclo</th><th class="p-3 text-center">Status</th></tr>
            </thead>
            <tbody>${rows}</tbody>
        </table></div>
    `;
}

// --- CONFIGURAÇÃO DOS EVENTOS ---
function setupEvents(logoutFunction) {
    document.getElementById("logout-btn")?.addEventListener("click", async () => { await logoutFunction(); location.reload(); });
    document.getElementById("save-bankroll-btn")?.addEventListener("click", async () => {
        const newBankroll = parseFloat(document.getElementById('bankroll-input').value);
        const newGoal = parseFloat(document.getElementById('daily-goal-input').value);
        if (isNaN(newBankroll) || isNaN(newGoal)) { return alert('Valores inválidos.'); }
        const { data, error } = await db.from('bancas').update({ valor_inicial: newBankroll, meta_diaria_percentual: newGoal }).eq('id', currentBanca.id).select().single();
        if (error) { alert('Erro ao salvar: ' + error.message); } else { currentBanca = data; alert('Configurações salvas!'); renderAll(); setupEvents(); }
    });
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
        if (error) { alert("Erro ao registrar jogada."); } else { jogadas.unshift(newBet); document.getElementById('add-bet-form').reset(); renderAll(); setupEvents(); }
    });
    document.getElementById("clear-data-btn")?.addEventListener("click", async () => {
        if (!confirm("Tem certeza?")) return;
        await db.from("jogadas").delete().eq("banca_id", currentBanca.id);
        jogadas = []; renderAll(); setupEvents();
    });
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
    document.getElementById("bets-history-container")?.addEventListener("click", async (e) => {
        if (e.target.closest('.delete-btn')) {
            const button = e.target.closest('.delete-btn');
            const idToDelete = button.getAttribute('data-id');
            if(confirm('Apagar esta jogada?')){
                await db.from('jogadas').delete().eq('id', idToDelete);
                jogadas = jogadas.filter(j => j.id != idToDelete);
                renderAll();
                setupEvents();
            }
        }
    });
}
});
