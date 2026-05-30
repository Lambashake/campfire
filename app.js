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
const locationInput = document.getElementById('location-input'); // Location tracker input

let wordsPool = [];

window.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    updateFireState();
    fetchSparks();
    setInterval(updateFireState, 30000);
    setInterval(fetchSparks, 30000);
}

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

async function fetchSparks() {
    if (!supabase) {
        wordsPool = ["warmth and peace||Hearth", "gathered together||Global Space"];
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
        
        sparksContainer.innerHTML = ''; 
        for (let i = 0; i < Math.min(5, wordsPool.length); i++) {
            createSpark(wordsPool[i]);
        }
    } catch (err) {
        wordsPool = ["warmth and healing||Hearth"];
        sparksContainer.innerHTML = '';
        createSpark(wordsPool[0]);
    }
}

function createSpark(rawText) {
    if (!rawText) return;
    
    // Parse the sentence and location values using the split marker
    const parts = rawText.split('||');
    const mainNoteText = parts[0];
    const locationText = parts[1] ? parts[1].trim() : "";

    const spark = document.createElement('div');
    spark.classList.add('spark-word');
    
    // Create the primary note text node inside the spark element
    const noteSpan = document.createElement('span');
    noteSpan.innerText = mainNoteText;
    spark.appendChild(noteSpan);
    
    // If a location exists, build a smaller stylized label underneath it
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
    spark.style.animationDuration = `${10 + Math.random() * 6}s`;

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

// Modal Display Logic
openModalBtn.addEventListener('click', () => {
    noteModal.classList.remove('hidden');
});
closeModalBtn.addEventListener('click', () => {
    noteModal.classList.add('hidden');
});

// Submit Note & Optional Location data combo
submitNoteBtn.addEventListener('click', async () => {
    const fullText = noteInput.value.trim();
    const locationVal = locationInput.value.trim();
    if (!fullText) return;

    // Trigger crackle audio loop upon active input submission
    if (fireAudio) {
        fireAudio.play()
            .then(() => console.log("Fire ambient loop active."))
            .catch(err => console.error("Audio engine delayed:", err));
    }

    // Stitch text and location together into a single column storage format
    const packageToSave = locationVal ? `${fullText}||${locationVal}` : `${fullText}`;

    if (supabase) {
        try {
            const { error } = await supabase
                .from('gratitude_notes')
                .insert([{ text: fullText, word: packageToSave }]);
            if (error) throw error;
        } catch (err) {
            console.error("Could not save note data:", err);
        }
    }

    noteInput.value = '';
    locationInput.value = ''; // Reset input box fields cleanly
    noteModal.classList.add('hidden');
    
    fireSprite.className = "fire status-medium";
    createSpark(packageToSave);
});
