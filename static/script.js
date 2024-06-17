document.getElementById('certificateForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    fetch(`/create?candidate_name=${name}&candidate_email=${email}`)
        .then(response => response.json())
        .then(data => {
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
            console.error('Error:', error);
        });
});

document.getElementById('searchForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const searchType = document.getElementById('searchType').value;
    const searchInput = document.getElementById('searchInput').value;
    const searchResultsDiv = document.getElementById('searchResults');
    const certificateList = document.getElementById('certificateList');


    fetch(`/search?type=${searchType}&query=${searchInput}`)
        .then(response => response.json())
        .then(data => {
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
            console.error('Error:', error);
        });
});
