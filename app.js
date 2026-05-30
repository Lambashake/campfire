// Connected to your Supabase project: dwvrkxtnrcxeuptdqxia
const SUPABASE_URL = "https://dwvrkxtnrcxeuptdqxia.supabase.co";
const SUPABASE_KEY = "sb_publishable_gSef8xS09Y_UAO7TP70kHQ_dHnWB-j3";

// Standard direct initialization
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
    // Refresh fire health and words every 30 seconds
    setInterval(updateFireState, 30000);
    setInterval(fetchSparks, 30000);
}

// Fetch notes from the last 24 hours to determine fire strength
async function updateFireState() {
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
    try {
        let { data: notes, error } = await supabase
            .from('gratitude_notes')
            .select('word')
            .order('created_at', { ascending: false })
            .limit(40); // Grab a slightly larger pool to account for filtered out old words

        if (error) throw error;

        if (!notes || notes.length === 0) {
            wordsPool = ["warmth and peace", "gathered around the hearth", "quiet reflections"];
        } else {
            // FILTER: Only include entries that contain at least one space (meaning it's a full sentence!)
            wordsPool = notes
                .map(n => n.word)
                .filter(text => text && text.trim().includes(' '));
            
            // Fallback if all database items are old single words
            if (wordsPool.length === 0) {
                wordsPool = ["welcome to the hearth", "the fire is starting fresh"];
            }
        }
        
        sparksContainer.innerHTML = ''; 
        // Display up to 5 full sentences floating simultaneously
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
    
    // Give long sentences a slightly wider movement range so they don't overlap awkwardly
    const startX = Math.floor(Math.random() * 30) + 20; 
    const endX = startX + (Math.floor(Math.random() * 20) - 10); 
    
    spark.style.setProperty('--start-x', `${startX}%`);
    spark.style.setProperty('--end-x', `${endX}%`);
    // Slow down the animation slightly so full sentences are readable as they rise
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

// Modal Toggle Logic
openModalBtn.addEventListener('click', () => {
    noteModal.classList.remove('hidden');
});
closeModalBtn.addEventListener('click', () => noteModal.classList.add('hidden'));

// Submit Note to Database & Unmute Audio
submitNoteBtn.addEventListener('click', async () => {
    const fullText = noteInput.value.trim();
    if (!fullText) return;

    // AUDIO TRIGGER: The browser completely allows audio to start playing here 
    // because clicking "Add to the Fire" is an explicit user gesture.
    fireAudio.play()
        .then(() => console.log("Fire ambient crackle loop started successfully!"))
        .catch(err => console.error("Audio playback stalled:", err));

    try {
        // Save the raw, un-split full sentence directly into BOTH columns
        const { error } = await supabase
            .from('gratitude_notes')
            .insert([{ text: fullText, word: fullText }]);

        if (error) throw error;
    } catch (err) {
        console.error("Could not save note to database: ", err);
    }

    noteInput.value = '';
    noteModal.classList.add('hidden');
    
    fireSprite.className = "fire status-medium";
    createSpark(fullText);
});
