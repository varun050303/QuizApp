const endpoint = `https://opentdb.com/api`
const categoriesContainer = document.querySelector('.categories')
const customQuizOptions = document.querySelector('.custom-quiz-options')
const quiz = document.querySelector('.quiz')
const categoriesList = document.querySelectorAll('.category')
const categoriesOption = document.querySelector('[data-custom-quiz-option="Select category"]')
const difficultyOption = document.querySelector('[data-custom-quiz-option="Select difficulty"]')
const difficultiesList = document.querySelector('.difficulty-type')
const amountOption = document.querySelector('[data-custom-quiz-option="Select Amount"]')
const heading = document.querySelector('h1')
const scoreEl = document.querySelector('[data-score="0"]')
const percentageEl = document.querySelector('[data-percentage="0"]')
const messageEl = document.querySelector('[data-message]')
const overlayBg = document.querySelector('.overlay-bg')
const modal = document.querySelector('.modal')


let countdown = 0;
let selectedCategory = ''
let selectedDifficulty = ''
let questions = []
let currentQuestionIndex = 0
let userAnswers = [];


//this function is used to get categories of the quiz 
fetch(`${endpoint}_category.php`)
    .then(r => r.json())
    .then(categories => {
        difficultyOption.setAttribute('hidden', true)
        categories.trivia_categories.forEach(category => {
            //for each category a seperate list tag created
            const li = document.createElement('li')
            li.innerText = category.name
            li.dataset.id = category.id
            li.classList.add('category')
            categoriesContainer.appendChild(li)
        });
    })
    .catch(error => {
        console.error('Error fetching categories:', error);
    });


//here we add an eventlistener to listen on which category user has clicked
categoriesContainer.addEventListener('click', (evt) => {
    if (evt.target.matches('.category')) {
        const category = evt.target
        category.classList.add('is-selected')
        selectedCategory = category.dataset.id
        categoriesOption.setAttribute('hidden', true)
        chooseDifficulty()
    }
})


const chooseDifficulty = _ => {
    heading.innerText = 'Choose difficulty'
    difficultyOption.removeAttribute('hidden')

    difficultiesList.addEventListener('click', (evt) => {
        if (evt.target.matches('.difficulty')) {
            const difficulty = evt.target
            selectedDifficulty = difficulty.dataset.difficulty
        }

        customQuizOptions.setAttribute('hidden', true)
        quiz.removeAttribute('hidden')
        startQuiz()
    })
}

function populateQuestion(question) {
    document.querySelectorAll('.option input').forEach(input => {
        input.checked = false;
    });

    console.log(question)

    document.querySelector('.question_number').textContent = (currentQuestionIndex + 1) + '.';
    document.querySelector('.question-text').textContent = question.question;
    const options = [...question.incorrect_answers, question.correct_answer];
    options.sort(() => Math.random() - 0.5); // Shuffle options
    document.querySelectorAll('.option label').forEach((label, index) => {
        label.textContent = options[index];
    });
}

async function startQuiz() {
    questions = await fetchQuestions();
    populateQuestion(questions[currentQuestionIndex]);
}

function startTimer() {
    let timeLeft = 30; // Initial time left
    document.getElementById('countdown').textContent = timeLeft; // Display initial time left
    countdown = setInterval(function () {
        timeLeft--; // Decrement time left
        document.getElementById('countdown').textContent = timeLeft; // Update displayed time left
        if (timeLeft === 0) {
            clearInterval(countdown);// Stop the timer when time is up
            nextQuestion(); // Automatically move to the next question when time is up
        }
    }, 1000); // Timer updates every 1 second (1000 milliseconds)
}

function resetTimer() {
    clearInterval(countdown); // Clear any existing timer
}

function nextQuestion() {
    resetTimer(); // Reset the timer before moving to the next question
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        populateQuestion(questions[currentQuestionIndex]); // Populate the next question
        startTimer(); // Start the timer for the next question
    } else {
        // Quiz ended, handle end of quiz
        document.getElementById('question').textContent = "Quiz Over!";
    }
}


// Function to fetch questions from the API
async function fetchQuestions() {
    try {
        const response = await fetch(`${endpoint}.php?amount=10&category=${selectedCategory}&difficulty=${selectedDifficulty}&type=multiple&encode=url3986`);
        const data = await response.json();
        if (data.response_code === 0) {
            // Decode text before returning questions
            startTimer();
            const decodedQuestions = decodeQuestions(data.results);
            return decodedQuestions;

        } else {
            throw new Error('Failed to fetch questions from the API');
        }
    } catch (error) {
        console.error(error);
    }
}

// Function to decode questions and answers
function decodeQuestions(questions) {
    return questions.map(question => {
        const decodedQuestion = decodeURIComponent(question.question);
        const decodedCorrectAnswer = decodeURIComponent(question.correct_answer);
        const decodedIncorrectAnswers = question.incorrect_answers.map(answer => decodeURIComponent(answer));
        return {
            ...question,
            question: decodedQuestion,
            correct_answer: decodedCorrectAnswer,
            incorrect_answers: decodedIncorrectAnswers
        };
    });
}

document.querySelectorAll('.option input').forEach(input => {
    input.addEventListener('change', function () {
        handleAnswerSelection(); // Getting the label text as the selected answer
    });
});

// Function to display the result
function displayResult(score) {
    const totalQuestions = questions.length;
    const resultPercentage = (score / totalQuestions) * 100;
    scoreEl.innerText = `Score : ${score}`
    percentageEl.innerText = `Percentage : ${resultPercentage}%`
    messageEl.innerText = `You  scored ${score} out of ${totalQuestions} (${resultPercentage}%)`;

}

// Function to handle answer selection
function handleAnswerSelection() {
    // Check if an option is selected
    const selectedLabel = document.querySelector('input[name="Options"]:checked + label');
    if (!selectedLabel) {
        console.log('Please select an answer.');
        return; // Exit the function if no option is selected
    }

    // Retrieve the text of the selected label
    const selectedAnswer = selectedLabel.textContent.trim();

    // Log the selected answer
    console.log('Selected Answer:', selectedAnswer);

    // Add the 'is-selected' class to the parent element (for styling purposes)
    selectedLabel.parentElement.classList.add('is-selected');

    // Store the selected answer in the userAnswers array
    userAnswers[currentQuestionIndex] = selectedAnswer;

    // Wait for 2 seconds before moving to the next question
    setTimeout(() => {
        // Remove the 'is-selected' class from the parent element
        selectedLabel.parentElement.classList.remove('is-selected');

        // Move to the next question or display result if it's the last question
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            populateQuestion(questions[currentQuestionIndex]);
        } else {
            // No more questions, display result
            modal.removeAttribute('hidden');
            overlayBg.style.zIndex = 9;
            const score = calculateScore();
            displayResult(score);
        }
    }, 2000); // 2000 milliseconds = 2 seconds
}


// Function to calculate the score
function calculateScore() {
    // Initialize score to 0
    let score = 0;
    // Log user's answers and correct answers for debugging
    console.log('User Answers:', userAnswers);
    console.log('Correct Answers:', questions.map(question => question.correct_answer));
    // Iterate through each question
    questions.forEach((question, index) => {
        // Check if user answered this question
        if (userAnswers[index]) {
            // Compare user's answer with correct answer
            if (userAnswers[index] === question.correct_answer) {
                // If user's answer is correct, increment the score
                score++;
            }
        }
    });
    return score;
}
