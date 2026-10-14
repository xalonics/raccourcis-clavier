const shortcuts = [
    {
        key: "c",
        name: "Copier",
        question: "Tu veux copier le texte sélectionné.",
        explanation: "Ctrl+C copie l’élément sélectionné sans le supprimer."
    },
    {
        key: "v",
        name: "Coller",
        question: "Tu veux coller ce que tu as copié.",
        explanation: "Ctrl+V colle le contenu copié ou coupé."
    },
    {
        key: "x",
        name: "Couper",
        question: "Tu veux déplacer un texte en le coupant.",
        explanation: "Ctrl+X coupe la sélection pour pouvoir la coller ailleurs."
    },
    {
        key: "z",
        name: "Annuler",
        question: "Tu veux annuler ta dernière action.",
        explanation: "Ctrl+Z annule généralement la dernière action."
    },
    {
        key: "y",
        name: "Rétablir",
        question: "Tu as annulé une action et tu veux la rétablir.",
        explanation: "Ctrl+Y rétablit généralement l’action qui vient d’être annulée."
    },
    {
        key: "a",
        name: "Tout sélectionner",
        question: "Tu veux sélectionner tout le contenu de la zone.",
        explanation: "Ctrl+A sélectionne tout le contenu de la page ou de la zone active."
    },
    {
        key: "s",
        name: "Enregistrer",
        question: "Tu veux enregistrer ton document.",
        explanation: "Ctrl+S ouvre la commande d’enregistrement du document."
    },
    {
        key: "f",
        name: "Rechercher",
        question: "Tu veux rechercher un mot dans le document ou la page.",
        explanation: "Ctrl+F ouvre la recherche dans le document ou la page."
    }
];

const practiceExercises = [
    {
        kind: "exercise",
        question: "Mets tout le texte de gauche à droite.",
        instruction: "Recopie tout le texte de la zone de gauche dans la zone de droite.",
        source: "La lecture ouvre des portes.\nChaque jour apporte une idée nouvelle.\nLa curiosité aide à apprendre.\nOn progresse en faisant des erreurs.",
        destination: "",
        requiredShortcuts: ["a", "c", "v"]
    },
    {
        kind: "exercise",
        question: "Remets le texte de droite dans le même ordre que celui de gauche.",
        instruction: "Réorganise les phrases de droite pour retrouver le même ordre que dans le texte de gauche.",
        source: "Le jardin se réveille au printemps.\nLes premières fleurs colorent les allées.\nLes abeilles viennent chercher du pollen.\nLe soir, le jardin retrouve son calme.",
        destination: "Les abeilles viennent chercher du pollen.\nLe soir, le jardin retrouve son calme.\nLe jardin se réveille au printemps.\nLes premières fleurs colorent les allées.",
        requiredShortcuts: ["x", "v"]
    }
];

const questionElement = document.querySelector("#question");
const descriptionElement = document.querySelector("#description");
const gameQuestionHeading = document.querySelector("#game-question-heading");
const challengeIcon = document.querySelector("#challenge-icon");
const challengeElement = document.querySelector("#challenge");
const scoreElement = document.querySelector("#score");
const scorePlural = document.querySelector("#score-plural");
const roundElement = document.querySelector("#round-number");
const feedbackElement = document.querySelector("#feedback");
const answerForm = document.querySelector("#answer-form");
const answerInput = document.querySelector("#answer-command");
const submitButton = document.querySelector("#submit-answer");
const promptElement = document.querySelector("#keyboard-prompt");
const nextButton = document.querySelector("#next-button");
const startButton = document.querySelector("#start-button");
const resetButton = document.querySelector("#reset-button");
const progressBar = document.querySelector("#progress-bar");
const progressTrack = document.querySelector(".progress-track");
const exerciseBoard = document.querySelector("#exercise-board");
const exerciseInstruction = document.querySelector("#exercise-instruction");
const sourceText = document.querySelector("#source-text");
const destinationText = document.querySelector("#destination-text");
const sourceLineNumbers = document.querySelector("#source-line-numbers");
const destinationLineNumbers = document.querySelector("#destination-line-numbers");
const missionTimer = document.querySelector("#mission-timer");
const iterationList = document.querySelector("#iteration-list");

