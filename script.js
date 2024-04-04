"use strict";

// SELECT ELEMENTS
const addBtnEl = document.querySelector(".btn-add");
const cryptoListEl = document.querySelector(".crypto-list");
const totalValueEl = document.querySelector(".total__value");
const overlayEl = document.querySelector(".overlay");
const formEl = document.querySelector(".form");
const formErrorMsgEl = document.querySelector(".form__error-message");
const errorEl = document.querySelector(".error");
const okBtnEl = document.querySelector(".error__ok");

// HELPER FUNCTIONS


// It takes a string of url and makes a fetch request if the ok property of the response is false throws an error otherwise returns the data
const getJSON = async function (url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Something went wrong (${res.status})`);
  return res.json();
};

// It takes a number and returns the number but formated by currency style of USD
const numToUsd = function (num) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
};


// It makes an object which has id, price,amount,value and code properties 
// Example:
// {id:"bitcoin" , price: 68,870.66 , amount : 2 , value : 137,839.01 , code: 487642387984290}
class Crypto {
  value;
  code = +new Date();
  constructor(id, price, amount, code) {
    this.id = id;
    this.price = price;
    this.amount = amount;
    this._setValue();
    if (!code) return;
    this.code = code;
  }
  _setValue() {
    this.value = this.price * this.amount;
  }
}

// To control the entire app 
class App {
  ownedCryptos = [];
  cryptos = [];
  total = 0;
  constructor() {
    this.init();
  }

  // An async function that is called at the beginning
  init = async function name(params) {
    try {
      this.reset();
      // Add handler to click event on ok button
      okBtnEl.addEventListener("click", this._closeError);
      // Get 1000 cryptos from API
      await this._getCryptos();

      // Get owned cryptos from localstorage and store it in ownedCryptos array
      if (this._getOwnedCryptos()) {
        this._renderCryptoList();
        this._updateTotal();
      }
      // Add options for name input in the form
      this._addCryptoOptions();

      // Attach handlers
      [addBtnEl, overlayEl].forEach((el) =>
        el.addEventListener("click", this._toggleForm)
      );
      formEl.addEventListener("submit", this._addCrypto.bind(this));
      // Attach handler to delete button of each crypto item
      cryptoListEl.addEventListener(
        "click",
        function (e) {
          const deleteBtn = e.target.closest(".crypto-list__delete");
          if (deleteBtn) this._deleteCrypto(+deleteBtn.dataset.code);
          this._renderCryptoList();
          this._updateTotal();
        }.bind(this)
      );
    } catch (err) {
      console.error(`💥 ${err.message}`);
      this._renderErrorMessage(err.message);
    }
  };

  // It takes the code of a crypto object and finds
  // that crypto in the ownedCryptos array and 
  // then deletes it from there and persists the ownedCryptos array  
  _deleteCrypto(code) {
    const indexOfCrypto = this.ownedCryptos.findIndex(
      (crypto) => crypto.code === code
    );
    this.ownedCryptos.splice(indexOfCrypto, 1);
    this._persistOwnedCryptos();
  }

  // It takes a message and place it in the error__message element and then makes the error element appear
  _renderErrorMessage(msg) {
    errorEl.querySelector(".error__message").textContent = msg;
    errorEl.classList.remove("hidden");
  }
  // It make the error message element empty and hides the error element
  _closeError() {
    errorEl.querySelector(".error__message").textContent = "";
    errorEl.classList.add("hidden");
  }
  // It calculates the total value of all owned cryptos and places it in the total value element
  _updateTotal() {
    this.total = this.ownedCryptos.reduce(
      (sum, crypto) => sum + crypto.value,
      0
    );
    totalValueEl.textContent = numToUsd(this.total);
  }

  // It stores the ownedCryptos array in the localstorage
  _persistOwnedCryptos() {
    window.localStorage.setItem("cryptos", JSON.stringify(this.ownedCryptos));
  }
  // It gets the ownedCryptos array from localstorage
  _getOwnedCryptos() {
    const storage = window.localStorage.getItem("cryptos");
    if (!storage) return 0;
    const data = JSON.parse(storage);
    this.ownedCryptos = data.map((oldCrypto) => {
      const newCrypto = this.cryptos.find(
        (crypto) => crypto.id === oldCrypto.id
      );
      return new Crypto(
        newCrypto.id,
        +newCrypto.priceUsd,
        oldCrypto.amount,
        oldCrypto.code
      );
    });
    return 1;
  }

  // ...
  _addCrypto(e) {
    // Prevent from doing default on form submit
    e.preventDefault();
    // Take the data from form
    const dataArr = [...new FormData(formEl)];
    // Convert it to an Object
    const data = Object.fromEntries(dataArr);

    const cryptoId = data.cryptoId;
    const amount = +data.amount;
    // Validation
    const crypto = this.cryptos.find(
      (crypto) => crypto.id === cryptoId.toLowerCase()
    );
    if (crypto && Number.isFinite(amount) && amount > 0) {
      // Clear the form + hide error message
      this._clearForm();
      // Toggle the form
      this._toggleForm();
      // Create a new crypto object and push it to ownedCryptos array
      this.ownedCryptos.push(new Crypto(crypto.id, +crypto.priceUsd, amount));
      // Render Crypto List
      this._renderCryptoList();
      // Update total value
      this._updateTotal();
      // Store ownedCryptos array in the localstorage
      this._persistOwnedCryptos();
    } else {
      // Show this error message in the form
      this._renderOrhideFormErrorMessage("Pleas enter correct values.", true);
    }
  }


  // It clears the crypto list element from the items and puts the new markup in crypto list element 
  _renderCryptoList() {
    // Remove items from crypto list
    this._removeCryptoItems();
    const markup = this.ownedCryptos
      .map((crypto) => this._generateCryptoItemMarkup(crypto))
      .join("");
    cryptoListEl.insertAdjacentHTML("beforeend", markup);
  }

  // Ittakes a crypto object and then generates the markup
  _generateCryptoItemMarkup(cryptoObj) {
    return `
    <li class="crypto-list__item">
    <button class="crypto-list__delete" data-code="${
      cryptoObj.code
    }">❌</button>
          <span>${cryptoObj.id}</span>
          <span>${
            cryptoObj.price > 1
              ? numToUsd(cryptoObj.price)
              : `$${cryptoObj.price.toFixed(8)}`
          }</span>
          <span>${cryptoObj.amount}</span>
          <span>${numToUsd(cryptoObj.value)}</span>
        </li>
    `;
  }

  // This hides the error message of the form and makes the inputs empty
  _clearForm() {
    // Hide error message
    this._renderOrhideFormErrorMessage();
    // Clear each input in the form
    formEl.querySelectorAll("input").forEach((inp) => (inp.value = ""));
  }

  // This can be used to render the error message and hide the error message of the form
  _renderOrhideFormErrorMessage(msg = "", render = false) {
    formErrorMsgEl.textContent = msg;
    if (render) {
      formErrorMsgEl.classList.remove("hidden");
    } else {
      formErrorMsgEl.classList.remove("hidden");
    }
  }

  // This gets 1000 cryptos form API and stores it in cryptos array
  _getCryptos = async function () {
    const data = await getJSON("https://api.coincap.io/v2/assets?limit=1000");
    this.cryptos = data.data;
  };

  // This puts the generated makrup for the crypto options in the datalist element of the form
  _addCryptoOptions() {
    // Render options
    formEl
      .querySelector("datalist")
      .insertAdjacentHTML("afterbegin", this._generateOptionsMarkup());
  }

  // This generates the markup for crypto options
  _generateOptionsMarkup() {
    return this.cryptos
      .map((crypto) => `<option value="${crypto.id}"></option>`)
      .join("");
  }

  // This toggles (hide or show) the form and the overlay
  _toggleForm(e) {
    [overlayEl, formEl].forEach((el) => el.classList.toggle("hidden"));
  }

  // This clears the crypto list element of crypto items
  _removeCryptoItems() {
    cryptoListEl
      .querySelectorAll(".crypto-list__item")
      .forEach((item) => item.remove());
  }

  // This resets the app (removing crypto items , setting total value to $0.00)
  reset() {
    // Remove items from crypto list
    this._removeCryptoItems();
    // Reset total value
    totalValueEl.textContent = "$0.00";
  }
}

const app = new App();
