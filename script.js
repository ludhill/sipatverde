const SUPABASE_URL = 'https://liqzrrmjcdkkcxjqsczc.supabase.co';  
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcXpycm1qY2Rra2N4anFzY3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTg3NDEsImV4cCI6MjA3NzUzNDc0MX0.DX1wqfEtzscXS7KzUDv140hE4CioOO7NdpwQTp-2hrs'; // Substitua pela sua 'anon' (publishable) key
const N8N_RESERVAR_URL = 'https://ldenner.app.n8n.cloud/webhook/ad7c799e-0db1-490f-afe3-ec921f660e82';  
const WHATSAPP_NUMBER = '5584987677603'; 
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 
const grelha = document.getElementById('grelha-numeros');
const modal = document.getElementById('modal-reserva');
const modalClose = document.getElementsByClassName('modal-close')[0];
const formCheckout = document.getElementById('form-checkout');
const numeroReservadoSpan = document.getElementById('numero-reservado');
let numeroSelecionado = 0; 
 
async function carregarGrelha() {
    const { data, error } = await supabase.from('numeros').select().order('id', { ascending: true });

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
    supabase.channel('public:numeros')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'numeros' }, (payload) => {
            console.log('Mudança recebida!', payload.new);
            const numeroAtualizado = payload.new;
            const divNumero = document.querySelector(`.numero[data-id="${numeroAtualizado.id}"]`);
            if (divNumero) {
                divNumero.className = `numero ${numeroAtualizado.status}`; 
            }
        })
        .subscribe();
}
 
grelha.addEventListener('click', async (e) => { 
    if (e.target.classList.contains('numero') && e.target.classList.contains('disponivel')) {
        const id = e.target.dataset.id;
        numeroSelecionado = id; 
        try {
            await fetch(`${N8N_RESERVAR_URL}?numero=${id}`);
             
            numeroReservadoSpan.textContent = id; 
            modal.style.display = 'block';  
            
        } catch (err) {
            console.error('Erro ao reservar:', err);
            alert('Ops! Erro ao tentar reservar o número. Tente novamente.');
        }
    }
});
 
formCheckout.addEventListener('submit', (e) => {
    e.preventDefault();  
 
    const nome = document.getElementById('nome').value;
    const whatsapp = document.getElementById('whatsapp').value;
 
    const texto = `Olá! Meu nome é ${nome} (WhatsApp: ${whatsapp}). Acabei de reservar o número ${numeroSelecionado} para a Rifa Solidária e vou enviar o comprovante.`;
     
    const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
 
    window.open(urlWhatsApp, '_blank'); 
     
    modal.style.display = 'none';
});
 
modalClose.onclick = function() {
    modal.style.display = 'none'; 
}
 
carregarGrelha();  
ouvirMudancas();  