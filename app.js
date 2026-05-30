// Import Supabase directly as a module to guarantee it initializes perfectly
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = "https://dwvrkxtnrcxeuptdqxia.supabase.co";
const SUPABASE_KEY = "sb_publishable_gSef8xS09Y_UAO7TP70kHQ_dHnWB-j3";

// Clear, direct initialization
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

// Fetch random words from recent entries to turn into floating sparks
async function fetchSparks() {
    try {
        let { data: notes, error } = await supabase
            .from('gratitude_notes')
            .select('word')
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) throw error;

        if (!notes || notes.length === 0) {
            wordsPool = ["warmth and peace", "hearth and quiet"];
        } else {
            wordsPool = notes.map(n => n.word);
        }
        
        sparksContainer.innerHTML = ''; 
        for (let i = 0; i < Math.min(5, wordsPool.length); i++) {
            createSpark(wordsPool[Math.floor(Math.random() * wordsPool.length)]);
        }
    } catch (err) {
        wordsPool = ["warmth", "peace", "hearth", "connection"];
        sparksContainer.innerHTML = '';
        createSpark("welcome");
    }
}

function createSpark(text) {
    if (!text) return;
    const spark = document.createElement('div');
    spark.classList.add('spark-word');
    spark.innerText = text;
    
    const startX = Math.floor(Math.random() * 40) + 30; 
    const endX = startX + (Math.floor(Math.random() * 40) - 20); 
    
    spark.style.setProperty('--start-x', `${startX}%`);
    spark.style.setProperty('--end-x', `${endX}%`);
    spark.style.animationDuration = `${6 + Math.random() * 6}s`;

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
if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
        if (noteModal) noteModal.classList.remove('hidden');
        if (fireAudio) {
            fireAudio.muted = false;
            fireAudio.play().catch(err => console.log("Audio waiting for interaction:", err));
        }
    });
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if (noteModal) noteModal.classList.add('hidden');
    });
}

// Submit Note to Database
submitNoteBtn.addEventListener('click', async () => {
    const fullText = noteInput.value.trim();
    if (!fullText) return;

    try {
        // We now send the complete fullText sentence to BOTH columns
        const { error } = await supabase
            .from('gratitude_notes')
            .insert([{ text: fullText, word: fullText }]);

        if (error) throw error;
    } catch (err) {
        console.error("Could not save note to database: ", err);
    }

    noteInput.value = '';
    noteModal.classList.add('hidden');
    
    // Instantly show the full sentence floating up locally
    fireSprite.className = "fire status-medium";
    createSpark(fullText);
});
