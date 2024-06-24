document.addEventListener("DOMContentLoaded", function () {
    const authForm = document.getElementById("authForm");
    const authContainer = document.getElementById("authContainer");
    const mainContainer = document.getElementById("mainContainer");
    const certificateForm = document.getElementById("certificateForm");
    const searchForm = document.getElementById("searchForm");
    let authKey = document.getElementById("authKey").value;
    function toggleLoading(button, isLoading) {
        const btnText = button.querySelector(".btn-text");
        const loadingIcon = button.querySelector(".loading-icon");

        if (isLoading) {
            btnText.style.display = "none";
            loadingIcon.classList.remove("hidden");
            button.disabled = true;
        } else {
            btnText.style.display = "inline-block";
            loadingIcon.classList.add("hidden");
            button.disabled = false;
        }
    }

    authForm.addEventListener("submit", function (event) {
        event.preventDefault();
        authKey = document.getElementById("authKey").value;
        const submitButton = authForm.querySelector("button[type='submit']");
        toggleLoading(submitButton, true);

        fetch('/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ auth_key: authKey }),
        })
        .then(response => response.json())
        .then(data => {
            toggleLoading(submitButton, false);
            if (data.success) {
                authContainer.classList.add("hidden");
                mainContainer.classList.remove("hidden");
            } else {
                alert(data.message);
            }
        })
        .catch((error) => {
            toggleLoading(submitButton, false);
            console.error('Error:', error);
            alert("An error occurred during authentication.");
        });
    });

    certificateForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const submitButton = certificateForm.querySelector("button[type='submit']");
        toggleLoading(submitButton, true);

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        fetch(`/create?candidate_name=${encodeURIComponent(name)}&candidate_email=${encodeURIComponent(email)}&auth_key=${authKey}`)
            .then(response => response.json())
            .then(data => {
                toggleLoading(submitButton, false);
                if (data.certificate_url) {
                    const createMessageDiv = document.getElementById('createMessage');
                    const certificateLink = document.getElementById('certificateLink');
                    certificateLink.href = data.local_url;
                    createMessageDiv.classList.remove('hidden');
                } else {
                    console.error('Invalid response:', data);
                    alert("An error occurred while creating the certificate.");
                }
            })
            .catch(error => {
                toggleLoading(submitButton, false);
                console.error('Error:', error);
                alert("An error occurred while creating the certificate.");
            });
    });

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const submitButton = searchForm.querySelector("button[type='submit']");
        toggleLoading(submitButton, true);

        const searchType = document.getElementById('searchType').value;
        const searchInput = document.getElementById('searchInput').value;
        const searchResultsDiv = document.getElementById('searchResults');
        const certificateList = document.getElementById('certificateList');

        fetch(`/search?type=${encodeURIComponent(searchType)}&query=${encodeURIComponent(searchInput)}&auth_key=${authKey}`)
            .then(response => response.json())
            .then(data => {
                toggleLoading(submitButton, false);
                certificateList.innerHTML = '';
                if (data.length > 0) {
                    data.forEach(certificate => {
                        const listItem = document.createElement('li');
                        const certificateLink = document.createElement('a');
                        certificateLink.href = certificate.local_url;
                        certificateLink.target = '_blank';
                        certificateLink.textContent = `${certificate.candidate_name} - ${certificate.candidate_email}`;
                        listItem.appendChild(certificateLink);
                        certificateList.appendChild(listItem);
                    });
                    searchResultsDiv.classList.remove('hidden');
                } else {
                    const noResultsMessage = document.createElement('p');
                    noResultsMessage.textContent = 'No certificates found.';
                    certificateList.appendChild(noResultsMessage);
                    searchResultsDiv.classList.remove('hidden');
                }
            })
            .catch(error => {
                toggleLoading(submitButton, false);
                console.error('Error:', error);
                alert("An error occurred while searching for certificates.");
            });
    });
});