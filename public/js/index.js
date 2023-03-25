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
          window.open("login.html", "_self");
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

const els = document.getElementsByClassName("needsAdmin");

Array.prototype.forEach.call(
  els,
  (element) => (element.style.display = "display")
);
