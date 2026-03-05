// Example JavaScript file (copied to web/)
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded successfully');
    
    // Example: Add event listeners to links
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            console.log('Navigating to:', this.textContent);
        });
    });
});

// Example function
function handleFormSubmit(event) {
    event.preventDefault();
    console.log('Form submitted');
}
