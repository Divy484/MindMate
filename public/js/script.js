// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }

            form.classList.add('was-validated')
        }, false)
    })
})()

//Type Script for Quotes
const typed = new Typed('.quote-text', {
    strings: [
        "Your mental health is a priority. Your happiness is essential. Your self-care is a necessity.",
        "You don't have to control your thoughts. You just have to stop letting them control you.",
        "It's okay to not be okay, but it's not okay to stay that way.",
        "Healing takes time, and asking for help is a courageous step.",
        "Mental health is not a destination but a process. It's about how you drive, not where you're going.",
        "Your mind is a powerful thing. When you fill it with positive thoughts, your life will start to change.",
        "You are not your illness. You have a story to tell. You have a name, a history, a personality. Staying yourself is part of the battle."
    ],
    typeSpeed: 60,
    backSpeed: 30,
    backDelay: 500,
    loop: true
});

//Floating chat
function openChat(){
    window.location.href = "/chatbot";
}

// JavaScript function to open URLs
function openUrl(url) {
    window.location.href = url;
}

//Emergency Section
function openExercise() {
    window.location.href = "/exercise";
}