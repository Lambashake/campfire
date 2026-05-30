// Replace these with your actual Supabase credentials
const SUPABASE_URL = "https://dwvrkxtnrcxeuptdqxia.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_gSef8xS09Y_UAO7TP70kHQ_dHnWB-j3";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const fireAudio = document.getElementById('fire-audio');
const fireSprite = document.getElementById('fire-sprite');
const fireStatus = document.getElementById('fire-status');
const sparksContainer = document.getElementById('sparks-container');
const openModalBtn = document.getElementById('open-modal-btn');
const noteModal = document.getElementById('note-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const submitNoteBtn = document.getElementById('submit-note-btn');
const noteInput = document.getElementById('note-input');

let wordsPool = [];

// Audio & Entry interaction
startBtn.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 1000);
    fireAudio.play().catch(err => console.log("Audio autoplay blocked: ", err));
    init();
});

function init() {
    updateFireState();
    fetchSparks();
    // Refresh fire health and words every 30 seconds
    setInterval(updateFireState, 30000);
    setInterval(fetchSparks, 30000);
}

// Fetch notes from the last 24 hours to determine fire strength
async function updateFireState() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    let { data: recentNotes, error } = await supabase
        .from('gratitude_notes')
        .select('id')
        .gte('created_at', oneDayAgo);

    if (error) return console.error(error);

    const count = recentNotes ? recentNotes.length : 0;
    
    // Reset fire classes
    fireSprite.className = "fire";
    
    if (count === 0) {
        fireSprite.classList.add('status-dead');
        fireStatus.innerText = "The fire has gone out. Add a note to spark it back to life.";
    } else if (count <= 3) {
        fireSprite.classList.add('status-low');
        fireStatus.innerText = "The fire is flickering low. It needs tending.";
    } else if (count <= 10) {
        fireSprite.classList.add('status-medium');
        fireStatus.innerText = "The fire burns steadily, sustained by shared gratitude.";
    } else {
        fireSprite.classList.add('status-high');
        fireStatus.innerText = "The community fire is roaring beautifully today!";
    }
}

// Fetch random words from recent entries to turn into floating sparks
async function fetchSparks() {
    let { data: notes, error } = await supabase
        .from('gratitude_notes')
        .select('word')
        .order('created_at', { ascending: false })
        .limit(30);

    if (error || !notes || notes.length === 0) return;

    wordsPool = notes.map(n => n.word);
    sparksContainer.innerHTML = ''; // clear old sparks
    
    // Create 5 random floating sparks initially
    for (let i = 0; i < Math.min(5, wordsPool.length); i++) {
        createSpark(wordsPool[Math.floor(Math.random() * wordsPool.length)]);
    }
}

function createSpark(text) {
    if (!text) return;
    const spark = document.createElement('div');
    spark.classList.add('spark-word');
    spark.innerText = text;
    
    // Randomize initial paths
    const startX = Math.floor(Math.random() * 40) + 30; // center-ish 30% to 70%
    const endX = startX + (Math.floor(Math.random() * 40) - 20); // drift left/right
    
    spark.style.setProperty('--start-x', `${startX}%`);
    spark.style.setProperty('--end-x', `${endX}%`);
    // Randomize speeds to stagger them
    spark.style.animationDuration = `${6 + Math.random() * 6}s`;

    // Clicking a word swaps it with a new one from the pool
    spark.addEventListener('click', () => {
        spark.style.opacity = '0';
        setTimeout(() => {
            spark.remove();
            if (wordsPool.length > 0) {
                createSpark(wordsPool[Math.floor(Math.random() * wordsPool.length)]);
            }
        }, 300);
    });

    sparksContainer.appendChild(spark);
}

// Modal Toggle Logic
openModalBtn.addEventListener('click', () => noteModal.classList.remove('hidden'));
closeModalBtn.addEventListener('click', () => noteModal.classList.add('hidden'));

// Submit Note to Database
submitNoteBtn.addEventListener('click', async () => {
    const fullText = noteInput.value.trim();
    if (!fullText) return;

    // Helper to pick a meaningful keyword to act as a spark
    const words = fullText.split(' ').filter(w => w.length > 3);
    const fallbackWord = fullText.split(' ')[0] || "joy";
    const keyWord = words.length > 0 ? words[Math.floor(Math.random() * words.length)] : fallbackWord;

    const { error } = await supabase
        .from('gratitude_notes')
        .insert([{ text: fullText, word: keyWord.toLowerCase() }]);

    if (error) {
        alert("Could not add to the hearth right now.");
        console.error(error);
    } else {
        noteInput.value = '';
        noteModal.classList.add('hidden');
        // Instantly refresh UI
        updateFireState();
        createSpark(keyWord.toLowerCase());
    }
});
