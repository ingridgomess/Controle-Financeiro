// ===================================
// SCRIPT COMPLETO - COFRINHO FAMILIAR
// ===================================

let movimentacoes = JSON.parse(localStorage.getItem("movimentacoes")) || [];
let gastosCartao = JSON.parse(localStorage.getItem("gastosCartao")) || [];
let gastosDebito = JSON.parse(localStorage.getItem("gastosDebito")) || [];
let reservaEmergencia = Number(localStorage.getItem("reservaEmergencia")) || 0;

let usuarios = {
    pai: "1234",
    admin: "abcd"
};

// ------------------- LOGIN -------------------
function fazerLogin() {
    const usuario = document.getElementById("usuarioLogin").value;
    const senha = document.getElementById("senhaLogin").value;
    const msg = document.getElementById("msgLogin");

    if (usuarios[usuario] && usuarios[usuario] === senha) {
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("mainApp").style.display = "block";
        atualizarTela();
        atualizarTelaCartao();
        atualizarTelaDebito();
        atualizarGraficos();
        atualizarGraficosCartao();
        atualizarGraficosDebito();
    } else {
        msg.innerText = "Usuário ou senha incorretos!";
        msg.style.color = "red";
    }
}

// ------------------- UTILITÁRIOS -------------------
function dataAtual() {
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, "0");
    const mes = String(now.getMonth() + 1).padStart(2, "0");
    const ano = now.getFullYear();
    const hora = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

function salvarDados() {
    localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));
    localStorage.setItem("gastosCartao", JSON.stringify(gastosCartao));
    localStorage.setItem("gastosDebito", JSON.stringify(gastosDebito));
    localStorage.setItem("reservaEmergencia", reservaEmergencia);
}

function filtrarPorMes(array, mes) {
    if (!mes) return array;
    return array.filter(item => item.data.split("/")[1] === mes);
}

// ------------------- ABA INICIO -------------------
function adicionarMovimentacao() {
    const desc = document.getElementById("descricao").value.trim();
    const valor = Number(document.getElementById("valor").value);
    const tipo = document.getElementById("tipo").value;
    const categoria = document.getElementById("categoria").value;

    if (!desc || valor <= 0) { alert("Preencha corretamente."); return; }

    movimentacoes.push({ descricao: desc, valor, tipo, categoria, data: dataAtual() });
    salvarDados();
    atualizarTela();

    document.getElementById("descricao").value = "";
    document.getElementById("valor").value = "";
}

function excluirMovimentacao(index) {
    movimentacoes.splice(index, 1);
    salvarDados();
    atualizarTela();
}

function atualizarTela() {
    const lista = document.getElementById("lista");
    lista.innerHTML = "";
    const filtroMes = document.getElementById("filtroMes").value;
    const movFiltradas = filtrarPorMes(movimentacoes, filtroMes);

    let saldo = 0, entradas = 0, saidas = 0;

    movFiltradas.forEach((mov, index) => {
        const li = document.createElement("li");
        li.innerHTML = `${mov.data} — ${mov.descricao} (${mov.categoria}) — ${mov.tipo==="entrada"?"+":"-"} R$ ${mov.valor.toFixed(2)} <button onclick="excluirMovimentacao(${index})">❌</button>`;
        lista.appendChild(li);

        if (mov.tipo === "entrada") { saldo+=mov.valor; entradas+=mov.valor; }
        else { saldo-=mov.valor; saidas+=mov.valor; }
    });

    document.getElementById("saldo").innerText = `R$ ${saldo.toFixed(2)}`;
    document.getElementById("resumoTexto").innerText =
        `Entradas: R$ ${entradas.toFixed(2)} | Saídas: R$ ${saidas.toFixed(2)} | Reserva: R$ ${reservaEmergencia.toFixed(2)}`;
}

