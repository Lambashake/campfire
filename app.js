// Connected to your Supabase project: dwvrkxtnrcxeuptdqxia
const SUPABASE_URL = "https://dwvrkxtnrcxeuptdqxia.supabase.co";
const SUPABASE_KEY = "sb_publishable_gSef8xS09Y_UAO7TP70kHQ_dHnWB-j3";

// Safe global initialization
let supabase;
try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.error("Database connection paused, using local backup simulation mode:", e);
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
const locationInput = document.getElementById('location-input');

let wordsPool = [];

// Boot up layout modules
window.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    updateFireState();
    fetchSparks();
    setInterval(updateFireState, 30000);
    setInterval(fetchSparks, 30000);
}

// Check real-time database state to resize the pixel fire asset
async function updateFireState() {
    if (!supabase) {
        if (fireSprite) fireSprite.className = "fire status-low";
        if (fireStatus) fireStatus.innerText = "Sitting quietly by the baseline embers.";
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
        if (!fireSprite || !fireStatus) return;
        
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
        if (fireSprite) fireSprite.className = "fire status-low";
        if (fireStatus) fireStatus.innerText = "Sitting quietly by the baseline embers.";
    }
}

// Fetch live notes to float out into space as sparks
async function fetchSparks() {
    if (!supabase) {
        wordsPool = ["warmth and peace||Global Hearth", "gathered close around the fire||Everywhere"];
        if (sparksContainer) sparksContainer.innerHTML = ''; 
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
            wordsPool = ["warmth and peace||Hearth", "cozy connection||Everywhere"];
        } else {
            // FILTER: Only display entries that contain multiple words (full sentences)
            wordsPool = notes
                .map(n => n.word)
                .filter(text => text && text.trim().includes(' '));
            
            if (wordsPool.length === 0) {
                wordsPool = ["welcome back to the hearth||World", "the fire is resetting fresh||Space"];
            }
        }
        
        if (sparksContainer) {
            sparksContainer.innerHTML = ''; 
            for (let i = 0; i < Math.min(5, wordsPool.length); i++) {
                createSpark(wordsPool[i]);
            }
        }
    } catch (err) {
        wordsPool = ["warmth and healing||Hearth"];
        if (sparksContainer) sparksContainer.innerHTML = '';
        createSpark(wordsPool[0]);
    }
}

function createSpark(rawText) {
    if (!rawText || !sparksContainer) return;
    
    const parts = rawText.split('||');
    const mainNoteText = parts[0];
    const locationText = parts[1] ? parts[1].trim() : "";

    const spark = document.createElement('div');
    spark.classList.add('spark-word');
    
    const noteSpan = document.createElement('span');
    noteSpan.innerText = mainNoteText;
    spark.appendChild(noteSpan);
    
    if (locationText) {
        const locSpan = document.createElement('span');
        locSpan.classList.add('spark-location');
        locSpan.innerText = `from ${locationText}`;
        spark.appendChild(locSpan);
    }
    
    const startX = Math.floor(Math.random() * 40) + 15; 
    const endX = startX + (Math.floor(Math.random() * 20) - 10); 
    
    spark.style.setProperty('--start-x', `${startX}%`);
    spark.style.setProperty('--end-x', `${endX}%`);
    spark.style.animationDuration = `${11 + Math.random() * 5}s`;

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

// Modal Toggle Mechanics
if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
        if (noteModal) noteModal.classList.remove('hidden');
    });
}
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if (noteModal) noteModal.classList.add('hidden');
    });
}

// Submit Note to Database Stack
if (submitNoteBtn) {
    submitNoteBtn.addEventListener('click', async () => {
        if (!noteInput || !locationInput) return;
        
        const fullText = noteInput.value.trim();
        const locationVal = locationInput.value.trim();
        if (!fullText) return;

        // Sound Engine Activation
        if (fireAudio) {
            fireAudio.play()
                .then(() => console.log("Ambient fireplace audio looping."))
                .catch(err => console.error("Audio system waiting for full gesture initialization:", err));
        }

        const packageToSave = locationVal ? `${fullText}||${locationVal}` : `${fullText}`;

        if (supabase) {
            try {
                const { error } = await supabase
                    .from('gratitude_notes')
                    .insert([{ text: fullText, word: packageToSave }]);
                if (error) throw error;
            } catch (err) {
                console.error("Could not write record to dataset table:", err);
            }
        }

        noteInput.value = '';
        locationInput.value = ''; 
        if (noteModal) noteModal.classList.add('hidden');
        
        if (fireSprite) fireSprite.className = "fire status-medium";
        createSpark(packageToSave);
    });
}
