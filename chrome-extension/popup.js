// מאזין ללחיצה על כפתור "התחלת מעקב"
document.getElementById('startTracking').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: autoSaveChatMessages
  });
});

// מאזין ללחיצה על כפתור "עצירת מעקב"
document.getElementById('stopTracking').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: stopChatTracking
  });
});

function autoSaveChatMessages() {
  console.log("התחלת מעקב אחר הודעות הצ'אט...");

  const messageSelectors = [
    'div.min-h-8.text-message.flex.w-full.flex-col.items-end.gap-2.whitespace-normal.break-words.text-start'
    // 'div.relative.max-w-\\[var\\(--user-chat-width\\,70\\%\\)\\].rounded-3xl.bg-token-message-surface.px-5.py-2\\.5'
  ];
  const serverUrl = 'http://127.0.0.1:5000/save';
  let allMessages = ''; // משתנה לאחסון כל ההודעות (היסטוריות + חדשות)
  let allMessagesArray = []
  let currNumOfMessages = 0
  // יצירת האובזרבר למעקב אחרי שינויים
  if (!window.observer) {
    window.observer = new MutationObserver(saveMessagesNew);
    window.observer.observe(document.body, { childList: true, subtree: true });
    console.log("המעקב אחר הודעות הצ'אט הופעל בהצלחה.");
  }

  function saveMessagesNew() {
    let currentMessageIndex = 0
    messageSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach((message) => {
        const authorRole = message.getAttribute('data-message-author-role');
        let text = ''
        if (authorRole == 'user')
           text = message.querySelector('.whitespace-pre-wrap').textContent.trim();
        else 
           text = message.querySelector('p').textContent.trim();
        
        console.log("the message inner text is: ")
        console.log(message.innerText)
        text = message.innerText
        console.log("the text we got from the query selector is: ", text)
        // const text = message.innerText.trim(); // טקסט ההודעה
        let role = authorRole == 'user' ? "User" : "ChatGPT"; // זיהוי התפקיד
        if (authorRole == 'user'){
          role = 'User'
        }
        else if (authorRole == 'assistant'){
          role = 'ChatGPT'
        }
        // if (text && !allMessages.includes(text)) {
        //   chatContent += `${role}: ${text}\n\n`; // הוספת הטקסט לצ'אט
        //   allMessages += `${role}: ${text}\n\n`; // שמירה של ההודעה בהיסטוריה
        // }
        if (text){
          if (currentMessageIndex < allMessagesArray.length) {
            allMessagesArray[currentMessageIndex] =  `${role}: ${text}\n\n`
          }
          else{
            allMessagesArray.push(`${role}: ${text}\n\n`)
          }
        }
        currentMessageIndex++
      });
    });

    // שליחה לשרת של כל הצ'אט הקיים
    console.log("entered saveAllChat and the all messages are: ")
    // console.log(allMessages)
    let allMessagesString = allMessagesArray.join("")
    console.log(allMessagesString)
    sendToServerNew(allMessagesString, allMessagesArray);
  }

  // פונקציה לאיסוף כל הצ'אט ושמירה
  function saveAllChat() {
    let chatContent = '';
    messageSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach((message) => {
        currNumOfMessages++
        const authorRole = message.getAttribute('data-message-author-role');
        let text = ''
        if (authorRole == 'user')
           text = message.querySelector('.whitespace-pre-wrap').textContent.trim();
        else 
           text = message.querySelector('p').textContent.trim();
        
        console.log("the text we got from the query selector is: ", text)
        // const text = message.innerText.trim(); // טקסט ההודעה
        let role = authorRole == 'user' ? "User" : "ChatGPT"; // זיהוי התפקיד
        if (authorRole == 'user'){
          role = 'User'
        }
        else if (authorRole == 'assistant'){
          role = 'ChatGPT'
        }
        if (text && !allMessages.includes(text)) {
          chatContent += `${role}: ${text}\n\n`; // הוספת הטקסט לצ'אט
          allMessages += `${role}: ${text}\n\n`; // שמירה של ההודעה בהיסטוריה
        }
      });
    });

    // שליחה לשרת של כל הצ'אט הקיים
    console.log("entered saveAllChat and the all messages are: ")
    console.log(allMessages)
    sendToServer(allMessages);
  }

  // שמירת הודעות חדשות
  function saveMessages() {
    let chatContent = '';
    let numOfMessages = 0
    // let messageSelectorMap = document.querySelectorAll(messageSelectors[0]).map((message) => message.innerText.trim())
    // console.log("the list of messages in the selector map are: ")
    // console.log(messageSelectorMap)
    messageSelectors.forEach(selector => {
      let arrayElements = document.querySelectorAll(selector)
      console.log("the length of the arrayElements is: ", arrayElements.length)
      console.log("the num of messages inside save messages are: ", numOfMessages)
      console.log("the current num of messages inside save messages are: ", currNumOfMessages)
      document.querySelectorAll(selector).forEach((message) => {
        const authorRole = message.getAttribute('data-message-author-role');
        console.log("the authorRole in save messages is: ", authorRole)
        const text = message.innerText.trim();
        if (text && !allMessages.includes(text)) { // אם ההודעה לא קיימת בהיסטוריה
          // const role = message.classList.contains('items-end') ? "User" : "ChatGPT";
          let role = authorRole == 'user' ? "User" : "ChatGPT";
          if (authorRole == 'user'){
            role = 'User'
          }
          else if (authorRole == 'assistant'){
            role = 'ChatGPT'
          }

          chatContent += `${role}: ${text}\n\n`;
          allMessages += `${role}: ${text}\n\n`; // הוספת ההודעה להיסטוריה
          console.log(`הודעה חדשה נשמרה: ${role}: ${text}`);
        }
      });
    });
    console.log("number of messages are: " + numOfMessages)
    if (chatContent) sendToServer(allMessages); // שולחים את כל הצ'אט עדכני לשרת
  }
  function getChatIdFromTitle() {
    const chatTitle = document.title.trim(); // קריאת הכותרת של הדף
    return chatTitle ? chatTitle : "Unknown_Chat"; // ערך ברירת מחדל אם הכותרת ריקה
  }
  // שליחת כל הצ'אט לשרת
  let previousContent = "";

  function sendToServerNew(chatContent, messagesArray) {
    const chatId = getChatIdFromTitle();

    if (chatContent !== previousContent) {
        previousContent = chatContent;
        fetch('http://127.0.0.1:5000/saveArray', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: messagesArray, chatId })
        }).then(response => {
            if (response.ok) console.log("הודעות נשמרו בהצלחה לשרת:", chatContent);
            else console.error("שגיאה בשמירת ההודעות:", response.statusText);
        }).catch(error => console.error("שגיאה בשליחת הבקשה:", error));
    }
}

  function sendToServer(chatContent) {
      const chatId = getChatIdFromTitle();

      if (chatContent !== previousContent) {
          previousContent = chatContent;
          fetch('http://127.0.0.1:5000/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ body: chatContent, chatId })
          }).then(response => {
              if (response.ok) console.log("הודעות נשמרו בהצלחה לשרת:", chatContent);
              else console.error("שגיאה בשמירת ההודעות:", response.statusText);
          }).catch(error => console.error("שגיאה בשליחת הבקשה:", error));
      }
  }
  

  // שמירה ראשונית של כל הצ'אט הקיים
  // saveAllChat();
}
/////////////////////////////////////////////////////////////////////////////
// עצירת המעקב
function stopChatTracking() {
  if (window.observer) {
    window.observer.disconnect(); // עצירת האובזרבר
    window.observer = null; // איפוס המשתנה
    console.log("המעקב אחר הודעות הצ'אט הופסק בהצלחה.");
  } else {
    console.log("לא נמצא מעקב פעיל להפסקה.");
  }
}
