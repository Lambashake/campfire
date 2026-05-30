// Connected to your Supabase project: dwvrkxtnrcxeuptdqxia
const SUPABASE_URL = "https://dwvrkxtnrcxeuptdqxia.supabase.co";
const SUPABASE_KEY = "sb_publishable_gSef8xS09Y_UAO7TP70kHQ_dHnWB-j3";

// Safe global initialization
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
    console.error("Supabase library initialization paused, using fallback mode:", e);
}

// DOM Elements
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

// Start the program instantly when the window finishes loading
window.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    updateFireState();
    fetchSparks();
    setInterval(updateFireState, 30000);
    setInterval(fetchSparks, 30000);
}

// Fetch notes from the last 24 hours to determine fire strength
async function updateFireState() {
    if (!supabase) {
        fireSprite.className = "fire status-low";
        fireStatus.innerText = "Sitting quietly by the baseline embers.";
        return;
    }
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        let { data: recentNotes, error } = await supabase
            .from('gratitude_notes')
            .select('id')
            .gte('created_at', oneDayAgo);

        if (error) throw error;

        const count = recentNotes ? recentNotes.length : 0;
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
    } catch (err) {
        console.error("Database connection issue: ", err);
        fireSprite.className = "fire status-low";
        fireStatus.innerText = "Sitting quietly by the baseline embers.";
    }
}

// Fetch recent entries to turn into floating sparks
async function fetchSparks() {
    if (!supabase) {
        wordsPool = ["warmth and peace", "gathered around the hearth", "quiet reflections"];
        sparksContainer.innerHTML = ''; 
        createSpark(wordsPool[0]);
        return;
    }
    try {
        let { data: notes, error } = await supabase
            .from('gratitude_notes')
            .select('word')
            .order('created_at', { ascending: false })
            .limit(40);

        if (error) throw error;

        if (!notes || notes.length === 0) {
            wordsPool = ["warmth and peace", "gathered around the hearth", "quiet reflections"];
        } else {
            // FILTER: Only include entries that contain at least one space (full sentences)
            wordsPool = notes
                .map(n => n.word)
                .filter(text => text && text.trim().includes(' '));
            
            if (wordsPool.length === 0) {
                wordsPool = ["welcome to the hearth", "the fire is starting fresh"];
            }
        }
        
        sparksContainer.innerHTML = ''; 
        for (let i = 0; i < Math.min(5, wordsPool.length); i++) {
            createSpark(wordsPool[i]);
        }
    } catch (err) {
        wordsPool = ["warmth and peace", "cozy connections"];
        sparksContainer.innerHTML = '';
        createSpark("welcome back by the fire");
    }
}

function createSpark(text) {
    if (!text) return;
    const spark = document.createElement('div');
    spark.classList.add('spark-word');
    spark.innerText = text;
    
    const startX = Math.floor(Math.random() * 30) + 20; 
    const endX = startX + (Math.floor(Math.random() * 20) - 10); 
    
    spark.style.setProperty('--start-x', `${startX}%`);
    spark.style.setProperty('--end-x', `${endX}%`);
    spark.style.animationDuration = `${9 + Math.random() * 5}s`;

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

// Modal Toggle Logic - Guaranteed to run safely
openModalBtn.addEventListener('click', () => {
    noteModal.classList.remove('hidden');
});
closeModalBtn.addEventListener('click', () => noteModal.classList.add('hidden'));

// Submit Note to Database & Unmute Audio
submitNoteBtn.addEventListener('click', async () => {
    const fullText = noteInput.value.trim();
    if (!fullText) return;

    // Direct Audio play trigger
    if (fireAudio) {
        fireAudio.play()
            .then(() => console.log("Fire ambient crackle loop started!"))
            .catch(err => console.error("Audio waiting on interaction:", err));
    }

    if (supabase) {
        try {
            const { error } = await supabase
                .from('gratitude_notes')
                .insert([{ text: fullText, word: fullText }]);
            if (error) throw error;
        } catch (err) {
            console.error("Could not save note to database: ", err);
        }
    }

    noteInput.value = '';
    noteModal.classList.add('hidden');
    
    fireSprite.className = "fire status-medium";
    createSpark(fullText);
});
