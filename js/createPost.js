
var modal = document.getElementById("create-post-modal");

var createpost = document.getElementById("create-post-form");


var btn = document.getElementById("create-post-button");
var sendbtn = document.getElementById("submit");

var span = document.getElementsByClassName("close")[0];

// Kun käyttäjä klikkaa nappia, avaa modali
btn.onclick = function () {
    modal.style.display = "block";
}

span.onclick = function () {
    modal.style.display = "none";
}

// Kun käyttäjä klikkaa lähetä-nappia, sulje modali
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

document.getElementById('create-post-form').addEventListener('keydown', function (event) {
    if (event.keyCode == 13 && event.target.nodeName != 'TEXTAREA') {
        event.preventDefault();
    }
});

// Rajoitetaan postauksen pituus 200 merkkiin
document.getElementById('post-content-textarea').addEventListener('input', function () {
    if (this.value.length > 200) {
        this.value = this.value.substring(0, 200);
    }
    // Päivitetään merkkilaskuri char-counter-elementtiin
    document.getElementById('char-counter').innerText = this.value.length + '/200';
});




//HTML-encode XSS vastaan, esim '<' muutetaan '&lt;':ksi jne.
function htmlEncode(text) {
    var div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}


document.getElementById('create-post-form').addEventListener('submit', function (event) {
    event.preventDefault();
 
    let postContent = htmlEncode(document.getElementById('post-content-textarea').value);
    const token = localStorage.getItem('jwtToken');

    let postLocation = htmlEncode(document.getElementById('post-location').value);
    let postStartDate = htmlEncode(document.getElementById('post-date').value);
    let postEndDate = htmlEncode(document.getElementById('post-end-date').value);
    // let postStartDate = html.getElementById('post-date').value;
    // let postEndDate = html.getElementById('post-end-date').value;

    const formData = new FormData();


    console.log('postStartDate:', postStartDate, 'postEndDate:', postEndDate)


    
    // Add other form fields to the FormData object
    formData.append('kuvaus', postContent);
    formData.append('location', postLocation);
    formData.append('startDate', postStartDate);
    formData.append('endDate', postEndDate);
    
    
    

    console.log( 'kuvaus:', postContent, 'Picture:', formData)
    if (!token) {
        alert('You must be logged in to create a post!');
        return;
    }

    fetch('/api/posts', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        body: formData
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to create post');
            }
        })
        .then(data => {
            console.log('Post created:', data);
            alert('Post created successfully!');
            modal.style.display = "none";
            window.location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error creating post: ' + error.message);
        });
});