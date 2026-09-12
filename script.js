/* ==========================================================================
   Modern Neon Glass Calculator - Engine & Interactive Animations
   Author: Om Aditya
   Task: SkillCraft Technology - Task 02
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------------------------------------------
    // DOM Elements
    // ----------------------------------------------------------------------
    const display = document.getElementById("display");
    const previousDisplay = document.getElementById("previous-display");
    const buttons = document.querySelectorAll(".btn");
    const clearButton = document.getElementById("clear");
    const deleteButton = document.getElementById("delete");
    const equalsButton = document.getElementById("equals");
    const copyButton = document.getElementById("copy-btn");
    const toast = document.getElementById("toast");

    // Top Utility Controls
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    const soundToggleBtn = document.getElementById("sound-toggle-btn");
    const soundIconOn = document.getElementById("sound-icon-on");
    const soundIconOff = document.getElementById("sound-icon-off");

    // History Modal Elements
    const historyToggleBtn = document.getElementById("history-toggle-btn");
    const historyDrawer = document.getElementById("history-drawer");
    const closeHistoryBtn = document.getElementById("close-history-btn");
    const clearHistoryBtn = document.getElementById("clear-history-btn");
    const historyList = document.getElementById("history-list");

    // ----------------------------------------------------------------------
    // Calculator State Variables
    // ----------------------------------------------------------------------
    let currentInput = "";
    let previousInput = "";
    let operator = "";
    let shouldResetInput = false;

    // Calculation History
    let calculationHistory = JSON.parse(localStorage.getItem("calc_history") || "[]");

    // Sound FX Preference
    let isSoundEnabled = localStorage.getItem("calc_sound") === "true";

    // Themes List
    const themes = ["dark", "violet", "frost"];
    let currentTheme = localStorage.getItem("calc_theme") || "dark";
    applyTheme(currentTheme);
    updateSoundUI();
    renderHistory();

    // ----------------------------------------------------------------------
    // Web Audio API Synthesizer (Zero external dependencies)
    // ----------------------------------------------------------------------
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
        }
    }

    function playSound(type) {
        if (!isSoundEnabled) return;
        try {
            initAudio();
            if (!audioCtx) return;

            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const now = audioCtx.currentTime;

            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            if (type === "number") {
                osc.type = "sine";
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(180, now + 0.05);
                gainNode.gain.setValueAtTime(0.12, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === "operator") {
                osc.type = "triangle";
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.exponentialRampToValueAtTime(380, now + 0.07);
                gainNode.gain.setValueAtTime(0.15, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
                osc.start(now);
                osc.stop(now + 0.07);
            } else if (type === "equals") {
                osc.type = "sine";
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.setValueAtTime(880, now + 0.06); // A5
                gainNode.gain.setValueAtTime(0.16, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                osc.start(now);
                osc.stop(now + 0.18);
            } else if (type === "clear" || type === "delete") {
                osc.type = "square";
                osc.frequency.setValueAtTime(240, now);
                osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                osc.start(now);
                osc.stop(now + 0.06);
            }
        } catch (e) {
            // Audio context failure gracefully ignored
        }
    }

    // ----------------------------------------------------------------------
    // Button Ripple Effect
    // ----------------------------------------------------------------------
    function createRipple(event, button) {
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement("span");
        ripple.classList.add("ripple");

        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;

        let clientX = event.clientX;
        let clientY = event.clientY;

        // If triggered via keyboard without pointer coordinates
        if (clientX === undefined || clientY === undefined || (clientX === 0 && clientY === 0)) {
            clientX = rect.left + rect.width / 2;
            clientY = rect.top + rect.height / 2;
        }

        ripple.style.width = ripple.style.height = `${diameter}px`;
        ripple.style.left = `${clientX - rect.left - radius}px`;
        ripple.style.top = `${clientY - rect.top - radius}px`;

        const existingRipple = button.querySelector(".ripple");
        if (existingRipple) {
            existingRipple.remove();
        }

        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // ----------------------------------------------------------------------
    // Visual Highlight for Keys
    // ----------------------------------------------------------------------
    function triggerButtonAnimation(button) {
        if (!button) return;
        button.classList.add("btn-pressed");
        setTimeout(() => {
            button.classList.remove("btn-pressed");
        }, 160);
    }

    // ----------------------------------------------------------------------
    // Operator Display Helper
    // ----------------------------------------------------------------------
    function getOperatorSymbol(op) {
        switch (op) {
            case "*": return "×";
            case "/": return "÷";
            case "-": return "−";
            case "+": return "+";
            case "%": return "%";
            default: return op;
        }
    }

    // ----------------------------------------------------------------------
    // Update Display Screen
    // ----------------------------------------------------------------------
    function updateDisplay(triggerAnim = true) {
        if (currentInput === "") {
            display.textContent = "0";
        } else {
            display.textContent = currentInput;
        }

        if (previousInput !== "" && operator !== "") {
            previousDisplay.textContent = `${previousInput} ${getOperatorSymbol(operator)}`;
        } else {
            previousDisplay.textContent = "";
        }

        // Micro pop animation
        if (triggerAnim) {
            display.classList.remove("display-update");
            void display.offsetWidth; // Force DOM reflow
            display.classList.add("display-update");
        }
    }

    // ----------------------------------------------------------------------
    // Number Input
    // ----------------------------------------------------------------------
    function inputNumber(number) {
        if (shouldResetInput) {
            currentInput = "";
            shouldResetInput = false;
        }

        if (number === ".") {
            // Prevent multiple decimals
            if (currentInput.includes(".")) {
                return;
            }
            if (currentInput === "") {
                currentInput = "0.";
                updateDisplay();
                return;
            }
        }

        // Max limit of 15 digits
        if (currentInput.length >= 15) {
            return;
        }

        // Prevent leading redundant zeroes like "00"
        if (currentInput === "0" && number !== ".") {
            currentInput = number;
        } else {
            currentInput += number;
        }

        updateDisplay();
    }

    // ----------------------------------------------------------------------
    // Operator Input
    // ----------------------------------------------------------------------
    function inputOperator(selectedOperator) {
        if (currentInput === "" && previousInput === "") {
            // Allow typing '-' for negative number start
            if (selectedOperator === "-") {
                currentInput = "-";
                updateDisplay();
            }
            return;
        }

        if (currentInput === "-" && previousInput === "") {
            return;
        }

        // Switch operator if one is already pending and no new number typed
        if (currentInput === "" && previousInput !== "") {
            operator = selectedOperator;
            updateDisplay(false);
            return;
        }

        // Chain calculation if both inputs exist
        if (previousInput !== "" && operator !== "") {
            calculate(false);
        }

        previousInput = currentInput;
        currentInput = "";
        operator = selectedOperator;
        shouldResetInput = false;

        updateDisplay(false);
    }

    // ----------------------------------------------------------------------
    // Calculation Engine
    // ----------------------------------------------------------------------
    function calculate(isFinalEqual = true) {
        if (previousInput === "" || currentInput === "" || operator === "") {
            return;
        }

        const num1 = parseFloat(previousInput);
        const num2 = parseFloat(currentInput);
        let result = 0;

        switch (operator) {
            case "+":
                result = num1 + num2;
                break;
            case "-":
                result = num1 - num2;
                break;
            case "*":
                result = num1 * num2;
                break;
            case "/":
                if (num2 === 0) {
                    display.textContent = "Error";
                    previousDisplay.textContent = "Cannot divide by zero";
                    currentInput = "";
                    previousInput = "";
                    operator = "";
                    shouldResetInput = true;
                    return;
                }
                result = num1 / num2;
                break;
            case "%":
                result = num1 % num2;
                break;
            default:
                return;
        }

        // Precision adjustment to avoid 0.1 + 0.2 = 0.30000000000000004
        result = Math.round((result + Number.EPSILON) * 100000000) / 100000000;

        const formulaText = `${previousInput} ${getOperatorSymbol(operator)} ${currentInput} =`;

        if (isFinalEqual) {
            previousDisplay.textContent = formulaText;
            addHistory(formulaText, result.toString());
            shouldResetInput = true;
        }

        currentInput = result.toString();
        previousInput = "";
        operator = "";

        updateDisplay();
    }

    // ----------------------------------------------------------------------
    // Clear Functions
    // ----------------------------------------------------------------------
    function clearCalculator() {
        currentInput = "";
        previousInput = "";
        operator = "";
        shouldResetInput = false;
        display.textContent = "0";
        previousDisplay.textContent = "";
    }

    function deleteLastCharacter() {
        if (shouldResetInput) {
            clearCalculator();
            return;
        }

        if (currentInput === "") {
            return;
        }

        currentInput = currentInput.slice(0, -1);
        updateDisplay();
    }

    // ----------------------------------------------------------------------
    // History Feature
    // ----------------------------------------------------------------------
    function addHistory(formula, result) {
        const item = {
            id: Date.now(),
            formula,
            result,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        calculationHistory.unshift(item);
        if (calculationHistory.length > 25) {
            calculationHistory.pop();
        }

        localStorage.setItem("calc_history", JSON.stringify(calculationHistory));
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = "";

        if (calculationHistory.length === 0) {
            historyList.innerHTML = '<p class="history-empty">No calculations yet</p>';
            return;
        }

        calculationHistory.forEach((item) => {
            const historyItem = document.createElement("div");
            historyItem.classList.add("history-item");
            historyItem.setAttribute("role", "button");
            historyItem.setAttribute("tabindex", "0");
            historyItem.setAttribute("title", "Click to load this result");

            historyItem.innerHTML = `
                <div class="history-item-calc">${item.formula}</div>
                <div class="history-item-result">${item.result}</div>
            `;

            historyItem.addEventListener("click", () => {
                currentInput = item.result;
                shouldResetInput = true;
                updateDisplay();
                closeHistory();
                playSound("number");
                showToast(`Loaded ${item.result}`);
            });

            historyList.appendChild(historyItem);
        });
    }

    function openHistory() {
        historyDrawer.classList.add("active");
        historyDrawer.setAttribute("aria-hidden", "false");
    }

    function closeHistory() {
        historyDrawer.classList.remove("active");
        historyDrawer.setAttribute("aria-hidden", "true");
    }

    // ----------------------------------------------------------------------
    // Theme Switcher
    // ----------------------------------------------------------------------
    function applyTheme(themeName) {
        document.documentElement.setAttribute("data-theme", themeName);
        localStorage.setItem("calc_theme", themeName);
        currentTheme = themeName;
    }

    function cycleTheme() {
        const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        applyTheme(nextTheme);
        showToast(`Theme: ${nextTheme.toUpperCase()}`);
    }

    // ----------------------------------------------------------------------
    // Sound FX UI & Toggle
    // ----------------------------------------------------------------------
    function updateSoundUI() {
        if (isSoundEnabled) {
            soundIconOn.classList.remove("hidden");
            soundIconOff.classList.add("hidden");
            soundToggleBtn.title = "Toggle Sound (Enabled)";
        } else {
            soundIconOn.classList.add("hidden");
            soundIconOff.classList.remove("hidden");
            soundToggleBtn.title = "Toggle Sound (Muted)";
        }
    }

    function toggleSound() {
        isSoundEnabled = !isSoundEnabled;
        localStorage.setItem("calc_sound", isSoundEnabled);
        updateSoundUI();
        if (isSoundEnabled) {
            playSound("operator");
            showToast("Sound FX Enabled 🔊");
        } else {
            showToast("Sound FX Muted 🔇");
        }
    }

    // ----------------------------------------------------------------------
    // Copy Result to Clipboard & Toast
    // ----------------------------------------------------------------------
    let toastTimeout = null;

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 2200);
    }

    function copyResult() {
        const textToCopy = display.textContent;
        if (!textToCopy || textToCopy === "Error") return;

        navigator.clipboard.writeText(textToCopy).then(() => {
            playSound("number");
            showToast(`Copied ${textToCopy} to clipboard!`);
        }).catch(() => {
            showToast("Failed to copy");
        });
    }

    // ----------------------------------------------------------------------
    // Event Listeners - Buttons
    // ----------------------------------------------------------------------
    buttons.forEach((button) => {
        button.addEventListener("click", (e) => {
            createRipple(e, button);
            const value = button.getAttribute("data-value");

            if (button.classList.contains("number")) {
                playSound("number");
                inputNumber(value);
            } else if (button.classList.contains("operator")) {
                if (button.id !== "delete") {
                    playSound("operator");
                    inputOperator(value);
                }
            }
        });
    });

    clearButton.addEventListener("click", (e) => {
        createRipple(e, clearButton);
        playSound("clear");
        clearCalculator();
    });

    deleteButton.addEventListener("click", (e) => {
        createRipple(e, deleteButton);
        playSound("delete");
        deleteLastCharacter();
    });

    equalsButton.addEventListener("click", (e) => {
        createRipple(e, equalsButton);
        playSound("equals");
        calculate(true);
    });

    copyButton.addEventListener("click", (e) => {
        createRipple(e, copyButton);
        copyResult();
    });

    // Theme & Sound Buttons
    themeToggleBtn.addEventListener("click", (e) => {
        createRipple(e, themeToggleBtn);
        cycleTheme();
    });

    soundToggleBtn.addEventListener("click", (e) => {
        createRipple(e, soundToggleBtn);
        toggleSound();
    });

    // History Modal Buttons
    historyToggleBtn.addEventListener("click", (e) => {
        createRipple(e, historyToggleBtn);
        openHistory();
    });

    closeHistoryBtn.addEventListener("click", closeHistory);

    clearHistoryBtn.addEventListener("click", () => {
        calculationHistory = [];
        localStorage.removeItem("calc_history");
        renderHistory();
        playSound("clear");
        showToast("History cleared");
    });

    // Close history drawer when clicking outside content area
    document.addEventListener("click", (e) => {
        if (
            historyDrawer.classList.contains("active") &&
            !historyDrawer.contains(e.target) &&
            !historyToggleBtn.contains(e.target)
        ) {
            closeHistory();
        }
    });

    // ----------------------------------------------------------------------
    // Keyboard Event Handling & Button Flash
    // ----------------------------------------------------------------------
    document.addEventListener("keydown", (event) => {
        const key = event.key;

        // Numbers 0-9
        if (key >= "0" && key <= "9") {
            const btn = document.querySelector(`.btn.number[data-value="${key}"]`);
            triggerButtonAnimation(btn);
            if (btn) createRipple(event, btn);
            playSound("number");
            inputNumber(key);
        }
        // Decimal point
        else if (key === ".") {
            const btn = document.querySelector(`.btn.number[data-value="."]`);
            triggerButtonAnimation(btn);
            if (btn) createRipple(event, btn);
            playSound("number");
            inputNumber(".");
        }
        // Basic Operators
        else if (key === "+" || key === "-" || key === "*" || key === "/" || key === "%") {
            const btn = document.querySelector(`.btn.operator[data-value="${key}"]`);
            triggerButtonAnimation(btn);
            if (btn) createRipple(event, btn);
            playSound("operator");
            inputOperator(key);
        }
        // Enter or Equals
        else if (key === "Enter" || key === "=") {
            event.preventDefault();
            triggerButtonAnimation(equalsButton);
            createRipple(event, equalsButton);
            playSound("equals");
            calculate(true);
        }
        // Backspace
        else if (key === "Backspace") {
            triggerButtonAnimation(deleteButton);
            createRipple(event, deleteButton);
            playSound("delete");
            deleteLastCharacter();
        }
        // Escape / Clear
        else if (key === "Escape") {
            if (historyDrawer.classList.contains("active")) {
                closeHistory();
            } else {
                triggerButtonAnimation(clearButton);
                createRipple(event, clearButton);
                playSound("clear");
                clearCalculator();
            }
        }
    });
});