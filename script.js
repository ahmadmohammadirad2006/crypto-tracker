"use strict";

// Select elements
const addBtnEl = document.querySelector(".btn-add");
const cryptoListEl = document.querySelector(".crypto-list");
const totalValueEl = document.querySelector(".total__value");
const overlayEl = document.querySelector(".overlay");
const formEl = document.querySelector(".form");
const formErrorMsgEl = document.querySelector(".form__error-message");
// Helper functions
const getJSON = async function (url) {
  const res = await fetch(url);
  return res.json();
};

const numToUsd = function (num) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
};

class Crypto {
  value;
  id = +new Date();
  constructor(name, price, amount) {
    this.name = name;
    this.price = price;
    this.amount = amount;
    this._setValue();
  }
  _setValue() {
    this.value = this.price * this.amount;
  }
}

class App {
  ownedCryptos = [];
  cryptos = [];
  total = 0;
  constructor() {
    this.reset();

    // Add options for name input in the form
    this._addCryptoOptions();

    // Attach handlers
    [addBtnEl, overlayEl].forEach((el) =>
      el.addEventListener("click", this._toggleForm)
    );
    formEl.addEventListener("submit", this._addCrypto.bind(this));
  }
  _updateTotal() {
    this.total = this.ownedCryptos.reduce((sum , crypto) =>  sum+crypto.value, 0);
    totalValueEl.textContent = numToUsd(this.total)
  }
  _addCrypto(e) {
    // Prevent from doing default on form submit
    e.preventDefault();
    // Take the data from form
    const dataArr = [...new FormData(formEl)];
    // Convert it to an Object
    const data = Object.fromEntries(dataArr);

    const cryptoName = data.cryptoName;
    const amount = +data.amount;
    // Validation
    const crypto = this.cryptos.find(
      (crypto) => crypto.id === cryptoName.toLowerCase()
    );
    if (crypto && Number.isFinite(amount) && amount > 0) {
      // Clear the form + hide error message
      this._clearForm();
      // Toggle the form
      this._toggleForm();
      // Create a new crypto object and push it to ownedCryptos array
      this.ownedCryptos.push(new Crypto(crypto.name, +crypto.priceUsd, amount));
      // Render Crypto List
      this._renderCryptoList();
      // Update total value
      this._updateTotal()
    } else {
      // Show this error message in the form
      this._renderOrhideFormErrorMessage("Pleas enter correct values.", true);
    }
  }

  _renderCryptoList() {
    // Remove items from crypto list
    this._removeCryptoItems();
    const markup = this.ownedCryptos
      .map((crypto) => this._generateCryptoItemMarkup(crypto))
      .join("");
    cryptoListEl.insertAdjacentHTML("beforeend", markup);
  }

  _generateCryptoItemMarkup(cryptoObj) {
    return `
    <li class="crypto-list__item">
          <span>${cryptoObj.name}</span>
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

  _clearForm() {
    // Hide error message
    this._renderOrhideFormErrorMessage();
    // Clear each input in the form
    formEl.querySelectorAll("input").forEach((inp) => (inp.value = ""));
  }

  _renderOrhideFormErrorMessage(msg = "", render = false) {
    formErrorMsgEl.textContent = msg;
    if (render) {
      formErrorMsgEl.classList.remove("hidden");
    } else {
      formErrorMsgEl.classList.remove("hidden");
    }
  }

  _getCryptos = async function () {
    const data = await getJSON("https://api.coincap.io/v2/assets?limit=600");
    this.cryptos = data.data;
  };

  _addCryptoOptions = async function () {
    // Get 600 first cryptos from API and storing in cryptos array
    await this._getCryptos();
    // Render options
    const markup = formEl
      .querySelector("datalist")
      .insertAdjacentHTML("afterbegin", this._generateOptionsMarkup());
  };

  _generateOptionsMarkup() {
    return this.cryptos
      .map((crypto) => `<option value="${crypto.id}"></option>`)
      .join("");
  }

  _toggleForm(e) {
    [overlayEl, formEl].forEach((el) => el.classList.toggle("hidden"));
  }

  _removeCryptoItems() {
    cryptoListEl
      .querySelectorAll(".crypto-list__item")
      .forEach((item) => item.remove());
  }

  reset() {
    // Remove items from crypto list
    this._removeCryptoItems();
    // Reset total value
    totalValueEl.textContent = "$0";
  }
}

const app = new App();
