// Data and state
const validUsername = 'sarahhilton';
const validPassword = 'giveaway';

const coins = [
  { symbol: 'BTC', name: 'Bitcoin', balance: 200000 },
  { symbol: 'USDT', name: 'Tether', balance: 250000 },
  { symbol: 'SOL', name: 'Solana', balance: 150000 },
  { symbol: 'ETH', name: 'Ethereum', balance: 100000 },
];

const networks = ['Ethereum', 'Binance Smart Chain', 'Solana', 'Polygon'];
const fee = 500;

let currentUser = null;
let currentCoins = [...coins];
let currentTransfer = null; // { coinSymbol, type }

const loginScreen = document.getElementById('login-screen');
const walletScreen = document.getElementById('wallet-screen');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

const totalBalanceEl = document.getElementById('total-balance');
const coinsSection = document.getElementById('coins-section');
const transferOutTotalBtn = document.getElementById('transfer-out-total');

const transferModal = document.getElementById('transfer-modal');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');
const transferForm = document.getElementById('transfer-form');
const transferAmountInput = document.getElementById('transfer-amount');
const transferNetworkSelect = document.getElementById('transfer-network');
const walletAddressInput = document.getElementById('wallet-address');
const feeInfo = document.getElementById('fee-info');
const transferMessage = document.getElementById('transfer-message');
const networkGroup = document.getElementById('network-group');
const submitTransferBtn = document.getElementById('submit-transfer-btn');

// Helper functions

function calcTotalBalance() {
  return currentCoins.reduce((sum, c) => sum + c.balance, 0);
}

function formatUSD(amount) {
  return '$' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderWallet() {
  totalBalanceEl.textContent = formatUSD(calcTotalBalance());

  coinsSection.innerHTML = '';
  currentCoins.forEach((coin) => {
    const card = document.createElement('div');
    card.className = 'coin-card';

    card.innerHTML = `
      <div class="coin-header">
        <div class="coin-name">${coin.name} (${coin.symbol})</div>
        <div class="coin-balance">${formatUSD(coin.balance)}</div>
      </div>
      <div class="coin-buttons">
        <button class="transfer-in">Transfer In</button>
        <button class="transfer-out-coin">Transfer Out</button>
      </div>
    `;

    const btns = card.querySelectorAll('button');
    btns[0].addEventListener('click', () => openTransferModal(coin.symbol, 'in'));
    btns[1].addEventListener('click', () => openTransferModal(coin.symbol, 'out'));

    coinsSection.appendChild(card);
  });
}

function openTransferModal(coinSymbol, type) {
  currentTransfer = { coinSymbol, type };
  transferMessage.textContent = '';
  transferAmountInput.value = '';
  walletAddressInput.value = '';
  feeInfo.textContent = '';

  modalTitle.textContent = `${type === 'in' ? 'Transfer In' : 'Transfer Out'} ${coinSymbol === 'TOTAL' ? 'Total Balance' : coinSymbol}`;
  
  // Show network selector only for Transfer Out
  networkGroup.style.display = type === 'out' ? 'block' : 'none';

  // Show fee info for Transfer Out only
  feeInfo.textContent = type === 'out' ? `A fee of $${fee} will be deducted for this transfer.` : '';

  transferModal.classList.remove('hidden');
}

function closeTransferModal() {
  transferModal.classList.add('hidden');
}

function validateLogin(username, password) {
  return username === validUsername && password === validPassword;
}

// Event Handlers

loginBtn.addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (validateLogin(username, password)) {
    currentUser = username;
    loginScreen.classList.add('hidden');
    walletScreen.classList.remove('hidden');
    renderWallet();
  } else {
    loginError.textContent = 'Incorrect username or password.';
  }
});

modalClose.addEventListener('click', closeTransferModal);

transferForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const amount = parseFloat(transferAmountInput.value);
  const walletAddr = walletAddressInput.value.trim();
  const network = transferNetworkSelect.value;

  if (!walletAddr) {
    alert('Please enter a wallet address.');
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid amount.');
    return;
  }

  if (!currentTransfer) return;

  const { coinSymbol, type } = currentTransfer;
  const totalBalance = calcTotalBalance();

  if (type === 'out') {
    if (coinSymbol === 'TOTAL') {
      if (amount + fee > totalBalance) {
        alert('Insufficient balance for this transfer and fee.');
        return;
      }
      // Deduct proportionally from all coins
      let remaining = amount + fee;
      currentCoins = currentCoins.map((c) => {
        const ratio = c.balance / totalBalance;
        let deduction = +(ratio * remaining).toFixed(2);
        if (deduction > c.balance) deduction = c.balance;
        return { ...c, balance: c.balance - deduction };
      });
    } else {
      const coin = currentCoins.find(c => c.symbol === coinSymbol);
      if (!coin) {
        alert('Coin not found.');
        return;
      }
      if (amount + fee > coin.balance) {
        alert('Insufficient balance for this transfer and fee.');
        return;
      }
      currentCoins = currentCoins.map(c =>
        c.symbol === coinSymbol ? { ...c, balance: c.balance - amount - fee } : c
      );
    }
    transferMessage.textContent = `Transfer Out of ${formatUSD(amount)} initiated on ${network}. Fee $${fee} deducted.`;
  } else {
    // Transfer In adds balance, no fee
    currentCoins = currentCoins.map(c =>
      c.symbol === coinSymbol ? { ...c, balance: c.balance + amount } : c
    );
    transferMessage.textContent = `Transfer In of ${formatUSD(amount)} received.`;
  }

  renderWallet();

  // Reset form after success
  transferAmountInput.value = '';
  walletAddressInput.value = '';

  // Optionally disable submit button after success for 3 seconds
  submitTransferBtn.disabled = true;
  setTimeout(() => {
    submitTransferBtn.disabled = false;
    transferMessage.textContent = '';
    closeTransferModal();
  }, 3000);
});

transferOutTotalBtn.addEventListener('click', () => {
  openTransferModal('TOTAL', 'out');
});