// ------------------- CARTÃO DE CRÉDITO -------------------
function adicionarGastoCartao() {
    const desc = document.getElementById("descCartao").value.trim();
    const valor = Number(document.getElementById("valorCartao").value);
    const usuario = document.getElementById("quemUsou").value;
    const parcelas = Number(document.getElementById("parcelasCartao").value) || 1;

    if (!desc || valor <=0 || parcelas<=0) { alert("Preencha corretamente."); return; }

    for (let i=0; i<parcelas; i++){
        let venc = new Date();
        venc.setMonth(venc.getMonth()+i);
        venc.setDate(10); // TODAS AS PARCELAS VENCEM NO DIA 10
        const dia = String(venc.getDate()).padStart(2,"0");
        const mesV = String(venc.getMonth()+1).padStart(2,"0");
        const ano = venc.getFullYear();

        gastosCartao.push({
            descricao: desc,
            valor: valor/parcelas,
            usuario,
            parcelaAtual: i+1,
            totalParcelas: parcelas,
            data: dataAtual(),
            mes: mesV,
            vencimento: `${dia}/${mesV}/${ano}`
        });
    }

    salvarDados();
    atualizarTelaCartao();
    atualizarGraficosCartao();

    document.getElementById("descCartao").value="";
    document.getElementById("valorCartao").value="";
    document.getElementById("parcelasCartao").value="";
}

function excluirCartao(index) {
    gastosCartao.splice(index,1);
    salvarDados();
    atualizarTelaCartao();
    atualizarGraficosCartao();
}

function atualizarTelaCartao() {
    const lista = document.getElementById("listaCartao");
    lista.innerHTML = "";
    const filtroMes = document.getElementById("filtroMesCartao")?.value || null;
    const gastosFiltrados = filtrarPorMes(gastosCartao, filtroMes);

    let resumo = {};

    gastosFiltrados.forEach((gasto,index)=>{
        if(!resumo[gasto.usuario]) resumo[gasto.usuario]=0;
        resumo[gasto.usuario]+=gasto.valor;

        const li = document.createElement("li");
        li.innerHTML = `${gasto.data} — ${gasto.descricao} — R$ ${gasto.valor.toFixed(2)} (Parcela ${gasto.parcelaAtual}/${gasto.totalParcelas}) - Vence: ${gasto.vencimento} <button onclick="excluirCartao(${index})">❌</button>`;
        lista.appendChild(li);

        // ALERTA DE VENCIMENTO
        const vencimentoData = new Date(gasto.vencimento.split("/").reverse().join("-"));
        const hoje = new Date();
        const diff = (vencimentoData-hoje)/(1000*60*60*24);
        if(diff<=2 && diff>=0){ li.style.backgroundColor="#ffcccc"; }
    });

    let textoResumo="Total por usuário: ";
    for(let key in resumo) textoResumo+=`${key}: R$ ${resumo[key].toFixed(2)} | `;
    document.getElementById("resumoCartao").innerText = textoResumo;
}

// ------------------- CARTÃO DE DÉBITO -------------------
function adicionarGastoDebito() {
    const desc = document.getElementById("descDebito").value.trim();
    const valor = Number(document.getElementById("valorDebito").value);
    const usuario = document.getElementById("quemDebito").value;

    if (!desc || valor<=0) { alert("Preencha corretamente."); return; }

    gastosDebito.push({ descricao: desc, valor, usuario, data: dataAtual() });
    salvarDados();
    atualizarTelaDebito();
    atualizarGraficosDebito();

    document.getElementById("descDebito").value="";
    document.getElementById("valorDebito").value="";
}

function excluirDebito(index) {
    gastosDebito.splice(index,1);
    salvarDados();
    atualizarTelaDebito();
    atualizarGraficosDebito();
}

function atualizarTelaDebito() {
    const lista = document.getElementById("listaDebito");
    lista.innerHTML="";
    const filtroMes = document.getElementById("filtroMesDebito")?.value || null;
    const gastosFiltrados = filtrarPorMes(gastosDebito,filtroMes);

    let resumo={};
    gastosFiltrados.forEach((gasto,index)=>{
        if(!resumo[gasto.usuario]) resumo[gasto.usuario]=0;
        resumo[gasto.usuario]+=gasto.valor;

        const li=document.createElement("li");
        li.innerHTML=`${gasto.data} — ${gasto.descricao} — R$ ${gasto.valor.toFixed(2)} <button onclick="excluirDebito(${index})">❌</button>`;
        lista.appendChild(li);
    });

    let textoResumo="Total por usuário: ";
    for(let key in resumo) textoResumo+=`${key}: R$ ${resumo[key].toFixed(2)} | `;
    document.getElementById("resumoDebito").innerText = textoResumo;
}

// ------------------- GRÁFICOS -------------------
let chartMensal, chartCategorias, chartCartaoPizza, chartCartaoBarra, chartDebitoPizza, chartDebitoBarra;