const missionCount = shortcuts.length + practiceExercises.length;
let currentMission;
let score = 0;
let round = 0;
let answered = false;
let questionPool = [];
let nextQuestionTimeout;
let usedShortcuts = new Set();
let missionStartedAt = 0;
let timerInterval;

function shuffle(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
}

function nextQuestion() {
    window.clearTimeout(nextQuestionTimeout);
    window.clearInterval(timerInterval);
    if (questionPool.length === 0) questionPool = shuffle([...shortcuts, ...practiceExercises]);
    currentMission = questionPool.pop();
    round += 1;
    answered = false;
    usedShortcuts = new Set();

    roundElement.textContent = String(round).padStart(2, "0");
    questionElement.textContent = currentMission.question;
    const isExercise = currentMission.kind === "exercise";
    startButton.hidden = true;
    challengeElement.hidden = false;
    feedbackElement.hidden = true;
    gameQuestionHeading.textContent = isExercise
        ? "Manipule le texte avec les raccourcis."
        : "Quelle est la bonne combinaison ?";
    challengeIcon.textContent = isExercise ? "▤" : "✂";
    descriptionElement.textContent = isExercise
        ? "Utilise les raccourcis clavier pour manipuler le texte."
        : "Quel raccourci clavier permet de réaliser cette action ?";
    feedbackElement.textContent = "";
    feedbackElement.className = "feedback";
    answerInput.value = "";
    answerInput.disabled = false;
    submitButton.disabled = false;
    promptElement.classList.remove("is-hidden");
    promptElement.hidden = isExercise;
    answerForm.hidden = isExercise;
    exerciseBoard.hidden = !isExercise;
    sourceText.disabled = !isExercise;
    destinationText.disabled = !isExercise;
    if (isExercise) {
        exerciseInstruction.textContent = currentMission.instruction;
        sourceText.value = currentMission.source;
        destinationText.value = currentMission.destination;
        updateLineNumbers(sourceText, sourceLineNumbers);
        updateLineNumbers(destinationText, destinationLineNumbers);
    }
    nextButton.hidden = true;
    progressTrack.setAttribute("aria-valuenow", String((round - 1) % missionCount));
    progressBar.style.width = `${((round - 1) % missionCount) / missionCount * 100}%`;
    missionStartedAt = Date.now();
    updateMissionTimer();
    timerInterval = window.setInterval(updateMissionTimer, 1000);
    if (isExercise) sourceText.focus();
    else answerInput.focus();
}

