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

const els = document.getElementsByClassName("needsAdmin");

Array.prototype.forEach.call(
  els,
  (element) => (element.style.display = "display")
);

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
      //xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.onreadystatechange = function () {
        if (this.readyState === 4) {
          var response = JSON.parse(this.responseText)
          console.log(response)
          if (this.status === 200) {
            descricaoField.value = "a"
          } else {
            alert(`Ocorreu um erro: ${response.message}`);
          }
        }
      }
      xhr.send();
      break;

    case "add":
      document.getElementById("popup_edit").style.display = "none"
      document.getElementById("popup_add").style.display = "block"
      break
  }
}

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
        window.alert(JSON.stringify(response))
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

function deleteStrike(id){

}
