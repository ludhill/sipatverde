# 🚀 Rifa Solidária - CIPAT Equipe Verde

Este é o projeto da landing page para a Rifa Solidária da CIPAT, organizada pela Equipe Verde. O objetivo é arrecadar fundos (doações de alimentos ou R$ 10,00) para uma causa beneficente.

O prêmio é **um dia de lazer no Espaço Camping - Nísia Floresta, para até 16 pessoas**. O sorteio será realizado no dia **16/11/2025**.

Este site funciona como a "vitrine" e o sistema de "checkout" para a reserva dos números da rifa.

## ✨ Funcionalidades

* **Grelha em Tempo Real:** Exibe os 300 números da rifa e seus status (Disponível, Reservado, Vendido) em tempo real.
* **Conexão com Banco de Dados:** Lê os dados diretamente de um banco de dados Supabase.
* **Reserva "Click-to-Reserve":** Ao clicar em um número disponível, o status é alterado para "Reservado" por 10 minutos.
* **Checkout Otimizado (Plano B):**
    1.  O usuário clica no número.
    2.  O site chama um webhook do n8n para reservar o número.
    3.  Um formulário (modal/pop-up) aparece pedindo Nome e WhatsApp.
    4.  O site constrói uma mensagem personalizada e redireciona o usuário para o WhatsApp, para finalizar o pagamento e enviar o comprovante.
* **Limpeza Automática:** Um segundo robô "faxineiro" no n8n limpa automaticamente as reservas que expiraram (após 10 minutos) e não foram pagas.

## 🛠️ Stack de Tecnologias

Este projeto foi construído usando uma arquitetura "serverless" moderna e gratuita:

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla JS)
* **Hospedagem:** GitHub Pages
* **Banco de Dados (Realtime):** [Supabase](https://supabase.com) (Para armazenar e transmitir o status dos 300 números)
* **Backend & Automação:** [n8n.cloud](https://n8n.cloud) (Para os dois workflows de backend)
* **Checkout & Pagamento:** [WhatsApp](https://wa.me/) (Para coleta manual de dados e comprovante de PIX)