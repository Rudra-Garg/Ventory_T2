document.addEventListener("DOMContentLoaded", function () {
    const certificateForm = document.getElementById("certificateForm");
    const searchForm = document.getElementById("searchForm");

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

    certificateForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const submitButton = certificateForm.querySelector("button[type='submit']");
        toggleLoading(submitButton, true);

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        fetch(`/create?candidate_name=${name}&candidate_email=${email}`)
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
                }
            })
            .catch(error => {
                toggleLoading(submitButton, false);
                console.error('Error:', error);
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

        fetch(`/search?type=${searchType}&query=${searchInput}`)
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
            });
    });
});
