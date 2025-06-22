document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').addEventListener('submit', send_email)

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'none'
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = '';
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      // ... do something else with emails ...
      emails.forEach(mail => {
        const element = document.createElement('div');
        
        element.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">From : ${mail.sender}</h5>
            <p class="card-text">Subject : ${mail.subject}</p>
            <p class="card-text">At : ${mail.timestamp}</p>
          </div>
        </div>
        <br/>`;

        const card = element.querySelector('.card');

        if(mail.read) {
          card.className = 'card text-white bg-secondary mb-3';
        }

        element.addEventListener('click', function() {
            console.log('This element has been clicked!')

            // change read status to true
            fetch(`/emails/${mail.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  read: true
              })
            }).then(() => {
              card.className = 'card text-white bg-secondary mb-3';
              show_content(mail.id, mailbox);
            })
        });
        
        document.querySelector('#emails-view').append(element);
      });
  });
}

function send_email(event) {
  event.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // send an email and load sent mailbox
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      console.log(result);
      load_mailbox('sent');
  });
}

function show_content(id, current_mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'block'
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#content-view').innerHTML = '';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      // ... do something else with email ...
      document.querySelector('#content-view').innerHTML = `
        <h2>Sub : ${email.subject}</h2>
        <h6>To : ${email.recipients}</h6>
        <h6>From : ${email.sender}</h6>
        <small>At : ${email.timestamp}</small>
        <br/><br/><br/>
        <p>${email.body}</p>
      `;

      if(current_mailbox != 'sent') {
        // email does not belong to sent. can be archived or not archived.
        if(email.archived) {
          // email is archived, create unarchive button

          const unarchive = document.createElement('div');
          unarchive.innerHTML = '<button type="button" class="btn btn-primary" id="unarchive">Unarchive</button>';
          unarchive.addEventListener('click', function() {
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: false
              })
            })
            .then(() => {
              load_mailbox('inbox');
            });
          });
          document.querySelector('#content-view').append(unarchive);
        } else {
          // email is not archived, create archive button

          const archive = document.createElement('div');
          archive.innerHTML = '<button type="button" class="btn btn-primary" id="archive">Archive</button>';
          archive.addEventListener('click', function() {
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: true
              })
            })
            .then(() => {
              load_mailbox('inbox');
            });
          });
          document.querySelector('#content-view').append(archive);
        }
      }

      // adding a reply button
      const reply = document.createElement('div');
      reply.innerHTML = '<br/><button type="button" class="btn btn-success">Reply</button>';
      reply.addEventListener('click', function() {
          compose_email();
          document.querySelector('#compose-recipients').value = `${email.sender}`;
          if(email.subject.includes('Re: ')) {
            document.querySelector('#compose-subject').value = `${email.subject}`;
          } else {
            document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
          }
          document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.recipients} wrote: ${email.body}`;
      });
      document.querySelector('#content-view').append(reply);
  });
}