function formatDuration(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

function updateMissionTimer() {
    missionTimer.textContent = formatDuration(Date.now() - missionStartedAt);
}

function recordMissionTime(result) {
    window.clearInterval(timerInterval);
    updateMissionTimer();
    if (iterationList.querySelector(".iteration-empty")) iterationList.replaceChildren();

    const item = document.createElement("li");
    item.className = "iteration-item";
    const missionName = document.createElement("span");
    missionName.textContent = `Mission ${String(round).padStart(2, "0")} · ${result}`;
    const duration = document.createElement("time");
    duration.textContent = missionTimer.textContent;
    duration.dateTime = `PT${Math.floor((Date.now() - missionStartedAt) / 1000)}S`;
    item.append(missionName, duration);
    iterationList.prepend(item);
}

function updateLineNumbers(textarea, gutter) {
    const lineCount = textarea.value.split("\n").length;
    gutter.replaceChildren(...Array.from({ length: lineCount }, (_, index) => {
        const lineNumber = document.createElement("span");
        lineNumber.textContent = String(index + 1);
        return lineNumber;
    }));
    gutter.scrollTop = textarea.scrollTop;
}

function completeMission(message) {
    if (answered) return;
    answered = true;
    recordMissionTime("réussie");
    score += 1;
    updateScore();
    answerInput.disabled = true;
    submitButton.disabled = true;
    feedbackElement.textContent = message;
    feedbackElement.className = "feedback is-correct";
    feedbackElement.hidden = false;
    promptElement.classList.add("is-hidden");
    sourceText.disabled = true;
    destinationText.disabled = true;
    progressTrack.setAttribute("aria-valuenow", String(Math.min(round, missionCount)));
    progressBar.style.width = `${Math.min(round, missionCount) / missionCount * 100}%`;
    nextQuestionTimeout = window.setTimeout(nextQuestion, 2200);
}

function checkExercise() {
    if (answered || currentMission?.kind !== "exercise") return;
    const normalizeText = (text) => text.replace(/^\n+|\n+$/g, "");
    const isComplete = normalizeText(destinationText.value) === normalizeText(currentMission.source);
    if (!isComplete) return;

    const missingShortcuts = currentMission.requiredShortcuts.filter((key) => !usedShortcuts.has(key));
    if (missingShortcuts.length > 0) {
        feedbackElement.textContent = "Le texte est bon ! Continue à utiliser les raccourcis clavier pour valider.";
        feedbackElement.className = "feedback is-neutral";
        return;
    }

    completeMission("Bravo ! Le texte est correct et tu as utilisé les bons raccourcis.");
}

function updateScore() {
    scoreElement.textContent = String(score);
    scorePlural.textContent = score === 1 ? "" : "s";
}

function answerQuestion(key) {
    if (answered || !currentMission || currentMission.kind === "exercise") return;

    if (key === currentMission.key) {
        completeMission(`Bravo ! Ctrl+${key.toUpperCase()} signifie « ${currentMission.name} ». ${currentMission.explanation}`);
    } else {
        answered = true;
        recordMissionTime("à revoir");
        answerInput.disabled = true;
        submitButton.disabled = true;
        feedbackElement.textContent = `Ce n’est pas le bon raccourci. La réponse est Ctrl+${currentMission.key.toUpperCase()} : ${currentMission.name}. ${currentMission.explanation}`;
        feedbackElement.className = "feedback is-incorrect";
        feedbackElement.hidden = false;
        promptElement.classList.add("is-hidden");
        answerInput.value = "";
        nextButton.hidden = false;
        nextButton.focus();
    }
}

function normalizeCommand(command) {
    return command.trim().toLowerCase()
        .replace(/\s+/g, "")
        .replace(/^control/, "ctrl")
        .replace(/^(?:command|cmd|⌘)\+/, "ctrl+");
}

answerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (answered) return;
    const match = normalizeCommand(answerInput.value).match(/^ctrl\+([a-z])$/);
    if (!match) {
        feedbackElement.textContent = "Saisis une commande au format Ctrl+lettre, par exemple Ctrl+C.";
        feedbackElement.className = "feedback is-neutral";
        feedbackElement.hidden = false;
        answerInput.focus();
        return;
    }
    answerQuestion(match[1]);
});

document.addEventListener("keydown", (event) => {
    if ((!event.ctrlKey && !event.metaKey) || event.altKey || event.shiftKey) return;
    const key = event.key.toLowerCase();
    if (!shortcuts.some((shortcut) => shortcut.key === key)) return;
    if (currentMission?.kind === "exercise" && event.target instanceof Element && event.target.closest(".text-editor")) {
        if (currentMission.requiredShortcuts.includes(key)) {
            usedShortcuts.add(key);
            checkExercise();
        }
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    answerQuestion(key);
}, true);

for (const [textarea, gutter] of [
    [sourceText, sourceLineNumbers],
    [destinationText, destinationLineNumbers]
]) {
    textarea.addEventListener("input", () => {
        updateLineNumbers(textarea, gutter);
        if (textarea === destinationText) checkExercise();
    });
    textarea.addEventListener("scroll", () => {
        gutter.scrollTop = textarea.scrollTop;
    });
}

nextButton.addEventListener("click", nextQuestion);

startButton.addEventListener("click", nextQuestion);

resetButton.addEventListener("click", () => {
    window.clearTimeout(nextQuestionTimeout);
    window.clearInterval(timerInterval);
    iterationList.replaceChildren();
    const emptyHistory = document.createElement("li");
    emptyHistory.className = "iteration-empty";
    emptyHistory.textContent = "Les durées apparaîtront ici.";
    iterationList.append(emptyHistory);
    score = 0;
    round = 0;
    currentMission = undefined;
    answered = false;
    questionPool = [];
    updateScore();
    roundElement.textContent = "00";
    gameQuestionHeading.textContent = "Quelle est la bonne combinaison ?";
    progressTrack.setAttribute("aria-valuenow", "0");
    progressBar.style.width = "0%";
    missionTimer.textContent = "00:00";
    challengeElement.hidden = true;
    exerciseBoard.hidden = true;
    answerForm.hidden = true;
    promptElement.hidden = true;
    feedbackElement.hidden = true;
    nextButton.hidden = true;
    startButton.hidden = false;
});

missionTimer.textContent = "00:00";
