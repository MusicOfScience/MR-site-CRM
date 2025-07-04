// script.js
document.addEventListener('DOMContentLoaded', function() {
  const categorySelect = document.getElementById('category');
  const subCategoryContainer = document.getElementById('subCategoryContainer');
  const meetingFields = document.getElementById('meetingFields');
  const inquiryForm = document.getElementById('inquiryForm');
  const statusMessage = document.getElementById('statusMessage');

  // Function to adjust form fields based on the chosen category
  categorySelect.addEventListener('change', function() {
    const category = categorySelect.value;
    // Show sub-category options if "Services Australia" is selected
    if (category === "Services Australia") {
      subCategoryContainer.classList.remove('hidden');
    } else {
      subCategoryContainer.classList.add('hidden');
      // Clear any previous sub-category selection
      const radios = subCategoryContainer.querySelectorAll('input[name="subCategory"]');
      radios.forEach(radio => radio.checked = false);
    }
    
    // For Meeting Requests or Event Invitations, display additional meeting fields
    if (category === "Meeting Request" || category === "Event Invitation") {
      meetingFields.classList.remove('hidden');
    } else {
      meetingFields.classList.add('hidden');
    }
  });

  // Handle form submission via AJAX
  inquiryForm.addEventListener('submit', function(e) {
    e.preventDefault();
    statusMessage.textContent = "Submitting...";
    
    const formData = new FormData(inquiryForm);
    // Convert FormData to JSON object
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    
    fetch('/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        statusMessage.textContent = "Your inquiry was submitted successfully.";
        inquiryForm.reset();
        // Hide dynamic fields after reset
        subCategoryContainer.classList.add('hidden');
        meetingFields.classList.add('hidden');
      } else {
        statusMessage.textContent = "There was an error submitting your inquiry. Please try again.";
      }
    })
    .catch(err => {
      console.error("Submission error:", err);
      statusMessage.textContent = "Server error. Please try again later.";
    });
  });
});
