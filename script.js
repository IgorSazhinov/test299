// ======================== ЛОГИКА ЧАТ-БОТА ========================
// Состояния:
// 'AWAIT_QUESTION' -> ожидаем первый вопрос
// 'AWAIT_CONFIRMATION' -> бот спросил "правильно я понял что вы спрашиваете?" ждём да/нет

let currentState = 'AWAIT_QUESTION';
let lastUserQuestion = '';
let pendingUserYes = null; // храним "да" пользователя для отложенного показа
let count = 0;

// DOM элементы
const messagesContainer = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendBtn');

// Вспомогательная функция: добавить сообщение в чат
function addMessage(sender, text, isDelayed = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'bot' ? 'bot-message' : 'user-message'}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    
    const timeSpan = document.createElement('div');
    timeSpan.className = 'message-time';
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
    timeSpan.textContent = timeStr;
    
    messageDiv.appendChild(bubble);
    messageDiv.appendChild(timeSpan);
    
    if (isDelayed) {
        // Добавляем с небольшой задержкой, но без индикатора печати
        setTimeout(() => {
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 300);
    } else {
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    return messageDiv;
}

// функция имитации паузы перед ответом бота
async function botReplyWithDelay(responseText, delayMs = 500) {
    // Показываем индикатор "печатает..."
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    const typingBubble = document.createElement('div');
    typingBubble.className = 'typing-indicator';
    typingBubble.innerHTML = '<span></span><span></span><span></span>';
    typingDiv.appendChild(typingBubble);
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    // Удаляем индикатор печати
    typingDiv.remove();
    
    // Добавляем реальный ответ бота
    addMessage('bot', responseText);
}

// Инициализация / приветствие при загрузке
async function initializeBot() {
    await botReplyWithDelay("🌼 я Аська-бот. отвечу на любой вопрос. Напиши его", 400);
    currentState = 'AWAIT_QUESTION';
    lastUserQuestion = '';
    pendingUserYes = null;
}

// Главная логика обработки сообщений пользователя
async function processUserInput(userText) {

    const trimmed = userText.trim();
    if (trimmed === "") {
        addMessage('bot', 'Пожалуйста, напишите сообщение или вопрос 🙂');
        return;
    }
    
    // ---- МАШИНА СОСТОЯНИЙ ----
    if (currentState === 'AWAIT_QUESTION') {
        // Пользователь задаёт свой первый вопрос
        lastUserQuestion = trimmed;
        const confirmationMessage = `правильно я понял что вы спрашиваете: «${lastUserQuestion}»?`;
        await botReplyWithDelay(confirmationMessage, 500);
        currentState = 'AWAIT_CONFIRMATION';
        return;
    }
    
    if (currentState === 'AWAIT_CONFIRMATION') {
        const lowerAnswer = trimmed.toLowerCase();
        if (lowerAnswer === '300') {
            pendingUserYes = trimmed
            // addMessage('user', pendingUserYes, true);
            await botReplyWithDelay('Отсоси у программиста!)))', 400);
            return
        }
        if (lowerAnswer === 'да' || lowerAnswer === 'верно') {
            count = 0;
            // Сохраняем "да" для отложенного показа
            pendingUserYes = trimmed;
            
            // Бот пишет "Правда?"
            await botReplyWithDelay('Сосешь?', 400);
            
            // После "Правда?" показываем "да" пользователя (которое он написал ранее)
            addMessage('user', pendingUserYes, true);
            
            // Спрашиваем, есть ли ещё вопросы
            setTimeout(async () => {
                await botReplyWithDelay('Есть ли ещё вопросы?', 500);
                currentState = 'AWAIT_QUESTION';
                lastUserQuestion = '';
                pendingUserYes = null;
            }, 400);
            
            return;
        } else {
            if (count >= 2) {

                botReplyWithDelay('Проверка капчи. Напиши "300"')
                count = 0;
                return
            }
            // Любой другой ответ - повторяем вопрос
            const retryMessage = `Я не получил подтверждение. Повторюсь: правильно я понял, что вы спрашиваете: «${lastUserQuestion}»? (Ответьте "да" или что-то другое, если нет)`;
            await botReplyWithDelay(retryMessage, 450);
            count = count + 1
            return;
        }
    }
}

// Отправка сообщения
async function handleSendMessage() {
    const rawText = messageInput.value;
    if (!rawText.trim()) return;
    
    const userMsg = rawText.trim();
    messageInput.value = '';
    
    // Если это подтверждение "да" и мы в состоянии ожидания, не показываем сразу
    if (currentState === 'AWAIT_CONFIRMATION' && userMsg.toLowerCase() === 'да') {
        await processUserInput(userMsg);
    } else {
        // Для всех остальных сообщений показываем сразу
        addMessage('user', userMsg);
        await processUserInput(userMsg);
    }
}

// Обработка Enter
function onEnterPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
}

// Сброс чата при загрузке
function resetChatUI() {
    messagesContainer.innerHTML = '';
    initializeBot();
}

// Привязка событий
sendButton.addEventListener('click', handleSendMessage);
messageInput.addEventListener('keypress', onEnterPress);

// Запуск
resetChatUI();
messageInput.focus();