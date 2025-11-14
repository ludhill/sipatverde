// --- PASSO 1: CONFIGURAÇÃO ---
const SUPABASE_URL = 'https://liqzrrmjcdkkcxjqsczc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcXpycm1qY2Rra2N4anFzY3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTg3NDEsImV4cCI6MjA3NzUzNDc0MX0.DX1wqfEtzscXS7KzUDv140hE4CioOO7NdpwQTp-2hrs';
const WHATSAPP_NUMBER = '5584912345678'; // Número do admin

// Constantes de Preço
const PRICE_PER_NUMBER = 10;
const CROSS_SELL_COUNT = 3;
const CROSS_SELL_PRICE = 25;

// --- PASSO 2: CONECTAR AO SUPABASE ---
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- PASSO 3: PEGAR OS ELEMENTOS DO HTML ---
const grelha = document.getElementById('grelha-numeros');
const modalRecibo = document.getElementById('modal-recibo');
const modalClose = document.getElementsByClassName('modal-close')[0];
const formCheckout = document.getElementById('form-checkout');
const chkCrossSell = document.getElementById('chk-cross-sell');
const reciboNome = document.getElementById('recibo-nome');
const reciboWhatsapp = document.getElementById('recibo-whatsapp');
const reciboNumeros = document.getElementById('recibo-numeros');
const reciboValor = document.getElementById('recibo-valor');
const btnWhatsapp = document.getElementById('btn-whatsapp');

let shoppingCart = []; 
let ofertaIntervalo; 

// --- PASSO 4: FUNÇÃO PARA DESENHAR A GRELHA ---
async function carregarGrelha() {
    const { data, error } = await supabaseClient.from('numeros').select('id, status, Nome').gte('id', 1).lte('id', 100).order('id', { ascending: true });
    
    if (error) {
        console.error('Erro ao carregar números:', error);
        grelha.innerHTML = '<p>Erro ao carregar números. Tente novamente.</p>';
        return;
    }
    grelha.innerHTML = '';
    for (const numero of data) {
        const divNumero = document.createElement('div');
        divNumero.className = `numero ${numero.status}`;
        divNumero.textContent = numero.id;
        divNumero.dataset.id = numero.id;

        // *** CORREÇÃO AQUI (Limpador de Nome) ***
        if (numero.status === 'vendido' && numero.Nome) { 
            const nomeCompleto = numero.Nome; // "Fulano de Tal 99991234"
            const splitIndex = nomeCompleto.lastIndexOf(' '); // Encontra o último espaço
            
            // Pega o nome (se achou um espaço) ou usa o texto inteiro (se não achou)
            const nomeApenas = splitIndex > -1 ? nomeCompleto.substring(0, splitIndex) : nomeCompleto; 
            
            divNumero.title = `Comprado por: ${nomeApenas}`; // Mostra só "Fulano de Tal"
        }
        grelha.appendChild(divNumero);
    }
} 

// --- PASSO 5: FUNÇÃO PARA OUVIR MUDANÇAS (REALTIME) ---
function ouvirMudancas() {
    supabaseClient.channel('public:numeros')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'numeros' }, (payload) => {
            console.log('Mudança recebida!', payload.new);
            const numeroAtualizado = payload.new;
            const divNumero = document.querySelector(`.numero[data-id="${numeroAtualizado.id}"]`);
            if (divNumero) { 
                divNumero.className = `numero ${numeroAtualizado.status}`; 
                shoppingCart = shoppingCart.filter(id => id.toString() !== numeroAtualizado.id.toString());
                
                // *** CORREÇÃO AQUI (Limpador de Nome) ***
                if (numeroAtualizado.status === 'vendido' && numeroAtualizado.Nome) { 
                    const nomeCompleto = numeroAtualizado.Nome; // "Fulano de Tal 99991234"
                    const splitIndex = nomeCompleto.lastIndexOf(' '); // Encontra o último espaço
                    const nomeApenas = splitIndex > -1 ? nomeCompleto.substring(0, splitIndex) : nomeCompleto; 
                    
                    divNumero.title = `Comprado por: ${nomeApenas}`; // Mostra só "Fulano de Tal"
                } else {
                    divNumero.title = '';
                }
            }
        })
        .subscribe();
}

// --- PASSO 6: LÓGICA DE CLIQUE NA GRELHA (CARRINHO) ---
grelha.addEventListener('click', (e) => {
    const target = e.target; 
    if (target.classList.contains('numero') && target.classList.contains('disponivel')) {
        const id = target.dataset.id;
        const index = shoppingCart.indexOf(id);
        if (index > -1) { 
            shoppingCart.splice(index, 1);
            target.classList.remove('selecionado');
        } else { 
            shoppingCart.push(id);
            target.classList.add('selecionado');
        }
    }
});

