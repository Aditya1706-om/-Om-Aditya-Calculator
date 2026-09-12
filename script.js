
const display = document.getElementById("display");
const previousDisplay = document.getElementById("previous-display");

const buttons = document.querySelectorAll(".btn");

const clearButton = document.getElementById("clear");
const deleteButton = document.getElementById("delete");
const equalsButton = document.getElementById("equals");


// Calculator variables
let currentInput = "";
let previousInput = "";
let operator = "";


// -----------------------------
// Update Display
// -----------------------------

function updateDisplay() {

    if (currentInput === "") {
        display.textContent = "0";
    } else {
        display.textContent = currentInput;
    }

    if (previousInput !== "" && operator !== "") {
        previousDisplay.textContent =
            `${previousInput} ${getOperatorSymbol(operator)}`;
    } else {
        previousDisplay.textContent = "";
    }
}


// -----------------------------
// Operator Symbols
// -----------------------------

function getOperatorSymbol(op) {

    if (op === "*") {
        return "×";
    }

    if (op === "/") {
        return "÷";
    }

    if (op === "-") {
        return "−";
    }

    if (op === "+") {
        return "+";
    }

    if (op === "%") {
        return "%";
    }

    return op;
}


// -----------------------------
// Number Input
// -----------------------------

function inputNumber(number) {

    if (number === ".") {

        // Prevent multiple decimal points
        if (currentInput.includes(".")) {
            return;
        }

        // If decimal is first input
        if (currentInput === "") {
            currentInput = "0.";
            updateDisplay();
            return;
        }
    }

    // Limit very long numbers
    if (currentInput.length >= 15) {
        return;
    }

    currentInput += number;

    updateDisplay();
}


// -----------------------------
// Operator Input
// -----------------------------

function inputOperator(selectedOperator) {

    // Do nothing if there is no number
    if (currentInput === "" && previousInput === "") {
        return;
    }


    // Change operator if already selected
    if (currentInput === "" && previousInput !== "") {
        operator = selectedOperator;
        updateDisplay();
        return;
    }


    // If calculation already exists
    if (previousInput !== "" && operator !== "") {

        calculate();

    }


    previousInput = currentInput;

    currentInput = "";

    operator = selectedOperator;

    updateDisplay();
}


// -----------------------------
// Calculate Result
// -----------------------------

function calculate() {

    if (
        previousInput === "" ||
        currentInput === "" ||
        operator === ""
    ) {
        return;
    }


    const number1 = parseFloat(previousInput);
    const number2 = parseFloat(currentInput);

    let result;


    switch (operator) {

        case "+":

            result = number1 + number2;

            break;


        case "-":

            result = number1 - number2;

            break;


        case "*":

            result = number1 * number2;

            break;


        case "/":

            // Division by zero error
            if (number2 === 0) {

                display.textContent = "Error";

                previousDisplay.textContent =
                    "Cannot divide by zero";

                currentInput = "";
                previousInput = "";
                operator = "";

                return;
            }

            result = number1 / number2;

            break;


        case "%":

            result = number1 % number2;

            break;


        default:

            return;
    }


    // Remove floating point precision problems
    result = Math.round((result + Number.EPSILON) * 100000000) / 100000000;


    previousDisplay.textContent =
        `${previousInput} ${getOperatorSymbol(operator)} ${currentInput} =`;


    currentInput = result.toString();

    previousInput = "";

    operator = "";

    display.textContent = currentInput;
}


// -----------------------------
// Clear Calculator
// -----------------------------

function clearCalculator() {

    currentInput = "";

    previousInput = "";

    operator = "";

    display.textContent = "0";

    previousDisplay.textContent = "";
}


// -----------------------------
// Delete Last Character
// -----------------------------

function deleteLastCharacter() {

    if (currentInput === "") {
        return;
    }

    currentInput =
        currentInput.slice(0, -1);

    updateDisplay();
}


// -----------------------------
// Button Click Events
// -----------------------------

buttons.forEach(function(button) {

    button.addEventListener("click", function() {

        const value =
            button.getAttribute("data-value");


        // Number or decimal
        if (
            button.classList.contains("number")
        ) {

            inputNumber(value);

        }


        // Operator
        else if (
            button.classList.contains("operator")
        ) {

            // Ignore DEL button
            if (button.id !== "delete") {

                inputOperator(value);

            }

        }

    });

});


// -----------------------------
// Clear Button
// -----------------------------

clearButton.addEventListener(
    "click",
    clearCalculator
);


// -----------------------------
// Delete Button
// -----------------------------

deleteButton.addEventListener(
    "click",
    deleteLastCharacter
);


// -----------------------------
// Equals Button
// -----------------------------

equalsButton.addEventListener(
    "click",
    calculate
);


// -----------------------------
// Keyboard Support
// -----------------------------

document.addEventListener("keydown", function(event) {

    const key = event.key;


    // Numbers
    if (
        key >= "0" &&
        key <= "9"
    ) {

        inputNumber(key);

    }


    // Decimal
    else if (key === ".") {

        inputNumber(".");

    }


    // Operators
    else if (
        key === "+" ||
        key === "-" ||
        key === "*" ||
        key === "/" ||
        key === "%"
    ) {

        inputOperator(key);

    }


    // Enter or =
    else if (
        key === "Enter" ||
        key === "="
    ) {

        event.preventDefault();

        calculate();

    }


    // Backspace
    else if (key === "Backspace") {

        deleteLastCharacter();

    }


    // Escape
    else if (key === "Escape") {

        clearCalculator();

    }

});