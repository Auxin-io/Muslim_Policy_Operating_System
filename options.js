const apiKeyEl = document.getElementById('apiKey');
const modelEl = document.getElementById('model');
const notificationsEl = document.getElementById('notificationsEnabled');
const saveMsgEl = document.getElementById('saveMsg');

async function load() {
  const { apiKey_gemini, model_gemini, notificationsEnabled } = await chrome.storage.local.get(['apiKey_gemini', 'model_gemini', 'notificationsEnabled']);
  if (apiKey_gemini) apiKeyEl.value = apiKey_gemini;
  if (model_gemini) modelEl.value = model_gemini;
  notificationsEl.checked = notificationsEnabled !== false;
}

document.getElementById('saveBtn').addEventListener('click', async () => {
  await chrome.storage.local.set({
    apiKey_gemini: apiKeyEl.value.trim(),
    model_gemini: modelEl.value,
    notificationsEnabled: notificationsEl.checked
  });
  saveMsgEl.textContent = 'Saved.';
  setTimeout(() => { saveMsgEl.textContent = ''; }, 2000);
});

load();
