// ---------- Constants and elements ----------
const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.querySelector("#load-btn");
const statusEl = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

let notes = [];

// ---------- Status message ----------
function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type ? "status-" + type : "";
}

// ---------- One reusable request function ----------
async function request(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error("Request failed with status " + response.status);
  }

  const data = await response.json();
  return { status: response.status, data: data };
}

// ---------- Build one note (textContent only) ----------
function createNoteItem(note) {
  const li = document.createElement("li");
  li.classList.add("note");

  const title = document.createElement("h3");
  title.textContent = note.title;

  const body = document.createElement("p");
  body.textContent = note.body;

  li.append(title, body);
  return li;
}

// ---------- Draw the list (with an empty state) ----------
function render() {
  notesList.textContent = "";

  if (notes.length === 0) {
    const empty = document.createElement("li");
    empty.classList.add("empty-message");
    empty.textContent = 'No notes to show. Click "Load notes" to fetch some.';
    notesList.appendChild(empty);
    return;
  }

  for (const note of notes) {
    notesList.appendChild(createNoteItem(note));
  }
}

// ---------- GET: load 10 notes ----------
async function loadNotes() {
  loadBtn.disabled = true;
  setStatus("Loading notes...", "loading");

  try {
    const result = await request(API_URL + "?_limit=10");
    notes = result.data;
    render();

    if (notes.length === 0) {
      setStatus("The server has no notes yet.", "success");
    } else {
      setStatus(`Loaded ${notes.length} notes from the server.`, "success");
    }
  } catch (error) {
    setStatus("Could not load notes. Please try again.", "error");
    console.error(error);
  } finally {
    loadBtn.disabled = false;
  }
}

// ---------- Events ----------
loadBtn.addEventListener("click", loadNotes);

render();