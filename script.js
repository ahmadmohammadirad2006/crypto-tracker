"use strict";

// Select elements
const addBtnEl = document.querySelector(".btn-add");
const cryptoListEl = document.querySelector(".crypto-list");
const totalValueEl = document.querySelector(".total__value");
const overlayEl = document.querySelector(".overlay");
const formEl = document.querySelector(".form");
const formErrorMsgEl = document.querySelector(".form__error-message");
const errorEl = document.querySelector(".error");
const okBtnEl = document.querySelector(".error__ok");
// Helper functions
const getJSON = async function (url) {
  const res = await fetch(url);
  console.log(res)
  if (!res.ok) throw new Error(`Something went wrong (${res.status})`);
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
  constructor(id, price, amount) {
    this.id = id;
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
    this.init();
  }
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
    } catch (err) {
      console.error(`💥 ${err.message}`);
      this._renderErrorMessage(err.message);
    }
  };

  _renderErrorMessage(msg) {
    errorEl.querySelector(".error__message").textContent = msg;
    errorEl.classList.remove("hidden");
  }
  _closeError() {
    errorEl.querySelector(".error__message").textContent = "";
    errorEl.classList.add("hidden");
  }

  _updateTotal() {
    this.total = this.ownedCryptos.reduce(
      (sum, crypto) => sum + crypto.value,
      0
    );
    totalValueEl.textContent = numToUsd(this.total);
  }
  _persistOwnedCryptos() {
    window.localStorage.setItem("cryptos", JSON.stringify(this.ownedCryptos));
  }
  _getOwnedCryptos() {
    const storage = window.localStorage.getItem("cryptos");
    if (!storage) return 0;
    const data = JSON.parse(storage);
    console.log(data);
    this.ownedCryptos = data.map((oldCrypto) => {
      const newCrypto = this.cryptos.find(
        (crypto) => crypto.id === oldCrypto.id
      );
      return new Crypto(newCrypto.id, +newCrypto.priceUsd, oldCrypto.amount);
    });
    return 1;
  }

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
    const data = await getJSON("https://api.coincap.io/v2/assets?limit=1000");
    this.cryptos = data.data;
  };

  _addCryptoOptions() {
    // Render options
    formEl
      .querySelector("datalist")
      .insertAdjacentHTML("afterbegin", this._generateOptionsMarkup());
  }

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