function atualizarGraficos() {
    const ctxMensal = document.getElementById("graficoMensal").getContext("2d");
    const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    let entradasMes=Array(12).fill(0), saidasMes=Array(12).fill(0);

    movimentacoes.forEach(m=>{
        const mes = parseInt(m.data.split("/")[1],10)-1;
        if(m.tipo==="entrada") entradasMes[mes]+=m.valor;
        else saidasMes[mes]+=m.valor;
    });

    if(chartMensal) chartMensal.destroy();
    chartMensal = new Chart(ctxMensal,{
        type:"bar",
        data:{ labels:meses, datasets:[
            {label:"Entradas", data:entradasMes, backgroundColor:"#00ffff"},
            {label:"Saídas", data:saidasMes, backgroundColor:"#ff6347"}
        ]},
        options:{responsive:true, plugins:{legend:{position:"top"}}}
    });

    // Categorias
    const ctxCat=document.getElementById("graficoCategorias").getContext("2d");
    let categorias={};
    movimentacoes.forEach(m=>{
        if(!categorias[m.categoria]) categorias[m.categoria]=0;
        categorias[m.categoria]+=m.valor;
    });

    if(chartCategorias) chartCategorias.destroy();
    chartCategorias = new Chart(ctxCat,{
        type:"pie",
        data:{ labels:Object.keys(categorias), datasets:[{data:Object.values(categorias), backgroundColor:["#ff9999","#66b3ff","#99ff99","#ffcc99","#c266ff"]}] },
        options:{responsive:true}
    });
}

function atualizarGraficosCartao() {
    const ctxPizza = document.getElementById("graficoCartaoPizza").getContext("2d");
    const ctxBarra = document.getElementById("graficoCartaoBarra").getContext("2d");

    let resumo={};
    gastosCartao.forEach(g=>{
        if(!resumo[g.usuario]) resumo[g.usuario]=0;
        resumo[g.usuario]+=g.valor;
    });

    if(chartCartaoPizza) chartCartaoPizza.destroy();
    chartCartaoPizza = new Chart(ctxPizza,{
        type:"pie",
        data:{ labels:Object.keys(resumo), datasets:[{data:Object.values(resumo), backgroundColor:["#ff9999","#66b3ff","#99ff99","#ffcc99"]}] },
        options:{responsive:true}
    });

    if(chartCartaoBarra) chartCartaoBarra.destroy();
    chartCartaoBarra = new Chart(ctxBarra,{
        type:"bar",
        data:{ labels:Object.keys(resumo), datasets:[{label:"Total por usuário", data:Object.values(resumo), backgroundColor:"#66b3ff"}] },
        options:{responsive:true}
    });
}

function atualizarGraficosDebito() {
    const ctxPizza = document.getElementById("graficoDebitoPizza").getContext("2d");
    const ctxBarra = document.getElementById("graficoDebitoBarra").getContext("2d");

    let resumo={};
    gastosDebito.forEach(g=>{
        if(!resumo[g.usuario]) resumo[g.usuario]=0;
        resumo[g.usuario]+=g.valor;
    });

    if(chartDebitoPizza) chartDebitoPizza.destroy();
    chartDebitoPizza = new Chart(ctxPizza,{
        type:"pie",
        data:{ labels:Object.keys(resumo), datasets:[{data:Object.values(resumo), backgroundColor:["#ff9999","#66b3ff","#99ff99","#ffcc99"]}] },
        options:{responsive:true}
    });

    if(chartDebitoBarra) chartDebitoBarra.destroy();
    chartDebitoBarra = new Chart(ctxBarra,{
        type:"bar",
        data:{ labels:Object.keys(resumo), datasets:[{label:"Total por usuário", data:Object.values(resumo), backgroundColor:"#66b3ff"}] },
        options:{responsive:true}
    });
}

// ------------------- ABAS -------------------
function trocarAba(id){
    document.querySelectorAll(".aba").forEach(a=>a.classList.remove("ativa"));
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    document.getElementById(id).classList.add("ativa");
    event.target.classList.add("active");
}

// ------------------- INICIALIZAÇÃO -------------------
atualizarTela();
atualizarTelaCartao();
atualizarTelaDebito();
atualizarGraficos();
atualizarGraficosCartao();
atualizarGraficosDebito();