// --- PASSO 7: LÓGICA DO FORMULÁRIO (AGORA 100% MANUAL) ---
formCheckout.addEventListener('submit', async (e) => {
    e.preventDefault();  

    if (shoppingCart.length === 0) {
        alert('Por favor, selecione pelo menos um número da grelha!');
        return;
    }

    const nome = document.getElementById('nome').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const isCrossSellActive = chkCrossSell.checked;
    const numerosString = shoppingCart.join(','); 

    let finalPrice = 0;
    let precoTexto = "";
    if (isCrossSellActive && shoppingCart.length === CROSS_SELL_COUNT) {
        finalPrice = CROSS_SELL_PRICE;
        precoTexto = `R$ ${finalPrice.toFixed(2)} (Promoção 3 por R$ 25!)`;
    } else {
        finalPrice = shoppingCart.length * PRICE_PER_NUMBER;
        precoTexto = `R$ ${finalPrice.toFixed(2)} (${shoppingCart.length} x R$ 10,00)`;
    } 

    reciboNome.textContent = nome;
    reciboWhatsapp.textContent = whatsapp;
    reciboNumeros.textContent = numerosString;
    reciboValor.innerHTML = precoTexto;  

    const texto = `Olá! Meu nome é ${nome} (WhatsApp: ${whatsapp}). Quero reservar os números [${numerosString}] pelo valor total de [${precoTexto}]. Vou enviar o comprovante.`;
    const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;

    btnWhatsapp.href = urlWhatsApp;
    iniciarContadorOferta(300); // 5 minutos
    modalRecibo.style.display = 'block'; // Mostra o modal
});

// --- PASSO 8: LÓGICA PARA FECHAR O MODAL ---
modalClose.onclick = function() {
    pararContadorOferta();
    modalRecibo.style.display = 'none'; 
    clearCart();
}

function clearCart() {
    shoppingCart = [];
    const selecionados = document.querySelectorAll('.numero.selecionado');
    selecionados.forEach(el => el.classList.remove('selecionado'));
}

// --- PASSO 9: FUNÇÕES DOS CONTADORES ---
function iniciarContador() { 
    const dataSorteio = new Date(2025, 10, 16, 18, 0, 0).getTime(); // 2025, Mês 10 (Novembro), Dia 16, 18:00
    const contadorDiv = document.getElementById('contador');
    const grelhaContainer = document.getElementById('escolha-numeros');
    const dadosContainer = document.getElementById('preencher-dados');

    const intervalo = setInterval(() => {
        const agora = new Date().getTime();
        const diferenca = dataSorteio - agora;

        if (diferenca < 0) {
            clearInterval(intervalo);
            contadorDiv.innerHTML = "SORTEIO ENCERRADO!";
            grelhaContainer.style.display = 'none';
            dadosContainer.style.display = 'none';
            return;
        }

        const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);

        document.getElementById('dias').textContent = dias.toString().padStart(2, '0');
        document.getElementById('horas').textContent = horas.toString().padStart(2, '0');
        document.getElementById('minutos').textContent = minutos.toString().padStart(2, '0');
        document.getElementById('segundos').textContent = segundos.toString().padStart(2, '0');
    }, 1000);
}

function pararContadorOferta() {
    clearInterval(ofertaIntervalo);
}

function iniciarContadorOferta(duracaoEmSegundos) {
    pararContadorOferta(); 
    let timer = duracaoEmSegundos;
    const contadorDisplay = document.getElementById('contador-oferta');
    if (!contadorDisplay) return; 
    contadorDisplay.textContent = "05:00";
    document.getElementById('contador-oferta-container').innerHTML = `Sua oferta expira em: <span id="contador-oferta">05:00</span>`;
    ofertaIntervalo = setInterval(() => {
        let minutos = parseInt(timer / 60, 10);
        let segundos = parseInt(timer % 60, 10);
        minutos = minutos < 10 ? "0" + minutos : minutos;
        segundos = segundos < 10 ? "0" + segundos : segundos;
        contadorDisplay.textContent = minutos + ":" + segundos;
        if (--timer < 0) {
            pararContadorOferta();
            document.getElementById('contador-oferta-container').innerHTML = "Sua oferta de desconto expirou!";
        }
    }, 1000);
}

// --- PASSO 10: INICIAR TUDO ---
carregarGrelha(); 
ouvirMudancas(); 
iniciarContador();
btnWhatsapp.addEventListener('click', pararContadorOferta);