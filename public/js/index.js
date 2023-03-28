window.onload = function () {
  const els = document.getElementsByClassName("needsAdmin");

  if (sessionStorage.getItem("loggedUser")) {
    Array.prototype.forEach.call(
      els,
      (element) => (element.style.display = "display")
    );

    let loginLink = document.getElementById("login-link")
    loginLink.innerHTML = "Sair"
  } else {
    Array.prototype.forEach.call(
      els,
      (element) => (element.style.display = "none")
    );
  }
}

if (location.href == "http://localhost:8081/login" || location.href == "http://localhost:8081/registo") {
  sessionStorage.clear()
}

/**
 * Função de registo de users
 */
function registerUser() {
  //Obter valores do formulario
  var name = document.getElementById("register-username").value;
  var email = document.getElementById("register-email").value;
  var password = document.getElementById("register-password").value;

  if (name && email && password) {
    //Pedido ao servidor utilziado AJAX
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/user");
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        var response = JSON.parse(this.responseText);
        if (this.status === 200) {
          alert("Conta criada com sucesso");
          window.open("/login", "_self");
        } else if (this.status === 409) {
          alert("Já existe um utilizador registado com o email fornecido");
        } else {
          alert(`Ocorreu um erro: ${response.message}`);
        }
      }
    };
    xhr.send(JSON.stringify({ name, email, password }));
  } else {
    alert("Preencha todos os campos");
  }
}

/**
 * Função de login de users
 */
function loginUser() {
  //Obter valores do formulario
  var email = document.getElementById("login-email").value;
  var password = document.getElementById("login-password").value;

  if (email && password) {
    //Pedido ao servidor utilziado AJAX
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/login")
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        var response = JSON.parse(this.responseText)
        if (this.status === 200) {
          alert("Sessão iniciada com sucesso")
          sessionStorage.setItem("loggedUser", JSON.stringify(response.user[0]))
          window.open("/", "_self")
        } else {
          alert(`Ocorreu um erro: ${response.message}`);
        }
      }
    }
    xhr.send(JSON.stringify({ email, password }))
  }
}

/**
 * Função para mostrar todas as greves
 */
function showStrikes() {
  document.getElementsByClassName("container")[0].style.display = "flex"
}



function closePopUp() {
  document.getElementById("popup_allpage").style.display = "none";
}

function openPopUp(type, id) {

  document.getElementById("popup_allpage").style.display = "block";

  const descricaoField = document.getElementById("popup_description");
  const categoryField = document.getElementById("popup_category");
  const startDateField = document.getElementById("popup_startDate");
  const endDateField = document.getElementById("popup_endDate");

  switch(type){
    case "edit":
      document.getElementById("popup_edit").style.display = "block"
      document.getElementById("popup_add").style.display = "none"
      
      var xhr = new XMLHttpRequest();
      xhr.open("GET", `/api/strike/${id}`)
      xhr.onreadystatechange = function () {
        if (this.readyState === 4) {
          var response = JSON.parse(this.responseText)
          if (this.status === 200) {
            var greve = response.greve[0]

            descricaoField.value = greve.description
            categoryField.value = greve.category
            startDateField.value = formatDate(greve.start_date)
            endDateField.value = formatDate(greve.end_date)

          } else {
            alert(`Ocorreu um erro: ${response.message}`);
          }
        }
      }
      xhr.send();

      document.getElementById("popup_edit").addEventListener("click", function () {
        updateStrike(id)
      })

      break;

    case "add":
      document.getElementById("popup_edit").style.display = "none"
      document.getElementById("popup_add").style.display = "block"
      break
  }
}

/**
 * Função para atualizar uma greve
 * @param {int} id ID da greve a atualizar
 */
function updateStrike(id) {
  var description = document.getElementById("popup_description").value;
  var category = document.getElementById("popup_category").value;
  var startDate = document.getElementById("popup_startDate").value;
  var endDate = document.getElementById("popup_endDate").value;

  if (description && category && startDate && endDate) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", `/api/strike/${id}`);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        var response = JSON.parse(this.responseText);
        if (this.status === 200) {
          alert("Greve atualizada com sucesso!");
        } else if (this.status === 400) {
          alert("Preencha todos os campos!");
        } else {
          alert(`Ocorreu um erro: ${response.message}`);
        }
      }
    };
    xhr.send(JSON.stringify({ description, category, startDate, endDate}));
  } else {
    alert("Preencha todos os campos");
  }
}

/**
 * Função para adicionar uma greve
 */
function addStrike(){
  var description = document.getElementById("popup_description").value;
  var category = document.getElementById("popup_category").value;
  var startDate = document.getElementById("popup_startDate").value;
  var endDate = document.getElementById("popup_endDate").value;

  if (description && category && startDate && endDate) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/strike");
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        var response = JSON.parse(this.responseText);
        if (this.status === 200) {
          alert("Greve criada com sucesso!");
        } else if (this.status === 400) {
          alert("Preencha todos os campos!");
        } else {
          alert(`Ocorreu um erro: ${response.message}`);
        }
      }
    };
    xhr.send(JSON.stringify({ description, category, startDate, endDate}));
  } else {
    alert("Preencha todos os campos");
  }
}

/**
 * Função para eliminar uma greve
 * @param {int} id ID da greve a eliminar
 */
function deleteStrike(id){
  var xhr = new XMLHttpRequest();
  xhr.open("DELETE", `/api/strike/${id}`)
  xhr.onreadystatechange = function () {
    if (this.readyState === 4) {
      var response = JSON.parse(this.responseText)
      if (this.status === 200) {
        alert("Greve eliminada com sucesso!")
        location.reload()
      } else {
        alert(`Ocorreu um erro: ${response.message}`);
      }
    }
  }
  xhr.send();
}

/**
 * Função para formatar datas
 * @param {string} date Data a formatar
 * @returns Data formatada
 */
function formatDate(date) {
  var formattedStartDate = new Date(date).toLocaleDateString().split("/")
  return `${formattedStartDate[2]}-${formattedStartDate[1]}-${formattedStartDate[0]}`
}

function togglePassword(passwordField){
  password = document.getElementById(passwordField)
  const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
  password.setAttribute('type', type);
  this.classList.toggle('fa-eye-slash');
}