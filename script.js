 
const SUPABASE_URL = 'https://liqzrrmjcdkkcxjqsczc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcXpycm1qY2Rra2N4anFzY3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTg3NDEsImV4cCI6MjA3NzUzNDc0MX0.DX1wqfEtzscXS7KzUDv140hE4CioOO7NdpwQTp-2hrs';
const N8N_RESERVAR_URL = 'https://ldenner.app.n8n.cloud/webhook/ad7c799e-0db1-490f-afe3-ec921f660e82';
const WHATSAPP_NUMBER = '5584987677603';
 
const PRICE_PER_NUMBER = 10;
const CROSS_SELL_COUNT = 3;
const CROSS_SELL_PRICE = 25;
 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 
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
async function carregarGrelha() {
    const { data, error } = await supabaseClient.from('numeros').select().order('id', { ascending: true });
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
        grelha.appendChild(divNumero);
    }
} 
function ouvirMudancas() {
    supabaseClient.channel('public:numeros')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'numeros' }, (payload) => {
            console.log('Mudança recebida!', payload.new);
            const numeroAtualizado = payload.new;
            const divNumero = document.querySelector(`.numero[data-id="${numeroAtualizado.id}"]`);
            if (divNumero) { 
                divNumero.className = `numero ${numeroAtualizado.status}`; 
                shoppingCart = shoppingCart.filter(id => id !== numeroAtualizado.id);
            }
        })
        .subscribe();
}
 
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
        console.log('Carrinho:', shoppingCart);
    }
});
 
formCheckout.addEventListener('submit', async (e) => {
    e.preventDefault();  

    // 1. Validar o carrinho
    if (shoppingCart.length === 0) {
        alert('Por favor, selecione pelo menos um número da grade!');
        return;
    }
 
    const nome = document.getElementById('nome').value;
    const whatsapp = document.getElementById('whatsapp').value; 
    const isCrossSellActive = chkCrossSell.checked;
 
    const numerosString = shoppingCart.join(','); 
 
    try { 
        await fetch(`${N8N_RESERVAR_URL}?numeros=${numerosString}`);
    } catch (err) {
        console.error('Erro ao reservar:', err);
        alert('Ops! Erro ao tentar reservar os números. Tente novamente.');
        return;  
    }
 
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
 
    const texto = `Olá! Meu nome é ${nome} (WhatsApp: ${whatsapp}). Acabei de reservar os números [${numerosString}] pelo valor total de [${precoTexto}]. Vou enviar o comprovante.`;
    const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
 
    btnWhatsapp.href = urlWhatsApp;
    iniciarContadorOferta(300);
    modalRecibo.style.display = 'block';
});

let ofertaIntervalo;
 
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

function iniciarContador() {
    // IMPORTANTE: Defina a data exata do sorteio aqui (Ano, Mês, Dia, Hora)
    // Os meses em JS vão de 0 (Jan) a 11 (Dez), então 10 = Novembro.
    const dataSorteio = new Date("2025-11-16T18:00:00").getTime(); // 16 de Nov de 2025, às 18:00

    const contadorDiv = document.getElementById('contador');
    const grelhaContainer = document.getElementById('escolha-numeros');
    const dadosContainer = document.getElementById('preencher-dados');

    // Atualiza o contador a cada 1 segundo
    const intervalo = setInterval(() => {
        const agora = new Date().getTime();
        const diferenca = dataSorteio - agora;

        // Se o tempo acabou
        if (diferenca < 0) {
            clearInterval(intervalo);
            contadorDiv.innerHTML = "SORTEIO ENCERRADO!";
            // Esconde a grelha e o formulário
            grelhaContainer.style.display = 'none';
            dadosContainer.style.display = 'none';
            return;
        }

        // Cálculos de tempo
        const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);

        // Atualiza o HTML
        // (usamos .padStart(2, '0') para garantir que sempre tenha 2 dígitos, ex: "09" em vez de "9")
        document.getElementById('dias').textContent = dias.toString().padStart(2, '0');
        document.getElementById('horas').textContent = horas.toString().padStart(2, '0');
        document.getElementById('minutos').textContent = minutos.toString().padStart(2, '0');
        document.getElementById('segundos').textContent = segundos.toString().padStart(2, '0');

    }, 1000);
}
 
function pararContadorOferta() {
    clearInterval(ofertaIntervalo);
}

// Função para INICIAR o contador da oferta
function iniciarContadorOferta(duracaoEmSegundos) {
    pararContadorOferta(); // Limpa qualquer timer antigo antes de começar

    let timer = duracaoEmSegundos;
    const contadorDisplay = document.getElementById('contador-oferta');

    ofertaIntervalo = setInterval(() => {
        let minutos = parseInt(timer / 60, 10);
        let segundos = parseInt(timer % 60, 10);

        // Formata para "05:00"
        minutos = minutos < 10 ? "0" + minutos : minutos;
        segundos = segundos < 10 ? "0" + segundos : segundos;

        contadorDisplay.textContent = minutos + ":" + segundos;

        if (--timer < 0) {
            pararContadorOferta();
            document.getElementById('contador-oferta-container').innerHTML = "Sua oferta de desconto expirou!";
            // Aqui você poderia, no futuro, desativar o checkbox de cross-sell
        }
    }, 1000);
}

carregarGrelha(); 
ouvirMudancas(); 
iniciarContador();
btnWhatsapp.addEventListener('click', pararContadorOferta);